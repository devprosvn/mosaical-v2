# Mosaical DeFi System Setup

This document explains how to set up the Mosaical DeFi system using the consolidated scripts.

## Why Use the Consolidated Scripts?

We've created consolidated scripts that handle the entire setup process in one go, which solves several issues:

1. **Data Persistence**: When testing on localhost, data is lost when restarting the blockchain. The consolidated scripts make it easy to re-run the complete setup.

2. **Chainlet Testing**: For testing on devpros chainlet (which is persistent), the consolidated scripts ensure consistent setup.

3. **Simplicity**: No need to remember multiple scripts and their correct order.

## Quick Start

### Option 1: Hardhat Environment (Recommended)

```bash
# Compile the contracts first
npx hardhat compile

# Run the consolidated setup script
npx hardhat run src/scripts/full_setup.js --network devpros
```

### Option 2: Direct Setup (Without Hardhat Runtime)

```bash
# Compile contracts first (still needs Hardhat for this step)
npx hardhat compile

# Run the direct setup script
node src/scripts/direct_full_setup.js
```

## What the Setup Scripts Do

Both setup scripts perform the following steps:

1. **Deploy Contracts**:
   - MockGameNFT (NFT collection for testing)
   - GovernanceToken (Governance token)
   - GameFiOracleV3 (Price oracle)
   - NFTVaultV3 (Main vault for NFT deposits and loans)
   - MosaicalGovernance (Governance contract)
   - DPOTokenV3 (DPO token for synthetic assets)

2. **Initialize Contract Relationships**:
   - Set DPO token in NFTVault
   - Authorize NFTVault as minter for DPOToken
   - Add MockGameNFT as supported collection
   - Set risk tier for MockGameNFT

3. **Update Oracle**:
   - Set floor price for MockGameNFT
   - Update utility score and collection metrics

4. **Add Liquidity**:
   - Add ETH to the NFTVault for lending

5. **Mint Test NFTs**:
   - Mint test NFTs to your wallet address

6. **Save Deployment Info**:
   - Save all contract addresses to `deployments/devpros-deployment.json`

## After Setup

After running the setup script:

1. **Copy Contract Addresses**:
   - The script displays the contract addresses to copy to your frontend

2. **Start the Frontend**:
   ```bash
   cd frontend && npm run dev
   ```

3. **Connect Wallet**:
   - Connect your MetaMask to the devpros network
   - You should see the NFTs in your wallet

## Troubleshooting

### "Cannot borrow against NFT" / "No price showing for deposited NFT"

Run the setup script again to ensure the Oracle has a current price for the NFT collection.

### "Insufficient vault liquidity" error when trying to borrow

Run the setup script again to ensure the NFTVault has enough ETH to lend.

### "Transaction failed" when running scripts

Make sure you're running against the correct network and have the right private key:
```bash
# Check if addresses in deployment file match your current deployment
cat src/deployments/devpros-deployment.json
``` 