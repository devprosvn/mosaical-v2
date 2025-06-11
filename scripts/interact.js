
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function interact() {
    console.log('🔗 Interacting with deployed contracts...');
    
    try {
        // Setup provider and wallet
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        // Load deployment info
        const deploymentPath = `deployments/${process.env.NETWORK}-deployment.json`;
        if (!fs.existsSync(deploymentPath)) {
            console.error('❌ No deployment found. Please deploy contracts first.');
            return;
        }
        
        const deployment = JSON.parse(fs.readFileSync(deploymentPath));
        console.log('📋 Loaded deployment info:', deployment.contracts);
        
        // Load contract ABIs
        const contractsPath = path.join(__dirname, '../artifacts/contracts');
        
        // Interact with MockGameNFT
        const MockGameNFT = JSON.parse(fs.readFileSync(
            path.join(contractsPath, 'MockGameNFT.sol/MockGameNFT.json')
        ));
        const mockNFT = new ethers.Contract(deployment.contracts.MockGameNFT, MockGameNFT.abi, wallet);
        
        // Mint a test NFT
        console.log('🎮 Minting test GameFi NFT...');
        const mintTx = await mockNFT.mint(wallet.address, "https://example.com/metadata/1");
        await mintTx.wait();
        console.log('✅ NFT minted with tokenId: 1');
        
        // Check NFT details
        const owner = await mockNFT.ownerOf(1);
        const tokenURI = await mockNFT.tokenURI(1);
        console.log('📄 NFT Owner:', owner);
        console.log('📄 Token URI:', tokenURI);
        
        // Interact with NFTVaultV3
        const NFTVaultV3 = JSON.parse(fs.readFileSync(
            path.join(contractsPath, 'NFTVaultV3.sol/NFTVaultV3.json')
        ));
        const vault = new ethers.Contract(deployment.contracts.NFTVaultV3, NFTVaultV3.abi, wallet);
        
        // Add supported collection
        console.log('⚙️ Adding supported collection...');
        const addCollectionTx = await vault.addSupportedCollection(deployment.contracts.MockGameNFT);
        await addCollectionTx.wait();
        console.log('✅ Collection added to supported list');
        
        console.log('🎉 Interaction completed successfully!');
        
    } catch (error) {
        console.error('❌ Interaction failed:', error.message);
    }
}

if (require.main === module) {
    interact();
}

module.exports = { interact };
