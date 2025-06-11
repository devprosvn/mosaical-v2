
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function deploy() {
    try {
        console.log('🚀 Starting deployment...');
        
        // Setup provider and wallet
        const provider = new ethers.JsonRpcProvider(
            process.env.RPC_URL || 'http://127.0.0.1:8545'
        );
        
        const wallet = new ethers.Wallet(
            process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
            provider
        );
        
        console.log(`Deploying from address: ${wallet.address}`);
        
        // Load compiled contract
        const contractPath = path.join(__dirname, '../build/MyContract.json');
        if (!fs.existsSync(contractPath)) {
            throw new Error('Contract not compiled. Run: node scripts/compile.js');
        }
        
        const compiled = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        const contractData = compiled.contracts['contracts/MyContract.sol:MyContract'];
        
        if (!contractData) {
            throw new Error('Contract data not found in compiled output');
        }
        
        // Create contract factory
        const contractFactory = new ethers.ContractFactory(
            contractData.abi,
            contractData.bin,
            wallet
        );
        
        // Deploy contract
        console.log('📝 Deploying MyContract...');
        const contract = await contractFactory.deploy("Hello, Blockchain!");
        
        console.log(`⏳ Transaction hash: ${contract.deploymentTransaction().hash}`);
        console.log('⏳ Waiting for deployment confirmation...');
        
        await contract.waitForDeployment();
        const contractAddress = await contract.getAddress();
        
        console.log(`✅ MyContract deployed to: ${contractAddress}`);
        
        // Save deployment info
        const deploymentInfo = {
            contractAddress,
            deploymentBlock: await provider.getBlockNumber(),
            deployer: wallet.address,
            timestamp: new Date().toISOString(),
            network: process.env.NETWORK || 'localhost'
        };
        
        const deploymentsDir = path.join(__dirname, '../deployments');
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
        }
        
        fs.writeFileSync(
            path.join(deploymentsDir, 'MyContract.json'),
            JSON.stringify(deploymentInfo, null, 2)
        );
        
        console.log('💾 Deployment info saved to deployments/MyContract.json');
        
        return contractAddress;
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    deploy();
}

module.exports = { deploy };
