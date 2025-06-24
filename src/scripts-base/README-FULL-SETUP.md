# Mosaical DeFi System - Full Setup Guide

This guide explains how to set up the complete Mosaical DeFi system using our consolidated setup scripts.

## Quick Start

### Option 1: Using Hardhat (Recommended)

```bash
# Compile contracts
npx hardhat compile

# Run full setup
npx hardhat run src/scripts/full_setup.js --network devpros
```

### Option 2: Direct Setup (No Hardhat Runtime)

```bash
# Compile contracts first
npx hardhat compile

# Run direct full setup
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

## NEW: Modular Approach

The scripts now support running individual steps or combinations of steps. This is useful when you:

- Only need to update the oracle price
- Only need to add more liquidity
- Only need to mint more NFTs
- Want to run a custom combination of steps

### Running Specific Steps

```bash
# Run only steps 3 and 4 (update oracle and add liquidity)
npx hardhat run src/scripts/full_setup.js --network devpros 3 4

# Run only step 5 (mint NFTs)
npx hardhat run src/scripts/full_setup.js --network devpros 5

# For direct setup:
node src/scripts/direct_full_setup.js 3 4
```

See the `README-MODULAR-SETUP.md` file for more detailed instructions on using the modular approach.

## After Setup

After running the setup script:

1. **Copy Contract Addresses**:
   - The script displays the contract addresses to copy to your frontend

2. **Update Frontend Constants**:
   ```javascript
   // frontend/src/constants/contracts.js
   export const CONTRACT_ADDRESSES = {
     NFTVault: "0x32B3275Fa5E3E52AF6c42C9143699086dc83E760",
     DPOToken: "0x8dd2383361aA2bcF7a1B41BA2E8Cbd831809a852",
     GameFiOracle: "0x46f7F373864ffF22c7280CD91C26Fe7eb904dc35",
     MosaicalGovernance: "0x5B8A466F95f12cD36d8692B2371047FBb12D2841",
     MockGameNFT: "0x9BD14Eb8581F1B47f01836657BFe572D799610D9"
   };
   ```

3. **Start the Frontend**:
   ```bash
   cd frontend && npm run dev
   ```

4. **Connect Wallet**:
   - Connect your MetaMask to the devpros network
   - You should see the NFTs in your wallet

## Troubleshooting

### "No deployment found and step 1 not included"

You're trying to run steps that require existing contracts, but no deployment file was found.
Solution: Run step 1 first to deploy the contracts.

### "Cannot borrow against NFT" / "No price showing for deposited NFT"

Run steps 3 (update oracle) to ensure the Oracle has a current price for the NFT collection:

```bash
npx hardhat run src/scripts/full_setup.js --network devpros 3
```

### "Insufficient vault liquidity" error when trying to borrow

Run step 4 (add liquidity) to ensure the NFTVault has enough ETH to lend:

```bash
npx hardhat run src/scripts/full_setup.js --network devpros 4
```

### "Transaction failed" when running scripts

Make sure you're running against the correct network and have the right private key:
```bash
# Check if addresses in deployment file match your current deployment
cat src/deployments/devpros-deployment.json
``` 