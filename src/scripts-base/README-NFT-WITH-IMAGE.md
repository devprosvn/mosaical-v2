# Minting NFTs with Custom Image URLs

This guide explains how to mint NFTs with custom image URLs using the provided scripts.

## Current Limitations

The currently deployed `MockGameNFT` contract at `0x9BD14Eb8581F1B47f01836657BFe572D799610D9` does not support setting custom image URLs after minting. The NFTs minted with this contract will always use the default image URL hardcoded in the contract.

## Available Scripts

1. `direct_mint_nft_raw.js` - Mints NFTs using the existing contract (with default image)
2. `direct_mint_nft_with_image_raw.js` - Attempts to mint NFTs with a custom image URL (will fall back to regular minting if not supported)
3. `direct_deploy_nft_with_uri_raw.js` - Template for deploying a new NFT contract that supports custom image URLs (requires compilation)

## Option 1: Using the Existing Contract

You can mint NFTs with the existing contract, but they will use the default image URL:

```bash
node src/scripts/direct_mint_nft_raw.js
```

## Option 2: Deploying a New Contract with Custom Image Support

To mint NFTs with custom image URLs, you need to:

1. Compile the new contract:
   ```bash
   # First, copy the MockGameNFTWithURI.sol file to the contracts directory
   cp src/contracts/MockGameNFTWithURI.sol src/contracts/
   
   # Then compile it using Hardhat
   npx hardhat compile
   ```

2. Update the deployment script with the compiled bytecode
   - Open `src/scripts/direct_deploy_nft_with_uri_raw.js`
   - Find the bytecode in the compiled artifacts
   - Update the script with the actual bytecode

3. Deploy the new contract:
   ```bash
   node src/scripts/direct_deploy_nft_with_uri_raw.js
   ```

4. Update the minting script with the new contract address:
   - Open `src/scripts/direct_mint_nft_with_image_raw.js`
   - Update the `MOCK_NFT_ADDRESS` variable with your newly deployed contract address

5. Mint NFTs with your custom image URL:
   ```bash
   node src/scripts/direct_mint_nft_with_image_raw.js
   ```

## Custom Image URL Configuration

The current scripts are configured to use the image URL: `https://i.imgur.com/TnDCzpS.jpeg`

To change the image URL:
1. Open the script file (`direct_mint_nft_with_image_raw.js`)
2. Update the `IMAGE_URL` constant with your desired URL

## Troubleshooting

If you encounter issues:

1. **Error: Function not found** - This likely means the contract doesn't support the custom image URL functions. You need to deploy the new contract.

2. **Transaction fails** - Check that you have enough DPSV tokens for gas fees.

3. **Cannot read properties of undefined** - Make sure you're using the correct contract address and that the contract is properly deployed. 