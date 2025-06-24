# Mosaical DeFi - Diagnostic Tools

This directory contains tools to help diagnose and fix issues with the Mosaical DeFi platform, especially for persistent environments like the devpros chainlet.

## Understanding the Problem

When working with persistent blockchains like devpros, data remains on-chain even after restarting your machine. This means:

- NFTs you've deposited remain in the vault
- Floor prices set in the Oracle remain valid
- Liquidity added to the vault remains available

If your frontend isn't showing this data correctly, the issue is likely in the frontend code, not the on-chain data.

## Diagnostic Scripts

### 1. Verify On-Chain State

This script checks the actual on-chain state to confirm your NFTs are properly deposited and borrowable.

```bash
# Using Hardhat
npx hardhat run src/scripts/verify_state.js --network devpros

# Using direct ethers.js
node src/scripts/direct_verify_state.js
```

This will show:
- If your NFT is actually in the vault
- The max borrow amount for your NFT
- The floor price in the Oracle
- All your deposits in the vault
- The vault's liquidity

### 2. Verify Frontend Addresses

This script checks if the contract addresses in your frontend match the deployed contracts.

```bash
node src/scripts/verify_frontend_addresses.js
```

This will:
- Compare addresses in your frontend constants with the deployment file
- Identify any mismatches
- Provide the correct addresses to copy to your frontend

### 3. Frontend Debug Guide

The file `frontend_debug_guide.js` contains code snippets to add to your frontend components to help debug issues. It includes:

- Debug code for VaultAssets.jsx
- Debug code for contractService.js
- Fixed handleWithdrawNFT function
- Debug code for Web3Context.jsx

## Common Issues and Solutions

### 1. "You have no NFTs in the vault" (but you do)

Possible causes:
- Frontend is using incorrect contract addresses
- getUserDeposits function is failing
- Web3Context is not properly initialized

Solutions:
1. Run `verify_state.js` to confirm NFTs are in the vault
2. Run `verify_frontend_addresses.js` to check contract addresses
3. Add debug code to VaultAssets.jsx and check console logs

### 2. "NFT has no borrow amount" (but it should)

Possible causes:
- Oracle floor price is not set
- getUserPosition function is failing
- NFT data structure is inconsistent

Solutions:
1. Run `verify_state.js` to check Oracle floor price
2. If floor price is 0, run `npx hardhat run src/scripts/full_setup.js --network devpros 3`
3. Add debug code to contractService.js and check console logs

### 3. "Invalid NFT data" when withdrawing

Possible causes:
- NFT object structure is inconsistent

Solution:
- Use the fixed handleWithdrawNFT function from the debug guide

## Step-by-Step Debugging Process

1. **Verify on-chain state**:
   ```bash
   npx hardhat run src/scripts/verify_state.js --network devpros
   ```

2. **Check frontend contract addresses**:
   ```bash
   node src/scripts/verify_frontend_addresses.js
   ```

3. **Add debug code** from `frontend_debug_guide.js` to your components

4. **Open your DApp** and check the browser console (F12) for logs

5. **Fix the identified issues** in your frontend code

6. If needed, run specific steps from the setup script:
   ```bash
   # Update Oracle prices
   npx hardhat run src/scripts/full_setup.js --network devpros 3
   
   # Add more liquidity
   npx hardhat run src/scripts/full_setup.js --network devpros 4
   ```

## Remember

The blockchain state is persistent on devpros. If your frontend isn't showing the data correctly, the issue is almost certainly in your frontend code, not the on-chain data. 