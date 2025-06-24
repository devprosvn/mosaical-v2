const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

// Configuration
const LIQUIDITY_AMOUNT_ETH = "1.0"; // Amount of ETH to add as liquidity
const FLOOR_PRICE_ETH = "0.1";      // Floor price for NFTs in ETH
const NUM_NFTS_TO_MINT = 5;         // Number of NFTs to mint

// Helper to load deployment data
const loadDeployment = () => {
  const deploymentPath = path.join(__dirname, 'YourDeploymentPath'); // YourDeploymentPath
  if (fs.existsSync(deploymentPath)) {
    return JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  }
  return null;
};

// Helper to save deployment data
const saveDeployment = (deploymentInfo) => {
  const deploymentPath = path.join(__dirname, 'YourDeploymentPath'); // YourDeploymentPath
  const deploymentDir = path.dirname(deploymentPath);
  
  // Create deployments directory if it doesn't exist
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }
  
  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log('\n📄 DEPLOYMENT INFO SAVED');
  console.log('------------------------');
  console.log(`Deployment info saved to: ${deploymentPath}`);
};

// Step 1: Deploy Contracts
async function deployContracts() {
  console.log('📄 STEP 1: DEPLOYING CONTRACTS');
  console.log('------------------------------');
  
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with account: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} DPSV`);
  
  // Deploy MockGameNFT
  console.log('\nDeploying MockGameNFT...');
  const MockGameNFT = await ethers.getContractFactory("MockGameNFT");
  const mockNFT = await MockGameNFT.deploy("Test Game NFT", "TGNFT");
  await mockNFT.waitForDeployment();
  console.log(`MockGameNFT deployed to: ${await mockNFT.getAddress()}`);
  
  // Deploy GovernanceToken
  console.log('\nDeploying GovernanceToken...');
  const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
  const govToken = await GovernanceToken.deploy("Devpros Governance", "DPSGOV");
  await govToken.waitForDeployment();
  console.log(`GovernanceToken deployed to: ${await govToken.getAddress()}`);
  
  // Deploy GameFiOracleV3
  console.log('\nDeploying GameFiOracleV3...');
  const GameFiOracleV3 = await ethers.getContractFactory("GameFiOracleV3");
  const oracle = await GameFiOracleV3.deploy();
  await oracle.waitForDeployment();
  console.log(`GameFiOracleV3 deployed to: ${await oracle.getAddress()}`);
  
  // Deploy NFTVaultV3
  console.log('\nDeploying NFTVaultV3...');
  const NFTVaultV3 = await ethers.getContractFactory("NFTVaultV3");
  const vault = await NFTVaultV3.deploy(await oracle.getAddress());
  await vault.waitForDeployment();
  console.log(`NFTVaultV3 deployed to: ${await vault.getAddress()}`);
  
  // Deploy MosaicalGovernance
  console.log('\nDeploying MosaicalGovernance...');
  const MosaicalGovernance = await ethers.getContractFactory("MosaicalGovernance");
  const governance = await MosaicalGovernance.deploy(await govToken.getAddress());
  await governance.waitForDeployment();
  console.log(`MosaicalGovernance deployed to: ${await governance.getAddress()}`);
  
  // Deploy DPOTokenV3
  console.log('\nDeploying DPOTokenV3...');
  const DPOTokenV3 = await ethers.getContractFactory("DPOTokenV3");
  const dpoToken = await DPOTokenV3.deploy();
  await dpoToken.waitForDeployment();
  console.log(`DPOTokenV3 deployed to: ${await dpoToken.getAddress()}`);
  
  return {
    mockNFT,
    govToken,
    oracle,
    vault,
    governance,
    dpoToken,
    deployer
  };
}

// Step 2: Initialize Contract Relationships
async function initializeContracts(contracts) {
  console.log('\n📄 STEP 2: INITIALIZING CONTRACT RELATIONSHIPS');
  console.log('--------------------------------------------');
  
  const { mockNFT, dpoToken, vault } = contracts;
  
  // Set DPO token in vault
  console.log('Setting DPOToken in NFTVault...');
  const setDPOTx = await vault.setDPOToken(await dpoToken.getAddress());
  await setDPOTx.wait();
  console.log('✅ DPOToken set in NFTVault');
  
  // Authorize vault as minter for DPO token
  console.log('\nAuthorizing NFTVault as minter for DPOToken...');
  const authMinterTx = await dpoToken.authorizeMinter(await vault.getAddress());
  await authMinterTx.wait();
  console.log('✅ NFTVault authorized as DPO token minter');
  
  // Add a supported collection to the vault
  console.log('\nAdding MockGameNFT as supported collection...');
  const addCollectionTx = await vault.addSupportedCollection(await mockNFT.getAddress());
  await addCollectionTx.wait();
  console.log('✅ MockGameNFT added as supported collection');
  
  // Set risk tier for the collection
  console.log('\nSetting risk tier for MockGameNFT...');
  const setRiskTierTx = await vault.setCollectionRiskTier(await mockNFT.getAddress(), 2);
  await setRiskTierTx.wait();
  console.log('✅ Risk tier set for MockGameNFT');
}

// Step 3: Update Oracle Price
async function updateOraclePrice(contracts) {
  console.log('\n📄 STEP 3: UPDATING ORACLE PRICE');
  console.log('-------------------------------');
  
  const { mockNFT, oracle } = contracts;
  
  const floorPrice = ethers.parseEther(FLOOR_PRICE_ETH);
  console.log(`Setting floor price for MockGameNFT to ${FLOOR_PRICE_ETH} ETH...`);
  
  const updatePriceTx = await oracle.updateFloorPrice(await mockNFT.getAddress(), floorPrice);
  await updatePriceTx.wait();
  console.log('✅ Floor price updated successfully');
  
  // Also update utility score and metrics for comprehensive data
  await oracle.updateUtilityScore(await mockNFT.getAddress(), 1, 85);
  await oracle.updateCollectionMetrics(await mockNFT.getAddress(), 1, 1, 1, 1, true);
  console.log('✅ Utility score and collection metrics updated');
}

// Step 4: Add Liquidity
async function addLiquidity(contracts) {
  console.log('\n📄 STEP 4: ADDING LIQUIDITY TO VAULT');
  console.log('----------------------------------');
  
  const { vault, deployer } = contracts;
  
  const liquidityAmount = ethers.parseEther(LIQUIDITY_AMOUNT_ETH);
  console.log(`Adding ${LIQUIDITY_AMOUNT_ETH} ETH to NFTVault...`);
  
  const addLiquidityTx = await deployer.sendTransaction({
    to: await vault.getAddress(),
    value: liquidityAmount
  });
  
  await addLiquidityTx.wait();
  console.log('✅ Liquidity added successfully');
  
  const vaultBalance = await ethers.provider.getBalance(await vault.getAddress());
  console.log(`Current vault balance: ${ethers.formatEther(vaultBalance)} ETH`);
}

// Step 5: Mint Test NFTs
async function mintTestNFTs(contracts) {
  console.log('\n📄 STEP 5: MINTING TEST NFTS');
  console.log('---------------------------');
  
  const { mockNFT, deployer } = contracts;
  
  console.log(`Minting ${NUM_NFTS_TO_MINT} NFTs to ${deployer.address}...`);
  
  for (let i = 0; i < NUM_NFTS_TO_MINT; i++) {
    const mintTx = await mockNFT.safeMint(deployer.address);
    await mintTx.wait();
    console.log(`✅ NFT #${i + 1} minted successfully`);
  }
  
  const nftBalance = await mockNFT.balanceOf(deployer.address);
  console.log(`Current NFT balance: ${nftBalance} NFTs`);
}

// Get contract instances from addresses
async function getContractInstances(addresses) {
  const MockGameNFT = await ethers.getContractFactory("MockGameNFT");
  const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
  const GameFiOracleV3 = await ethers.getContractFactory("GameFiOracleV3");
  const NFTVaultV3 = await ethers.getContractFactory("NFTVaultV3");
  const MosaicalGovernance = await ethers.getContractFactory("MosaicalGovernance");
  const DPOTokenV3 = await ethers.getContractFactory("DPOTokenV3");
  
  const [deployer] = await ethers.getSigners();
  
  return {
    mockNFT: MockGameNFT.attach(addresses.MockGameNFT),
    govToken: GovernanceToken.attach(addresses.GovernanceToken),
    oracle: GameFiOracleV3.attach(addresses.GameFiOracleV3),
    vault: NFTVaultV3.attach(addresses.NFTVaultV3),
    governance: MosaicalGovernance.attach(addresses.MosaicalGovernance),
    dpoToken: DPOTokenV3.attach(addresses.DPOTokenV3),
    deployer
  };
}

async function main() {
  console.log('🚀 MOSAICAL DEFI - MODULAR SETUP SCRIPT 🚀');
  console.log('==========================================');
  console.log('Available steps:');
  console.log('1. Deploy all contracts');
  console.log('2. Initialize contract relationships');
  console.log('3. Update oracle floor prices');
  console.log('4. Add liquidity to the vault');
  console.log('5. Mint test NFTs');
  console.log('==========================================\n');

  // Get command line arguments
  const args = process.argv.slice(2);
  const stepsToRun = args.length > 0 ? 
    args.map(arg => parseInt(arg)) : 
    [1, 2, 3, 4, 5]; // Default: run all steps
  
  console.log(`Running steps: ${stepsToRun.join(', ')}`);
  
  try {
    // Load existing deployment if available
    let deployment = loadDeployment();
    let contracts = null;
    
    // Step 1: Deploy Contracts
    if (stepsToRun.includes(1)) {
      contracts = await deployContracts();
      
      // Save deployment info
      const deploymentInfo = {
        network: "YourNetwork", // YourNetwork
        chainletId: "YourChainletId", // YourChainletId 
        rpcUrl: "YourRPCURL", // YourRPCURL
        blockExplorer: "YourBlockExplorer", // YourBlockExplorer
        timestamp: new Date().toISOString(),
        contracts: {
          MockGameNFT: await contracts.mockNFT.getAddress(),
          GovernanceToken: await contracts.govToken.getAddress(),
          GameFiOracleV3: await contracts.oracle.getAddress(),
          NFTVaultV3: await contracts.vault.getAddress(),
          MosaicalGovernance: await contracts.governance.getAddress(),
          DPOTokenV3: await contracts.dpoToken.getAddress(),
        }
      };
      
      saveDeployment(deploymentInfo);
    } else if (deployment) {
      // Use existing deployment addresses
      console.log('\n📄 Using existing deployment:');
      console.log(`MockGameNFT: ${deployment.contracts.MockGameNFT}`);
      console.log(`GameFiOracleV3: ${deployment.contracts.GameFiOracleV3}`);
      console.log(`NFTVaultV3: ${deployment.contracts.NFTVaultV3}`);
      console.log(`DPOTokenV3: ${deployment.contracts.DPOTokenV3}`);
      
      // Get contract instances from addresses
      contracts = await getContractInstances(deployment.contracts);
    } else {
      console.error('❌ No deployment found and step 1 not included. Please run step 1 first or provide a deployment file.');
      process.exit(1);
    }
    
    // Step 2: Initialize Contract Relationships
    if (stepsToRun.includes(2)) {
      await initializeContracts(contracts);
    }
    
    // Step 3: Update Oracle Price
    if (stepsToRun.includes(3)) {
      await updateOraclePrice(contracts);
    }
    
    // Step 4: Add Liquidity
    if (stepsToRun.includes(4)) {
      await addLiquidity(contracts);
    }
    
    // Step 5: Mint Test NFTs
    if (stepsToRun.includes(5)) {
      await mintTestNFTs(contracts);
    }
    
    console.log('\n🎉 SETUP COMPLETE! 🎉');
    console.log('==================');
    console.log('\nFrontend Contract Constants:');
    console.log('---------------------------');
    console.log(`NFTVault: "${await contracts.vault.getAddress()}",`);
    console.log(`DPOToken: "${await contracts.dpoToken.getAddress()}",`);
    console.log(`GameFiOracle: "${await contracts.oracle.getAddress()}",`);
    console.log(`MosaicalGovernance: "${await contracts.governance.getAddress()}",`);
    console.log(`MockGameNFT: "${await contracts.mockNFT.getAddress()}"`);
    
    console.log('\nNext Steps:');
    console.log('1. Copy these contract addresses to your frontend constants file');
    console.log('2. Start your frontend with npm run dev');
    console.log('3. Connect with MetaMask to the devpros network');
    console.log('4. The NFTs are in your wallet and ready to be used!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

// Export functions for use in other scripts
module.exports = {
  deployContracts,
  initializeContracts,
  updateOraclePrice,
  addLiquidity,
  mintTestNFTs,
  getContractInstances
}; 