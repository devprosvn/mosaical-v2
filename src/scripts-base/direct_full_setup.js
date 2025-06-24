const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// CONFIGURATION
const RPC_URL = "Your RPC URL"; // Your RPC URL
const PRIVATE_KEY = "0xYourPrivateKey"; // Your private key
const LIQUIDITY_AMOUNT_DPSV = "10000.0"; // Amount of DPSV to add as liquidity
const FLOOR_PRICE_DPSV = "10000.0";      // Floor price for NFTs in DPSV
const NUM_NFTS_TO_MINT = 5;         // Number of NFTs to mint

// Read ABI files
const readAbiAndBytecode = (contractName) => {
  try {
    const artifactPath = path.join(__dirname, `../artifacts/contracts/${contractName}.sol/${contractName}.json`);
    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      return {
        abi: artifact.abi,
        bytecode: artifact.bytecode
      };
    } else {
      console.error(`❌ Artifact for ${contractName} not found at ${artifactPath}`);
      console.error(`Make sure you've compiled the contracts with 'npx hardhat compile'`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error reading ABI for ${contractName}:`, error);
    process.exit(1);
  }
};

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
  
  console.log(`\n📄 Deployment info saved to: ${deploymentPath}`);
};

// Step 1: Deploy Contracts
async function deployContracts(wallet, provider) {
  console.log('\n📄 STEP 1: DEPLOYING CONTRACTS');
  console.log('------------------------------');
  
  // Deploy MockGameNFT
  console.log('\nDeploying MockGameNFT...');
  const MockGameNFT = readAbiAndBytecode('MockGameNFT');
  const mockNFTFactory = new ethers.ContractFactory(
    MockGameNFT.abi, 
    MockGameNFT.bytecode,
    wallet
  );
  const mockNFT = await mockNFTFactory.deploy("Test Game NFT", "TGNFT");
  await mockNFT.waitForDeployment();
  const mockNFTAddress = await mockNFT.getAddress();
  console.log(`MockGameNFT deployed to: ${mockNFTAddress}`);
  
  // Deploy GovernanceToken
  console.log('\nDeploying GovernanceToken...');
  const GovernanceToken = readAbiAndBytecode('GovernanceToken');
  const govTokenFactory = new ethers.ContractFactory(
    GovernanceToken.abi,
    GovernanceToken.bytecode,
    wallet
  );
  const govToken = await govTokenFactory.deploy("Devpros Governance", "DPSGOV");
  await govToken.waitForDeployment();
  const govTokenAddress = await govToken.getAddress();
  console.log(`GovernanceToken deployed to: ${govTokenAddress}`);
  
  // Deploy GameFiOracleV3
  console.log('\nDeploying GameFiOracleV3...');
  const GameFiOracleV3 = readAbiAndBytecode('GameFiOracleV3');
  const oracleFactory = new ethers.ContractFactory(
    GameFiOracleV3.abi,
    GameFiOracleV3.bytecode,
    wallet
  );
  const oracle = await oracleFactory.deploy();
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log(`GameFiOracleV3 deployed to: ${oracleAddress}`);
  
  // Deploy NFTVaultV3
  console.log('\nDeploying NFTVaultV3...');
  const NFTVaultV3 = readAbiAndBytecode('NFTVaultV3');
  const vaultFactory = new ethers.ContractFactory(
    NFTVaultV3.abi,
    NFTVaultV3.bytecode,
    wallet
  );
  const vault = await vaultFactory.deploy(oracleAddress);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log(`NFTVaultV3 deployed to: ${vaultAddress}`);
  
  // Deploy MosaicalGovernance
  console.log('\nDeploying MosaicalGovernance...');
  const MosaicalGovernance = readAbiAndBytecode('MosaicalGovernance');
  const governanceFactory = new ethers.ContractFactory(
    MosaicalGovernance.abi,
    MosaicalGovernance.bytecode,
    wallet
  );
  const governance = await governanceFactory.deploy(govTokenAddress);
  await governance.waitForDeployment();
  const governanceAddress = await governance.getAddress();
  console.log(`MosaicalGovernance deployed to: ${governanceAddress}`);
  
  // Deploy DPOTokenV3
  console.log('\nDeploying DPOTokenV3...');
  const DPOTokenV3 = readAbiAndBytecode('DPOTokenV3');
  const dpoTokenFactory = new ethers.ContractFactory(
    DPOTokenV3.abi,
    DPOTokenV3.bytecode,
    wallet
  );
  const dpoToken = await dpoTokenFactory.deploy();
  await dpoToken.waitForDeployment();
  const dpoTokenAddress = await dpoToken.getAddress();
  console.log(`DPOTokenV3 deployed to: ${dpoTokenAddress}`);
  
  // Return contract addresses
  return {
    mockNFTAddress,
    govTokenAddress,
    oracleAddress,
    vaultAddress,
    governanceAddress,
    dpoTokenAddress,
    // Return contract instances for convenience
    contracts: {
      mockNFT,
      govToken,
      oracle,
      vault,
      governance,
      dpoToken
    }
  };
}

// Step 2: Initialize Contract Relationships
async function initializeContracts(wallet, addresses) {
  console.log('\n📄 STEP 2: INITIALIZING CONTRACT RELATIONSHIPS');
  console.log('--------------------------------------------');
  
  // Get contract ABIs
  const NFTVaultV3 = readAbiAndBytecode('NFTVaultV3');
  const DPOTokenV3 = readAbiAndBytecode('DPOTokenV3');
  
  // Connect to contracts
  const vault = new ethers.Contract(addresses.vaultAddress, NFTVaultV3.abi, wallet);
  const dpoToken = new ethers.Contract(addresses.dpoTokenAddress, DPOTokenV3.abi, wallet);
  
  // Set DPO token in vault
  console.log('Setting DPOToken in NFTVault...');
  const setDPOTx = await vault.setDPOToken(addresses.dpoTokenAddress);
  await setDPOTx.wait();
  console.log('✅ DPOToken set in NFTVault');
  
  // Authorize vault as minter for DPO token
  console.log('\nAuthorizing NFTVault as minter for DPOToken...');
  const authMinterTx = await dpoToken.authorizeMinter(addresses.vaultAddress);
  await authMinterTx.wait();
  console.log('✅ NFTVault authorized as DPO token minter');
  
  // Add a supported collection to the vault
  console.log('\nAdding MockGameNFT as supported collection...');
  const addCollectionTx = await vault.addSupportedCollection(addresses.mockNFTAddress);
  await addCollectionTx.wait();
  console.log('✅ MockGameNFT added as supported collection');
  
  // Set risk tier for the collection
  console.log('\nSetting risk tier for MockGameNFT...');
  const setRiskTierTx = await vault.setCollectionRiskTier(addresses.mockNFTAddress, 2);
  await setRiskTierTx.wait();
  console.log('✅ Risk tier set for MockGameNFT');
}

// Step 3: Update Oracle Price
async function updateOraclePrice(wallet, addresses) {
  console.log('\n📄 STEP 3: UPDATING ORACLE PRICE');
  console.log('-------------------------------');
  
  // Get contract ABIs
  const GameFiOracleV3 = readAbiAndBytecode('GameFiOracleV3');
  
  // Connect to Oracle contract
  const oracle = new ethers.Contract(addresses.oracleAddress, GameFiOracleV3.abi, wallet);
  
  const floorPrice = ethers.parseEther(FLOOR_PRICE_DPSV);
  console.log(`Setting floor price for MockGameNFT to ${FLOOR_PRICE_DPSV} DPSV...`);
  
  const updatePriceTx = await oracle.updateFloorPrice(addresses.mockNFTAddress, floorPrice);
  await updatePriceTx.wait();
  console.log('✅ Floor price updated successfully');
  
  // Also update utility score and metrics for comprehensive data
  await oracle.updateUtilityScore(addresses.mockNFTAddress, 1, 85);
  await oracle.updateCollectionMetrics(addresses.mockNFTAddress, 1, 1, 1, 1, true);
  console.log('✅ Utility score and collection metrics updated');
}

// Step 4: Add Liquidity
async function addLiquidity(wallet, provider, addresses) {
  console.log('\n📄 STEP 4: ADDING LIQUIDITY TO VAULT');
  console.log('----------------------------------');
  
  const liquidityAmount = ethers.parseEther(LIQUIDITY_AMOUNT_DPSV);
  console.log(`Adding ${LIQUIDITY_AMOUNT_DPSV} DPSV to NFTVault...`);
  
  const addLiquidityTx = await wallet.sendTransaction({
    to: addresses.vaultAddress,
    value: liquidityAmount
  });
  
  await addLiquidityTx.wait();
  console.log('✅ Liquidity added successfully');
  
  const vaultBalance = await provider.getBalance(addresses.vaultAddress);
  console.log(`Current vault balance: ${ethers.formatEther(vaultBalance)} DPSV`);
}

// Step 5: Mint Test NFTs
async function mintTestNFTs(wallet, addresses) {
  console.log('\n📄 STEP 5: MINTING TEST NFTS');
  console.log('---------------------------');
  
  // Get contract ABIs
  const MockGameNFT = readAbiAndBytecode('MockGameNFT');
  
  // Connect to MockGameNFT contract
  const mockNFT = new ethers.Contract(addresses.mockNFTAddress, MockGameNFT.abi, wallet);
  
  console.log(`Minting ${NUM_NFTS_TO_MINT} NFTs to ${wallet.address}...`);
  
  for (let i = 0; i < NUM_NFTS_TO_MINT; i++) {
    const mintTx = await mockNFT.safeMint(wallet.address);
    await mintTx.wait();
    console.log(`✅ NFT #${i + 1} minted successfully`);
  }
  
  const nftBalance = await mockNFT.balanceOf(wallet.address);
  console.log(`Current NFT balance: ${nftBalance} NFTs`);
}

// Main function
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
    // Connect to the provider
    console.log('Connecting to RPC endpoint:', RPC_URL);
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    // Create wallet from private key
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log(`Using account: ${wallet.address}`);
    
    const balance = await provider.getBalance(wallet.address);
    console.log(`Account balance: ${ethers.formatEther(balance)} DPSV`);
    
    // Load existing deployment if available
    let deployment = loadDeployment();
    let addresses = {};
    
    // Step 1: Deploy Contracts
    if (stepsToRun.includes(1)) {
      const deployedContracts = await deployContracts(wallet, provider);
      
      // Update addresses with deployed contract addresses
      addresses = {
        mockNFTAddress: deployedContracts.mockNFTAddress,
        govTokenAddress: deployedContracts.govTokenAddress,
        oracleAddress: deployedContracts.oracleAddress,
        vaultAddress: deployedContracts.vaultAddress,
        governanceAddress: deployedContracts.governanceAddress,
        dpoTokenAddress: deployedContracts.dpoTokenAddress
      };
      
      // Save deployment info
      const deploymentInfo = {
        network: "YourNetwork",
        chainletId: "YourChainletId",
        rpcUrl: RPC_URL,
        blockExplorer: "YourBlockExplorer",
        timestamp: new Date().toISOString(),
        contracts: {
          MockGameNFT: addresses.mockNFTAddress,
          GovernanceToken: addresses.govTokenAddress,
          GameFiOracleV3: addresses.oracleAddress,
          NFTVaultV3: addresses.vaultAddress,
          MosaicalGovernance: addresses.governanceAddress,
          DPOTokenV3: addresses.dpoTokenAddress,
        }
      };
      
      saveDeployment(deploymentInfo);
    } else if (deployment) {
      // Use existing deployment addresses
      addresses = {
        mockNFTAddress: deployment.contracts.MockGameNFT,
        govTokenAddress: deployment.contracts.GovernanceToken,
        oracleAddress: deployment.contracts.GameFiOracleV3,
        vaultAddress: deployment.contracts.NFTVaultV3,
        governanceAddress: deployment.contracts.MosaicalGovernance,
        dpoTokenAddress: deployment.contracts.DPOTokenV3
      };
      
      console.log('\n📄 Using existing deployment:');
      console.log(`MockGameNFT: ${addresses.mockNFTAddress}`);
      console.log(`GameFiOracleV3: ${addresses.oracleAddress}`);
      console.log(`NFTVaultV3: ${addresses.vaultAddress}`);
      console.log(`DPOTokenV3: ${addresses.dpoTokenAddress}`);
    } else {
      console.error('❌ No deployment found and step 1 not included. Please run step 1 first or provide a deployment file.');
      process.exit(1);
    }
    
    // Step 2: Initialize Contract Relationships
    if (stepsToRun.includes(2)) {
      await initializeContracts(wallet, addresses);
    }
    
    // Step 3: Update Oracle Price
    if (stepsToRun.includes(3)) {
      await updateOraclePrice(wallet, addresses);
    }
    
    // Step 4: Add Liquidity
    if (stepsToRun.includes(4)) {
      await addLiquidity(wallet, provider, addresses);
    }
    
    // Step 5: Mint Test NFTs
    if (stepsToRun.includes(5)) {
      await mintTestNFTs(wallet, addresses);
    }
    
    console.log('\n🎉 SETUP COMPLETE! 🎉');
    console.log('==================');
    console.log('\nFrontend Contract Constants:');
    console.log('---------------------------');
    console.log(`NFTVault: "${addresses.vaultAddress}",`);
    console.log(`DPOToken: "${addresses.dpoTokenAddress}",`);
    console.log(`GameFiOracle: "${addresses.oracleAddress}",`);
    console.log(`MosaicalGovernance: "${addresses.governanceAddress}",`);
    console.log(`MockGameNFT: "${addresses.mockNFTAddress}"`);
    
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
  mintTestNFTs
}; 