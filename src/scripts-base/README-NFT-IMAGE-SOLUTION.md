# NFT Custom Image URL Solution

## Current Status

You have successfully minted NFTs using the existing `MockGameNFT` contract at `0x9BD14Eb8581F1B47f01836657BFe572D799610D9`. However, this contract does not support setting custom image URLs - it uses a hardcoded image URL in the `tokenURI` function.

## How to Use Custom Image URLs

There are two approaches to use custom image URLs with your NFTs:

### Option 1: Deploy a New Contract (Recommended)

1. Use the provided `MockGameNFTWithURI.sol` contract which supports custom image URLs
2. Deploy it using the `direct_deploy_nft_with_uri_raw.js` script (after completing it with the compiled bytecode)
3. Mint NFTs with custom image URLs using the `direct_mint_nft_with_image_raw.js` script (update the contract address)

### Option 2: Create a Metadata Server

1. Continue using the existing contract
2. Set up a metadata server that serves custom JSON for each token ID
3. The metadata server would return JSON with your custom image URL
4. Users would need to use your metadata server to view the custom images

## Steps to Implement Option 1

1. **Compile the Contract**:
   ```bash
   # If you have Hardhat installed
   npx hardhat compile
   ```

2. **Get the Bytecode**:
   - After compilation, find the bytecode in the artifacts directory
   - Update the deployment script with the bytecode

3. **Deploy the Contract**:
   ```bash
   node src/scripts/direct_deploy_nft_with_uri_raw.js
   ```

4. **Update Minting Script**:
   - Edit `direct_mint_nft_with_image_raw.js`
   - Change `MOCK_NFT_ADDRESS` to your new contract address

5. **Mint NFTs with Custom Image**:
   ```bash
   node src/scripts/direct_mint_nft_with_image_raw.js
   ```

## Your Custom Image

Your specified image URL is: `https://i.imgur.com/TnDCzpS.jpeg`

This image will be used as the NFT's image when you mint using the new contract.

## Troubleshooting

If you encounter issues with the `tokenOfOwnerByIndex` function (as seen in the error messages), you can use the simplified minting script:

```bash
node src/scripts/direct_mint_nft_simple_raw.js
```

This script only mints the NFT without trying to access the token IDs afterward. 