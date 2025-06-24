# Mosaical DeFi Frontend - Testing Guide

This guide will walk you through testing the Mosaical GameFi NFT Lending Platform frontend.

## Prerequisites

1. Node.js installed (v16+ recommended)
2. MetaMask browser extension installed
3. Access to DevPros/Saga network

## Setup

### 1. Configure MetaMask for DevPros Network

Add the DevPros network to MetaMask:
- Network Name: Devpros Chainlet
- RPC URL: https://devpros-2749656616387000-1.jsonrpc.sagarpc.io
- Chain ID: 2749656616387000
- Currency Symbol: DPSV
- Block Explorer URL: https://devpros-2749656616387000-1.sagaexplorer.io

### 2. Import Test Wallet

Import the test wallet into MetaMask using the private key:
```
0x089508337775c666afba30ff3ea382b8db512952103958136f0170280e818068
```

**Note:** This is a test wallet with test funds. Do not send real assets to this wallet.

## Mint Test NFTs

Before testing the lending platform, you need NFTs to deposit as collateral.

### Option 1: Simple NFT Minting

```bash
cd src/scripts
node direct_mint_nft_simple_raw.js
```

This will mint a basic NFT to your wallet address.

### Option 2: NFT with Custom Image

```bash
cd src/scripts
node direct_mint_nft_with_image_raw.js
```

This mints an NFT with a custom image URL.

### Check Your NFT Balance

```bash
cd src/scripts
node direct_check.js
```

This will display basic information about your NFTs.

## Start the Frontend

```bash
cd frontend
npm install  # Only needed first time
npm run dev
```

This will start the development server, usually at http://localhost:5173/

## Testing Workflow

1. **Connect Wallet:**
   - Click the "Connect Wallet" button in the top-right corner
   - Select your MetaMask wallet with the test account

2. **View Your NFTs:**
   - Once connected, your NFTs will appear in the "My NFTs" tab
   - Each NFT card shows basic information and a "Deposit" button

3. **Deposit NFTs as Collateral:**
   - Click "Deposit" on an NFT to deposit it as collateral
   - Confirm the transaction in MetaMask
   - The NFT will move to your vault (switch to "My Vault" tab)

4. **Borrow Against NFTs:**
   - In the "My Vault" tab, find your deposited NFT
   - Click "Borrow" to open the borrowing modal
   - Enter an amount to borrow (must be below the max LTV)
   - Confirm the transaction in MetaMask

5. **Repay Loans:**
   - In the "My Vault" tab, find your NFT with an active loan
   - Click "Repay" to open the repayment modal
   - Enter the amount to repay (can be full or partial)
   - Confirm the transaction in MetaMask

6. **Withdraw NFTs:**
   - In the "My Vault" tab, find a deposited NFT with no active loan
   - Click "Withdraw" to withdraw the NFT back to your wallet
   - Confirm the transaction in MetaMask
   - The NFT will move back to your "My NFTs" tab

## Admin Functions

Admin functions are available on the Admin page for the contract owner:

1. **Add Supported Collection:**
   - Enter collection address and parameters
   - Click "Add Collection"

2. **Update Floor Price:**
   - Select collection and enter new floor price
   - Click "Update Price"

3. **View Loans at Risk:**
   - Lists all loans that are at risk of liquidation

## Troubleshooting

### NFTs Not Showing Up

1. Verify your wallet is connected to the correct network (DevPros)
2. Check that you have successfully minted NFTs using the scripts
3. Try refreshing the page
4. Check the browser console for errors

### Transaction Errors

1. Ensure you have enough DPSV for gas fees
2. Check that the contract addresses in the frontend match the deployed contracts
3. Look for specific error messages in MetaMask or the browser console

### Frontend Not Loading

1. Verify the development server is running
2. Check for any compilation errors in the terminal
3. Try restarting the development server

## Contract Addresses

The following smart contracts are used by the frontend:

- NFT Vault: 0x32B3275Fa5E3E52AF6c42C9143699086dc83E760
- DPO Token: 0x8dd2383361aA2bcF7a1B41BA2E8Cbd831809a852
- GameFi Oracle: 0x46f7F373864ffF22c7280CD91C26Fe7eb904dc35
- Governance: 0x5B8A466F95f12cD36d8692B2371047FBb12D2841
- Mock Game NFT: 0x9BD14Eb8581F1B47f01836657BFe572D799610D9 