const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function verifyContracts() {
    console.log('🔍 Verifying contracts on devpros Saga Explorer...');

    try {
        // Load deployment info
        const deploymentPath = path.join(__dirname, '../deployments/saga-deployment.json');
        if (!fs.existsSync(deploymentPath)) {
            console.error('❌ No deployment found. Please deploy contracts first.');
            return;
        }

        const deployment = JSON.parse(fs.readFileSync(deploymentPath));
        console.log('📋 Loaded deployment info for verification');

        const contracts = deployment.contracts;

        console.log('🚀 Verification commands for each contract:\n');

        // MockGameNFT
        console.log('🔍 MockGameNFT:');
        console.log(`npx hardhat verify \\
  --network devpros \\
  ${contracts.MockGameNFT} \\
  "Test Game NFT" "TGNFT"\n`);

        // GovernanceToken
        console.log('🔍 GovernanceToken:');
        console.log(`npx hardhat verify \\
  --network devpros \\
  ${contracts.GovernanceToken} \\
  "Devpros Governance" "DPSGOV"\n`);

        // GameFiOracleV3
        console.log('🔍 GameFiOracleV3:');
        console.log(`npx hardhat verify \\
  --network devpros \\
  ${contracts.GameFiOracleV3}\n`);

        // NFTVaultV3
        console.log('🔍 NFTVaultV3:');
        console.log(`npx hardhat verify \\
  --network devpros \\
  ${contracts.NFTVaultV3} \\
  ${contracts.GameFiOracleV3}\n`);

        // MosaicalGovernance
        console.log('🔍 MosaicalGovernance:');
        console.log(`npx hardhat verify \\
  --network devpros \\
  ${contracts.MosaicalGovernance} \\
  ${contracts.GovernanceToken}\n`);

        // DPOTokenV3
        console.log('🔍 DPOTokenV3:');
        console.log(`npx hardhat verify \\
  --network devpros \\
  ${contracts.DPOTokenV3}\n`);

        // LoanManagerV3
        console.log('🔍 LoanManagerV3:');
        console.log(`npx hardhat verify \\
  --network devpros \\
  ${contracts.LoanManagerV3} \\
  ${contracts.NFTVaultV3} \\
  ${contracts.DPOTokenV3}\n`);

        // MosaicalSagaBridge
        console.log('🔍 MosaicalSagaBridge:');
        console.log(`npx hardhat verify \\
  --network devpros \\
  ${contracts.MosaicalSagaBridge} \\
  "0xcca6F4EA7e82941535485C2363575404C3061CD2"\n`);

        console.log('📋 You can run these commands individually to verify each contract.');
        console.log(`🌐 Check verification status on: ${deployment.blockExplorer || 'https://devpros-2749656616387000-1.sagaexplorer.io'}`);

    } catch (error) {
        console.error('❌ Verification setup failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    verifyContracts();
}

module.exports = { verifyContracts };