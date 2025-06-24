# Mosaical DeFi - Borrowing Guide

This guide explains how to borrow against your NFTs in the Mosaical DeFi platform.

## Prerequisites

Before you can borrow against your NFTs, ensure:

1. You have a working local development environment
2. The Hardhat node is running
3. The contracts are deployed
4. The Oracle has updated floor prices
5. The Vault has liquidity
6. You have NFTs minted and deposited in the vault

## Step-by-Step Borrowing Process

### 1. Setup the Environment

Each time you restart your local blockchain, follow these steps:

```bash
# Terminal 1: Start the blockchain
npx hardhat node

# Terminal 2: Deploy contracts and initialize
npx hardhat run src/scripts/deploy-direct.js --network localhost
npx hardhat run src/scripts/initialize_system.js --network localhost

# Terminal 2: Mint test NFTs
npx hardhat run src/scripts/direct_mint.js --network localhost

# Terminal 3: Start the frontend
cd frontend && npm run dev
```

### 2. Deposit NFTs as Collateral

1. Navigate to the Dashboard page
2. Connect your wallet using the button in the header
3. In the "My NFTs" tab, you'll see your NFTs
4. Click the "Deposit NFT" button on any NFT you want to use as collateral
5. Confirm the transaction in your wallet

### 3. Borrow Against Your NFTs

#### Option 1: From the Dashboard

1. Go to the "My Vault" tab in the Dashboard
2. Find your deposited NFT
3. Click the "Borrow" button
4. Enter the amount you want to borrow (must be less than the Max Borrow amount)
5. Click "Confirm" and approve the transaction in your wallet

#### Option 2: From the Loans Page

1. Navigate to the "Loans" page from the header
2. In the "Borrow" tab, you'll see your available NFT collateral
3. Click the "Borrow" button on the NFT you want to borrow against
4. Enter the amount and confirm the transaction

### 4. Repay Your Loans

1. Navigate to the "Loans" page
2. Go to the "Repay Loans" tab
3. Find the NFT with the loan you want to repay
4. Click the "Repay Loan" button
5. Enter the amount you want to repay (can be partial or full)
6. Confirm the transaction in your wallet

## Troubleshooting

### "Cannot borrow against NFT" / No borrow button

**Problem**: The Oracle doesn't have a current price for the NFT collection.

**Solution**: Run the Oracle update script:

```bash
npx hardhat run src/scripts/update_oracle.js --network localhost
```

### "Insufficient vault liquidity" error

**Problem**: The NFTVault doesn't have enough ETH to lend.

**Solution**: Add liquidity to the vault:

```bash
npx hardhat run src/scripts/add_liquidity.js --network localhost
```

### "Transaction failed" when borrowing or repaying

**Problem**: This could be due to various reasons like insufficient gas, contract errors, etc.

**Solution**:
1. Check that your Hardhat node is running
2. Ensure you have enough ETH in your wallet for gas
3. Verify the amount you're trying to borrow is within the allowed limit
4. Check the browser console for more detailed error messages

## Understanding Loan Terms

- **Max Borrow**: The maximum amount you can borrow against an NFT, calculated based on the NFT's floor price and the collection's Max LTV
- **Current LTV**: The current Loan-to-Value ratio, calculated as (loan amount / NFT value) * 100
- **Liquidation Threshold**: When your Current LTV exceeds this threshold, your loan can be liquidated
- **Total Debt**: The total amount you owe, including interest

## DPO Tokens

When you borrow against an NFT, DPO (Debt Position Ownership) tokens are minted. These tokens represent your debt position and can be traded with other users. To manage your DPO tokens:

1. Navigate to the "DPO Tokens" page
2. View your token holdings
3. Use the "Trade" button to transfer tokens to another user

Trading DPO tokens transfers a portion of the debt and its associated risk to the recipient. 