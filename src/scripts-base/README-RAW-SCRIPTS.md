# Raw Scripts for Mosaical DeFi

These scripts provide a direct way to interact with the contracts using ethers.js without relying on the Hardhat runtime.

## Main Setup Script

We've consolidated most functionality into a single setup script:

```bash
node src/scripts/direct_full_setup.js
```

This script performs the complete setup process:
- Deploys all smart contracts (NFTVault, DPOToken, GameFiOracle, etc.)
- Initializes contract relationships
- Updates oracle floor prices
- Adds liquidity to the vault
- Mints test NFTs
- Saves deployment information

## Contract Addresses

After running the setup script, you'll get the following addresses (example):
- DPOTokenV3: `0x8dd2383361aA2bcF7a1B41BA2E8Cbd831809a852`
- MosaicalGovernance: `0x5B8A466F95f12cD36d8692B2371047FBb12D2841`
- NFTVaultV3: `0x32B3275Fa5E3E52AF6c42C9143699086dc83E760`
- GameFiOracleV3: `0x46f7F373864ffF22c7280CD91C26Fe7eb904dc35`
- GovernanceToken: `0x82fc09bB58dEAbB3c134A2f8821874a5fdcF46AD`
- MockGameNFT: `0x9BD14Eb8581F1B47f01836657BFe572D799610D9`

## RPC Endpoint

- URL: `https://devpros-2749656616387000-1.jsonrpc.sagarpc.io`
- Chainlet: `devpros`
- Token Denom: `DPSV`

## Additional Scripts

### Check NFT Ownership

```bash
node scripts/direct_check_nfts_raw.js
```

This script checks the NFT balance and lists all NFTs owned by your wallet address.

### NFTs with Custom Image URLs

We've retained two specialized scripts for NFTs with custom image URLs:

#### 1. Deploy NFT Contract with Custom Image Support

```bash
node scripts/direct_deploy_nft_with_uri_raw.js
```

This script is a template for deploying the `MockGameNFTWithURI` contract that supports custom image URLs. The script needs to be completed with the compiled bytecode before use.

#### 2. Mint NFTs with Custom Image URL

```bash
node scripts/direct_mint_nft_with_image_raw.js
```

This script attempts to mint NFTs with a custom image URL. Note that this requires a contract that supports this feature (not the default MockGameNFT).

## Configuration

The scripts use these default configuration values:

1. **Private Key**:
   ```javascript
   const PRIVATE_KEY = "0x089508337775c666afba30ff3ea382b8db512952103958136f0170280e818068"; // Your private key
   ```

2. **Custom Image URL**:
   ```javascript
   const IMAGE_URL = "https://i.imgur.com/TnDCzpS.jpeg"; // Image URL for the NFT
   ```

3. **Liquidity Amount**:
   ```javascript
   const LIQUIDITY_AMOUNT_ETH = "1.0"; // Amount of ETH to add as liquidity
   ```

4. **Floor Price**:
   ```javascript
   const FLOOR_PRICE_ETH = "0.1"; // Floor price in ETH
   ```

## Complete Workflow

For a complete setup of the system:

```bash
# 1. Run the full setup script
node scripts/direct_full_setup.js

# 2. Check your NFT ownership
node scripts/direct_check_nfts_raw.js

# 3. Start the frontend
cd frontend && npm run dev
```

## Custom Image URL Support

To mint NFTs with custom image URLs (like `https://i.imgur.com/TnDCzpS.jpeg`), you need to:

1. Deploy the `MockGameNFTWithURI` contract using the deployment script template
2. Update the minting script with the new contract address
3. Run the minting script with custom image URL

For more details, see the `README-NFT-WITH-IMAGE.md` and `README-NFT-IMAGE-SOLUTION.md` files. 