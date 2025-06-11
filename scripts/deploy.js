const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function deploy() {
    console.log('🚀 Deploying contracts to devpros chainlet...');
    console.log('Chainlet ID:', process.env.CHAINLET_ID || 'devpros_2749656616387000-1');
    console.log('RPC URL:', process.env.RPC_URL);

    try {
        // Setup provider and wallet
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

        console.log('Deploying from address:', wallet.address);

        // Check balance
        const balance = await provider.getBalance(wallet.address);
        console.log('Account balance:', ethers.formatEther(balance), 'DPSV');

        // Read compiled contracts
        const contractsPath = path.join(__dirname, '../artifacts/contracts');

        // Deploy MockGameNFT
        const MockGameNFT = JSON.parse(fs.readFileSync(
            path.join(contractsPath, 'MockGameNFT.sol/MockGameNFT.json')
        ));
        const mockNFTFactory = new ethers.ContractFactory(MockGameNFT.abi, MockGameNFT.bytecode, wallet);
        const mockNFT = await mockNFTFactory.deploy("Test Game NFT", "TGNFT");
        await mockNFT.waitForDeployment();
        console.log('MockGameNFT deployed to:', await mockNFT.getAddress());

        // Deploy GovernanceToken
        const GovernanceToken = JSON.parse(fs.readFileSync(
            path.join(contractsPath, 'GovernanceToken.sol/GovernanceToken.json')
        ));
        const govTokenFactory = new ethers.ContractFactory(GovernanceToken.abi, GovernanceToken.bytecode, wallet);
        const govToken = await govTokenFactory.deploy("Devpros Governance", "DPSGOV");
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

        // Deploy DPOTokenV3
        const DPOTokenV3 = JSON.parse(fs.readFileSync(
            path.join(contractsPath, 'DPOTokenV3.sol/DPOTokenV3.json')
        ));
        const dpoTokenFactory = new ethers.ContractFactory(DPOTokenV3.abi, DPOTokenV3.bytecode, wallet);
        const dpoToken = await dpoTokenFactory.deploy();
        await dpoToken.waitForDeployment();
        console.log('DPOTokenV3 deployed to:', await dpoToken.getAddress());

        // Deploy LoanManagerV3
        const LoanManagerV3 = JSON.parse(fs.readFileSync(
            path.join(contractsPath, 'LoanManagerV3.sol/LoanManagerV3.json')
        ));
        const loanManagerFactory = new ethers.ContractFactory(LoanManagerV3.abi, LoanManagerV3.bytecode, wallet);
        const loanManager = await loanManagerFactory.deploy(
            await vault.getAddress(),
            await dpoToken.getAddress()
        );
        await loanManager.waitForDeployment();
        console.log('LoanManagerV3 deployed to:', await loanManager.getAddress());

           // Deploy Bridge with LayerZero endpoint
        const MosaicalSagaBridge = JSON.parse(fs.readFileSync(
            path.join(contractsPath, 'MosaicalSagaBridge.sol/MosaicalSagaBridge.json')
        ));
        const bridgeFactory = new ethers.ContractFactory(MosaicalSagaBridge.abi, MosaicalSagaBridge.bytecode, wallet);
        const bridge = await bridgeFactory.deploy("0x1234567890123456789012345678901234567890"); // Mock LayerZero endpoint
        await bridge.waitForDeployment();
        console.log(`MosaicalSagaBridge deployed to: ${await bridge.getAddress()}`);


        // Save deployment info
        const deploymentInfo = {
            network: process.env.NETWORK,
            chainletId: process.env.CHAINLET_ID || 'devpros_2749656616387000-1',
            rpcUrl: process.env.RPC_URL,
            blockExplorer: process.env.BLOCK_EXPLORER,
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