const hre = require("hardhat");
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function deploy() {
    console.log('🚀 Deploying contracts to Saga chainlet...');
    console.log('Chainlet ID:', process.env.CHAINLET_ID || 'devpros_2749656616387000-1');
    console.log('RPC URL:', process.env.RPC_URL || 'https://devpros-2749656616387000-1.jsonrpc.sagarpc.io');

    try {
        const [deployer] = await hre.ethers.getSigners();
        console.log('Deploying from address:', deployer.address);

        // Check balance
        const balance = await hre.ethers.provider.getBalance(deployer.address);
        console.log('Account balance:', hre.ethers.formatEther(balance), 'DPSV');

        // Deploy MockGameNFT from contracts.sol
        const MockGameNFT = await hre.ethers.getContractFactory("contracts/contracts.sol:MockGameNFT");
        const mockNFT = await MockGameNFT.deploy("Test Game NFT", "TGNFT");
        await mockNFT.waitForDeployment();
        console.log('MockGameNFT deployed to:', await mockNFT.getAddress());

        // Deploy GovernanceToken from contracts.sol
        const GovernanceToken = await hre.ethers.getContractFactory("contracts/contracts.sol:GovernanceToken");
        const govToken = await GovernanceToken.deploy("Devpros Governance", "DPSGOV");
        await govToken.waitForDeployment();
        console.log('GovernanceToken deployed to:', await govToken.getAddress());

        // Deploy GameFiOracleV3 from contracts.sol
        const GameFiOracleV3 = await hre.ethers.getContractFactory("contracts/contracts.sol:GameFiOracleV3");
        const oracle = await GameFiOracleV3.deploy();
        await oracle.waitForDeployment();
        console.log('GameFiOracleV3 deployed to:', await oracle.getAddress());

        // Deploy NFTVaultV3 from contracts.sol
        const NFTVaultV3 = await hre.ethers.getContractFactory("contracts/contracts.sol:NFTVaultV3");
        const vault = await NFTVaultV3.deploy(await oracle.getAddress());
        await vault.waitForDeployment();
        console.log('NFTVaultV3 deployed to:', await vault.getAddress());

        // Deploy MosaicalGovernance from contracts.sol
        const MosaicalGovernance = await hre.ethers.getContractFactory("contracts/contracts.sol:MosaicalGovernance");
        const governance = await MosaicalGovernance.deploy(await govToken.getAddress());
        await governance.waitForDeployment();
        console.log('MosaicalGovernance deployed to:', await governance.getAddress());

        // Deploy DPOTokenV3 from contracts.sol
        const DPOTokenV3 = await hre.ethers.getContractFactory("contracts/contracts.sol:DPOTokenV3");
        const dpoToken = await DPOTokenV3.deploy();
        await dpoToken.waitForDeployment();
        console.log('DPOTokenV3 deployed to:', await dpoToken.getAddress());

        // Deploy LoanManagerV3 from contracts.sol
        const LoanManagerV3 = await hre.ethers.getContractFactory("contracts/contracts.sol:LoanManagerV3");
        const loanManager = await LoanManagerV3.deploy(
            await vault.getAddress(),
            await dpoToken.getAddress()
        );
        await loanManager.waitForDeployment();
        console.log('LoanManagerV3 deployed to:', await loanManager.getAddress());

        // Deploy MosaicalSagaBridge from contracts.sol
        const MosaicalSagaBridge = await hre.ethers.getContractFactory("contracts/contracts.sol:MosaicalSagaBridge");
        const bridge = await MosaicalSagaBridge.deploy("0xcca6F4EA7e82941535485C2363575404C3061CD2");
        await bridge.waitForDeployment();
        console.log('MosaicalSagaBridge deployed to:', await bridge.getAddress());

        // Save deployment info
        const deploymentInfo = {
            network: process.env.NETWORK || "saga",
            chainletId: process.env.CHAINLET_ID || 'devpros_2749656616387000-1',
            rpcUrl: process.env.RPC_URL || 'https://devpros-2749656616387000-1.jsonrpc.sagarpc.io',
            websocketUrl: 'https://devpros-2749656616387000-1.ws.sagarpc.io',
            blockExplorer: 'https://devpros-2749656616387000-1.sagaexplorer.io',
            timestamp: new Date().toISOString(),
            deployer: deployer.address,
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

        const networkName = process.env.NETWORK || "saga";
        fs.writeFileSync(
            `deployments/${networkName}-deployment.json`,
            JSON.stringify(deploymentInfo, null, 2)
        );

        console.log('✅ All contracts deployed successfully!');
        console.log('📄 Deployment info saved to deployments/' + networkName + '-deployment.json');
        console.log(`\n🔗 Block Explorer: https://devpros-2749656616387000-1.sagaexplorer.io`);
        console.log(`🔗 RPC Endpoint: https://devpros-2749656616387000-1.jsonrpc.sagarpc.io`);
        console.log(`🔗 WebSocket: https://devpros-2749656616387000-1.ws.sagarpc.io`);

    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

if (require.main === module) {
    deploy()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = deploy;