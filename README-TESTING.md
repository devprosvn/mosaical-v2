# Mosaical DeFi Frontend - Testing Guide

This guide will walk you through testing the Mosaical GameFi NFT Lending Platform frontend.

## Prerequisites

1. Node.js installed (v16+ recommended)
2. MetaMask browser extension installed
3. Access to DevPros/Saga network

## Setup

### 1. Configure MetaMask for DevPros Network

Add the internal test-network to MetaMask using the parameters provided by the team (RPC URL, Chain ID, symbol, explorer).  These values have been **redacted** from the public repository.

### 2. Import Test Wallet

Import a funded test wallet supplied privately by the maintainers.  _Do **not** use real assets._

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

Contract addresses are now loaded from `/frontend/src/constants/contracts.js`, which is generated during deployment and **git-ignored**.  Refer to that file locally for the exact values. 