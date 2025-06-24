# Modular Setup Scripts for Mosaical DeFi

We've refactored the setup scripts to make them modular, allowing you to run individual steps or combinations of steps as needed.

## Available Steps

Both scripts (`full_setup.js` and `direct_full_setup.js`) support the following steps:

1. **Deploy Contracts** - Deploy all smart contracts
2. **Initialize Contracts** - Set up relationships between contracts
3. **Update Oracle** - Set floor prices and metrics in the oracle
4. **Add Liquidity** - Add ETH to the vault for lending
5. **Mint Test NFTs** - Mint NFTs to your wallet for testing

## Running Specific Steps

### Using Hardhat Environment

```bash
# Run all steps (default)
npx hardhat run src/scripts/full_setup.js --network devpros

# Run only steps 3 and 4 (update oracle and add liquidity)
npx hardhat run src/scripts/full_setup.js --network devpros 3 4

# Run only step 5 (mint NFTs)
npx hardhat run src/scripts/full_setup.js --network devpros 5
```

### Using Direct Ethers.js (No Hardhat Runtime)

```bash
# Run all steps (default)
node src/scripts/direct_full_setup.js

# Run only steps 3 and 4 (update oracle and add liquidity)
node src/scripts/direct_full_setup.js 3 4

# Run only step 5 (mint NFTs)
node src/scripts/direct_full_setup.js 5
```

## Common Use Cases

### First-time Setup

Run all steps to set up the complete system:

```bash
npx hardhat run src/scripts/full_setup.js --network devpros
```

### Daily Testing

If you already have contracts deployed but need to refresh the oracle price and add more liquidity:

```bash
npx hardhat run src/scripts/full_setup.js --network devpros 3 4
```

### Minting More NFTs

If you need more test NFTs in your wallet:

```bash
npx hardhat run src/scripts/full_setup.js --network devpros 5
```

### Re-initializing Contract Relationships

If you need to reinitialize contract relationships:

```bash
npx hardhat run src/scripts/full_setup.js --network devpros 2
```

## How It Works

The scripts check for existing deployments in `src/deployments/devpros-deployment.json`:

- If running step 1 (deploy), new contracts are deployed and saved to this file
- If not running step 1 but a deployment file exists, the script uses the existing contracts
- If not running step 1 and no deployment file exists, the script exits with an error

## Using in Your Own Scripts

You can also import and use the individual functions in your own scripts:

```javascript
// Using Hardhat environment
const { 
  deployContracts, 
  updateOraclePrice, 
  addLiquidity 
} = require('./full_setup');

// Using direct ethers.js
const { 
  deployContracts, 
  updateOraclePrice, 
  addLiquidity 
} = require('./direct_full_setup');

async function myCustomScript() {
  // Deploy contracts
  const contracts = await deployContracts();
  
  // Update oracle with custom price
  // ... your custom code ...
  
  // Add custom liquidity amount
  // ... your custom code ...
}
```

## Troubleshooting

### "No deployment found and step 1 not included"

You're trying to run steps that require existing contracts, but no deployment file was found.
Solution: Run step 1 first to deploy the contracts.

### "Transaction failed" errors

Check that:
1. Your account has enough ETH for gas
2. You're running against the correct network
3. The contract addresses in the deployment file are correct

### "Contract function reverted" errors

This typically means the contract state doesn't allow the operation. For example:
- Trying to initialize an already initialized contract
- Trying to add a collection that's already supported
- Trying to update an oracle price without permission 