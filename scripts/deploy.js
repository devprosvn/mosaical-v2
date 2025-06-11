
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function deploy() {
    console.log('🚀 Deploying contracts to Saga chainlet...');
    
    try {
        // Setup provider and wallet
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        console.log('Deploying from address:', wallet.address);
        
        // Read compiled contracts
        const contractsPath = path.join(__dirname, '../artifacts/contracts');
        
        // Deploy MockGameNFT
        const MockGameNFT = JSON.parse(fs.readFileSync(
            path.join(contractsPath, 'MockGameNFT.sol/MockGameNFT.json')
        ));
        const mockNFTFactory = new ethers.ContractFactory(MockGameNFT.abi, MockGameNFT.bytecode, wallet);
        const mockNFT = await mockNFTFactory.deploy();
        await mockNFT.waitForDeployment();
        console.log('MockGameNFT deployed to:', await mockNFT.getAddress());
        
        // Deploy GovernanceToken
        const GovernanceToken = JSON.parse(fs.readFileSync(
            path.join(contractsPath, 'GovernanceToken.sol/GovernanceToken.json')
        ));
        const govTokenFactory = new ethers.ContractFactory(GovernanceToken.abi, GovernanceToken.bytecode, wallet);
        const govToken = await govTokenFactory.deploy();
        await govToken.waitForDeployment();
        console.log('GovernanceToken deployed to:', await govToken.getAddress());
        
        // Deploy GameFiOracleV3
        const GameFiOracleV3 = JSON.parse(fs.readFileSync(
            path.join(contractsPath, 'GameFiOracleV3.sol/GameFiOracleV3.json')
        ));
        const oracleFactory = new ethers.ContractFactory(GameFiOracleV3.abi, GameFiOracleV3.bytecode, wallet);
        const oracle = await oracleFactory.deploy();
        await oracle.waitForDeployment();
        console.log('GameFiOracleV3 deployed to:', await oracle.getAddress());
        
        // Deploy NFTVaultV3
        const NFTVaultV3 = JSON.parse(fs.readFileSync(
            path.join(contractsPath, 'NFTVaultV3.sol/NFTVaultV3.json')
        ));
        const vaultFactory = new ethers.ContractFactory(NFTVaultV3.abi, NFTVaultV3.bytecode, wallet);
        const vault = await vaultFactory.deploy(await oracle.getAddress());
        await vault.waitForDeployment();
        console.log('NFTVaultV3 deployed to:', await vault.getAddress());
        
        // Deploy MosaicalGovernance
        const MosaicalGovernance = JSON.parse(fs.readFileSync(
            path.join(contractsPath, 'MosaicalGovernance.sol/MosaicalGovernance.json')
        ));
        const governanceFactory = new ethers.ContractFactory(MosaicalGovernance.abi, MosaicalGovernance.bytecode, wallet);
        const governance = await governanceFactory.deploy(await govToken.getAddress());
        await governance.waitForDeployment();
        console.log('MosaicalGovernance deployed to:', await governance.getAddress());
        
        // Save deployment info
        const deploymentInfo = {
            network: process.env.NETWORK,
            timestamp: new Date().toISOString(),
            contracts: {
                MockGameNFT: await mockNFT.getAddress(),
                GovernanceToken: await govToken.getAddress(),
                GameFiOracleV3: await oracle.getAddress(),
                NFTVaultV3: await vault.getAddress(),
                MosaicalGovernance: await governance.getAddress()
            }
        };
        
        if (!fs.existsSync('deployments')) {
            fs.mkdirSync('deployments');
        }
        
        fs.writeFileSync(
            `deployments/${process.env.NETWORK}-deployment.json`,
            JSON.stringify(deploymentInfo, null, 2)
        );
        
        console.log('✅ All contracts deployed successfully!');
        console.log('📄 Deployment info saved to deployments/' + process.env.NETWORK + '-deployment.json');
        
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    deploy();
}

module.exports = { deploy };
