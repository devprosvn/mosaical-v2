
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔧 Setting up deployed contracts...");
  
  // Load deployment info
  const deploymentPath = path.join(__dirname, "../deployments/saga-deployment.json");
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ Deployment file not found. Please deploy contracts first.");
    return;
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const { contracts } = deployment;
  
  // Get contract instances
  const oracle = await hre.ethers.getContractAt("GameFiOracleV3", contracts.GameFiOracleV3);
  const nftVault = await hre.ethers.getContractAt("NFTVaultV3", contracts.NFTVaultV3);
  const dpoToken = await hre.ethers.getContractAt("DPOTokenV3", contracts.DPOTokenV3);
  const mockNFT = await hre.ethers.getContractAt("MockGameNFT", contracts.MockGameNFT);
  
  try {
    // 1. Set DPO token in NFT Vault
    console.log("1️⃣ Setting DPO token address in NFT Vault...");
    await nftVault.setDPOToken(contracts.DPOTokenV3);
    console.log("✅ DPO token address set in NFT Vault");
    
    // 2. Authorize Oracle updaters (using deployer for now)
    console.log("2️⃣ Authorizing Oracle updaters...");
    const [deployer] = await hre.ethers.getSigners();
    await oracle.authorizeUpdater(deployer.address, true);
    console.log("✅ Oracle updater authorized");
    
    // 3. Add supported collection
    console.log("3️⃣ Adding MockGameNFT as supported collection...");
    await nftVault.addSupportedCollection(contracts.MockGameNFT);
    console.log("✅ MockGameNFT added as supported collection");
    
    // 4. Set risk tier for test collection
    console.log("4️⃣ Setting risk tier for MockGameNFT...");
    await nftVault.setCollectionRiskTier(contracts.MockGameNFT, 2); // Medium risk
    console.log("✅ Risk tier set to 2 (Medium risk)");
    
    // 5. Set collection as GameFi in Oracle
    console.log("5️⃣ Setting MockGameNFT as GameFi collection...");
    await oracle.updateCollectionMetrics(
      contracts.MockGameNFT,
      hre.ethers.parseEther("10"), // 10 ETH volume
      1000, // 1000 holders
      50,   // 50 listings
      30 * 24 * 3600, // 30 days avg hold time
      true  // is GameFi
    );
    console.log("✅ MockGameNFT marked as GameFi collection");
    
    // 6. Set initial floor price
    console.log("6️⃣ Setting initial floor price...");
    await oracle.updateFloorPrice(contracts.MockGameNFT, hre.ethers.parseEther("1")); // 1 DPSV
    console.log("✅ Initial floor price set to 1 DPSV");
    
    console.log("\n🎉 Setup completed successfully!");
    console.log("\n📋 Configuration Summary:");
    console.log(`📍 MockGameNFT: ${contracts.MockGameNFT}`);
    console.log(`📍 Risk Tier: 2 (Medium)`);
    console.log(`📍 Floor Price: 1 DPSV`);
    console.log(`📍 GameFi Status: Enabled`);
    console.log(`📍 DPO Token Integration: Enabled`);
    
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;
