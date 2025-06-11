
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function interact() {
    try {
        console.log('🔗 Connecting to contract...');
        
        // Setup provider and wallet
        const provider = new ethers.JsonRpcProvider(
            process.env.RPC_URL || 'http://127.0.0.1:8545'
        );
        
        const wallet = new ethers.Wallet(
            process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
            provider
        );
        
        // Load deployment info
        const deploymentPath = path.join(__dirname, '../deployments/MyContract.json');
        if (!fs.existsSync(deploymentPath)) {
            throw new Error('Contract not deployed. Run: node scripts/deploy.js');
        }
        
        const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
        
        // Load contract ABI
        const compiledPath = path.join(__dirname, '../build/MyContract.json');
        const compiled = JSON.parse(fs.readFileSync(compiledPath, 'utf8'));
        const contractData = compiled.contracts['contracts/MyContract.sol:MyContract'];
        
        // Connect to contract
        const contract = new ethers.Contract(
            deploymentInfo.contractAddress,
            contractData.abi,
            wallet
        );
        
        console.log(`📋 Contract address: ${deploymentInfo.contractAddress}`);
        
        // Read current state
        const currentMessage = await contract.getMessage();
        const currentCounter = await contract.getCounter();
        
        console.log(`📖 Current message: "${currentMessage}"`);
        console.log(`📖 Current counter: ${currentCounter}`);
        
        // Increment counter
        console.log('🔄 Incrementing counter...');
        const tx = await contract.incrementCounter();
        await tx.wait();
        
        const newCounter = await contract.getCounter();
        console.log(`✅ Counter incremented to: ${newCounter}`);
        
        return contract;
    } catch (error) {
        console.error('❌ Interaction failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    interact();
}

module.exports = { interact };
