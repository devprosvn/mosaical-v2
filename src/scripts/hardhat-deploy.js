
const hre = require("hardhat");
const fs = require('fs');

async function main() {
  console.log('🚀 Deploying contracts to Saga chainlet using Hardhat...');
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "MOSAIC");

  // Deploy MockGameNFT
  const MockGameNFT = await hre.ethers.getContractFactory("MockGameNFT");
  const mockNFT = await MockGameNFT.deploy("Test Game NFT", "TGNFT");
  await mockNFT.waitForDeployment();
  console.log("MockGameNFT deployed to:", await mockNFT.getAddress());

  // Deploy GovernanceToken
  const GovernanceToken = await hre.ethers.getContractFactory("GovernanceToken");
  const govToken = await GovernanceToken.deploy("Mosaical Governance", "MSCLGOV");
  await govToken.waitForDeployment();
  console.log("GovernanceToken deployed to:", await govToken.getAddress());

  // Deploy GameFiOracleV3
  const GameFiOracleV3 = await hre.ethers.getContractFactory("GameFiOracleV3");
  const oracle = await GameFiOracleV3.deploy();
  await oracle.waitForDeployment();
  console.log("GameFiOracleV3 deployed to:", await oracle.getAddress());

  // Deploy NFTVaultV3
  const NFTVaultV3 = await hre.ethers.getContractFactory("NFTVaultV3");
  const vault = await NFTVaultV3.deploy(await oracle.getAddress());
  await vault.waitForDeployment();
  console.log("NFTVaultV3 deployed to:", await vault.getAddress());

  // Deploy MosaicalGovernance
  const MosaicalGovernance = await hre.ethers.getContractFactory("MosaicalGovernance");
  const governance = await MosaicalGovernance.deploy(await govToken.getAddress());
  await governance.waitForDeployment();
  console.log("MosaicalGovernance deployed to:", await governance.getAddress());

  // Deploy DPOTokenV3
  const DPOTokenV3 = await hre.ethers.getContractFactory("DPOTokenV3");
  const dpoToken = await DPOTokenV3.deploy();
  await dpoToken.waitForDeployment();
  console.log("DPOTokenV3 deployed to:", await dpoToken.getAddress());

  // Deploy LoanManagerV3
  const LoanManagerV3 = await hre.ethers.getContractFactory("LoanManagerV3");
  const loanManager = await LoanManagerV3.deploy(
    await vault.getAddress(),
    await dpoToken.getAddress()
  );
  await loanManager.waitForDeployment();
  console.log("LoanManagerV3 deployed to:", await loanManager.getAddress());

  // Deploy MosaicalSagaBridge
  const MosaicalSagaBridge = await hre.ethers.getContractFactory("MosaicalSagaBridge");
  const bridge = await MosaicalSagaBridge.deploy("0x1234567890123456789012345678901234567890");
  await bridge.waitForDeployment();
  console.log("MosaicalSagaBridge deployed to:", await bridge.getAddress());

  // Save deployment info
  const network = hre.network.name;
  const deploymentInfo = {
    network: network,
    chainletId: "mosaical_2745549204473000-1",
    rpcUrl: hre.network.config.url,
    timestamp: new Date().toISOString(),
    contracts: {
      MockGameNFT: await mockNFT.getAddress(),
      GovernanceToken: await govToken.getAddress(),
      GameFiOracleV3: await oracle.getAddress(),
      NFTVaultV3: await vault.getAddress(),
      MosaicalGovernance: await governance.getAddress(),
      DPOTokenV3: await dpoToken.getAddress(),
      LoanManagerV3: await loanManager.getAddress(),
      MosaicalSagaBridge: await bridge.getAddress()
    }
  };

  if (!fs.existsSync('deployments')) {
    fs.mkdirSync('deployments');
  }

  fs.writeFileSync(
    `deployments/${network}-deployment.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log('✅ All contracts deployed successfully!');
  console.log(`📄 Deployment info saved to deployments/${network}-deployment.json`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
