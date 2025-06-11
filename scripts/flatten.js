
const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('📄 Flattening contracts for manual verification...');
  
  const contracts = [
    "MockGameNFT",
    "GovernanceToken", 
    "GameFiOracleV3",
    "NFTVaultV3",
    "MosaicalGovernance",
    "DPOTokenV3",
    "LoanManagerV3",
    "MosaicalSagaBridge"
  ];

  // Ensure flattened directory exists
  const flattenedDir = path.join(__dirname, '../flattened');
  if (!fs.existsSync(flattenedDir)) {
    fs.mkdirSync(flattenedDir, { recursive: true });
  }

  for (const contractName of contracts) {
    try {
      console.log(`🔄 Flattening ${contractName}...`);
      
      const flattened = await hre.run("flatten:get-flattened-sources", {
        files: [`contracts/${contractName}.sol`]
      });

      const outputPath = path.join(flattenedDir, `${contractName}_flat.sol`);
      fs.writeFileSync(outputPath, flattened);
      
      console.log(`✅ ${contractName}_flat.sol created`);
    } catch (error) {
      console.error(`❌ Failed to flatten ${contractName}:`, error.message);
    }
  }

  console.log('\n🎉 All contracts flattened successfully!');
  console.log('📁 Check ./flattened/ directory for manual verification');
  console.log('\n📋 Manual verification info:');
  console.log('- Solidity version: 0.8.21');
  console.log('- Optimization: Enabled with 200 runs');
  console.log('- EVM Version: shanghai (default)');
  console.log('- License: MIT');
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
