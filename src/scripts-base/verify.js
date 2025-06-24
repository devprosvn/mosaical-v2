const hre = require("hardhat");

async function main() {
  console.log("🔍 Starting contract verification process...");

  // Load deployment addresses
  const deploymentPath = "YourDeploymentPath"; // YourDeploymentPath
  const fs = require('fs');

  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ Deployment file not found. Please run deployment first.");
    return;
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  const contracts = deployment.contracts;

  console.log("📋 Found contracts to verify:", Object.keys(contracts));

  // Print verification commands for manual use
  console.log("\n📝 Manual verification commands:");
  console.log("================================");

  for (const [name, address] of Object.entries(contracts)) {
    let constructorArgs = [];

    // Set constructor arguments based on contract type
    switch (name) {
      case "MockGameNFT":
        constructorArgs = ["Test Game NFT", "TGNFT"];
        break;
      case "GovernanceToken":
        constructorArgs = ["Devpros Governance", "DPSGOV"];
        break;
      case "GameFiOracleV3":
        constructorArgs = [];
        break;
      case "NFTVaultV3":
        constructorArgs = [contracts.GameFiOracleV3];
        break;
      case "MosaicalGovernance":
        constructorArgs = [contracts.GovernanceToken];
        break;
      case "DPOTokenV3":
        constructorArgs = [];
        break;
      case "LoanManagerV3":
        constructorArgs = [contracts.NFTVaultV3, contracts.DPOTokenV3];
        break;
      case "MosaicalSagaBridge":
        constructorArgs = ["YourWalletAddress"]; // YourWalletAddress
        break;
      default:
        console.log(`⚠️ Unknown constructor args for ${name}, using empty array`);
    }

    const argsString = constructorArgs.length > 0 ? ` \\\n  ${constructorArgs.map(arg => `"${arg}"`).join(' \\\n  ')}` : '';

    console.log(`# Verify ${name}`);
    console.log(`npx hardhat verify \\`);
    console.log(`  --network devpros \\`);
    console.log(`  ${address}${argsString}`);
    console.log('');
  }

  console.log("\n🔧 For flattened contract verification:");
  console.log("=====================================");
  console.log("1. Use Solidity version: 0.8.21");
  console.log("2. Optimization: Enabled with 200 runs");
  console.log("3. EVM Version: shanghai (default)");
  console.log("4. License: MIT");
  console.log("\n5. Flattened files are available in ./flattened/ directory");

  // Verify each contract programmatically
  for (const [name, address] of Object.entries(contracts)) {
    console.log(`\n🔍 Verifying ${name} at ${address}...`);

    try {
      let constructorArgs = [];

      // Set constructor arguments based on contract type
      switch (name) {
        case "MockGameNFT":
          constructorArgs = ["Test Game NFT", "TGNFT"];
          break;
        case "GovernanceToken":
          constructorArgs = ["Devpros Governance", "DPSGOV"];
          break;
        case "GameFiOracleV3":
          constructorArgs = [];
          break;
        case "NFTVaultV3":
          constructorArgs = [contracts.GameFiOracleV3];
          break;
        case "MosaicalGovernance":
          constructorArgs = [contracts.GovernanceToken];
          break;
        case "DPOTokenV3":
          constructorArgs = [];
          break;
        case "LoanManagerV3":
          constructorArgs = [contracts.NFTVaultV3, contracts.DPOTokenV3];
          break;
        case "MosaicalSagaBridge":
          constructorArgs = ["YourWalletAddress"]; // YourWalletAddress
          break;
        default:
          console.log(`⚠️ Unknown constructor args for ${name}, using empty array`);
      }

      await hre.run("verify:verify", {
        address: address,
        constructorArguments: constructorArgs,
      });

      console.log(`✅ ${name} verified successfully!`);

    } catch (error) {
      if (error.message.toLowerCase().includes("already verified")) {
        console.log(`✅ ${name} is already verified`);
      } else {
        console.error(`❌ Failed to verify ${name}:`, error.message);
        console.log(`💡 Try manual verification with flattened contract from ./flattened/${name}_flat.sol`);
      }
    }
  }

  console.log("\n🎉 Verification process completed!");
  console.log("🔗 You can view verified contracts on:");
  console.log(`   ${deployment.blockExplorer}`);
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