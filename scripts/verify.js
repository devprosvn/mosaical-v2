
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function verifyContracts() {
    console.log('🔍 Verifying contracts on Saga Explorer...');
    
    try {
        // Load deployment info
        const deploymentPath = `deployments/${process.env.NETWORK}-deployment.json`;
        if (!fs.existsSync(deploymentPath)) {
            console.error('❌ No deployment found. Please deploy contracts first.');
            return;
        }
        
        const deployment = JSON.parse(fs.readFileSync(deploymentPath));
        console.log('📋 Loaded deployment info for verification');
        
        const contracts = deployment.contracts;
        
        // Verify contracts in order (dependencies first)
        const verificationSteps = [
            {
                name: 'MockGameNFT',
                address: contracts.MockGameNFT,
                constructorArgs: ['"Test Game NFT"', '"TGNFT"']
            },
            {
                name: 'GovernanceToken', 
                address: contracts.GovernanceToken,
                constructorArgs: ['"Mosaical Governance"', '"MSCLGOV"']
            },
            {
                name: 'GameFiOracleV3',
                address: contracts.GameFiOracleV3,
                constructorArgs: []
            },
            {
                name: 'NFTVaultV3',
                address: contracts.NFTVaultV3,
                constructorArgs: [contracts.GameFiOracleV3]
            },
            {
                name: 'MosaicalGovernance',
                address: contracts.MosaicalGovernance,
                constructorArgs: [contracts.GovernanceToken]
            },
            {
                name: 'DPOTokenV3',
                address: contracts.DPOTokenV3,
                constructorArgs: []
            },
            {
                name: 'LoanManagerV3',
                address: contracts.LoanManagerV3,
                constructorArgs: [contracts.NFTVaultV3, contracts.DPOTokenV3]
            },
            {
                name: 'MosaicalSagaBridge',
                address: contracts.MosaicalSagaBridge,
                constructorArgs: ['"0x1234567890123456789012345678901234567890"']
            }
        ];
        
        console.log('🚀 Starting verification process...\n');
        
        for (const contract of verificationSteps) {
            console.log(`🔍 Verifying ${contract.name} at ${contract.address}...`);
            
            try {
                const { spawn } = require('child_process');
                
                const args = [
                    'hardhat', 'verify',
                    '--network', 'mosaical',
                    contract.address,
                    ...contract.constructorArgs
                ];
                
                console.log(`Running: npx ${args.join(' ')}`);
                
                const result = await new Promise((resolve, reject) => {
                    const process = spawn('npx', args, { stdio: 'inherit' });
                    
                    process.on('close', (code) => {
                        if (code === 0) {
                            resolve('success');
                        } else {
                            resolve('failed');
                        }
                    });
                    
                    process.on('error', (error) => {
                        reject(error);
                    });
                });
                
                if (result === 'success') {
                    console.log(`✅ ${contract.name} verified successfully\n`);
                } else {
                    console.log(`⚠️ ${contract.name} verification may have failed (check output above)\n`);
                }
                
                // Add delay between verifications to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                console.error(`❌ Error verifying ${contract.name}:`, error.message);
                console.log('Continuing with next contract...\n');
            }
        }
        
        console.log('🎉 Verification process completed!');
        console.log(`🌐 Check your contracts on: ${deployment.blockExplorer || 'https://mosaical-2745549204473000-1.sagaexplorer.io'}`);
        
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    verifyContracts();
}

module.exports = { verifyContracts };
