# Mosaical DeFi System - Quick Start Guide

## What We've Accomplished

1. Created consolidated setup scripts for complete system deployment:
   - `full_setup.js` - Using Hardhat environment
   - `direct_full_setup.js` - Using ethers.js directly without Hardhat runtime

2. Both scripts perform the complete setup process:
   - Deploy all smart contracts (NFTVault, DPOToken, GameFiOracle, etc.)
   - Initialize contract relationships
   - Update oracle floor prices
   - Add liquidity to the vault
   - Mint test NFTs
   - Save deployment information

3. Maintained specialized scripts for custom NFT functionality with image URLs

## Getting Started

### Option 1: Using Hardhat (Recommended)

```bash
# Compile contracts
npx hardhat compile

# Full setup with Hardhat
npx hardhat run src/scripts/full_setup.js --network devpros
```

### Option 2: Direct Setup (No Hardhat Runtime)

```bash
# Compile contracts first (still requires Hardhat for this step)
npx hardhat compile

# Full setup without Hardhat runtime
node src/scripts/direct_full_setup.js
```

## Custom NFT Image Support

For NFTs with custom image URLs (like `https://i.imgur.com/TnDCzpS.jpeg`), we've retained specialized scripts:

1. `direct_deploy_nft_with_uri_raw.js` - For deploying NFT contracts that support custom image URLs
2. `direct_mint_nft_with_image_raw.js` - For minting NFTs with custom image URLs

To use these scripts:

1. Update `direct_deploy_nft_with_uri_raw.js` with compiled bytecode
2. Deploy the custom NFT contract
3. Update `direct_mint_nft_with_image_raw.js` with the new contract address
4. Mint NFTs with your custom image URL

## Utility Tools

We've also maintained utility scripts for specialized tasks:

- `check_nfts.js` / `direct_check_nfts_raw.js` - For checking NFT ownership
- `compile.js` - For compiling contracts
- `flatten.js` - For flattening contracts (useful for verification)
- `verify.js` - For contract verification on block explorers

## Next Steps After Setup

1. Copy the displayed contract addresses to your frontend constants file
2. Start your frontend with `npm run dev`
3. Connect with MetaMask to the devpros network
4. The NFTs are in your wallet and ready to be used! 