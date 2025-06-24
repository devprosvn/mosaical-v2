# Mosaical DeFi Frontend

A React-based frontend for the Mosaical GameFi NFT lending platform.

## Project Overview

This frontend application interfaces with the Mosaical DeFi smart contracts, providing a user-friendly interface for:

1. Depositing GameFi NFTs as collateral
2. Borrowing native tokens against NFTs
3. Repaying loans
4. Managing vault assets
5. Administrative functions

## Architecture

The application is built with the following technologies:

- **React**: Frontend library for building user interfaces
- **Ethers.js**: Ethereum library for blockchain interactions
- **React Bootstrap**: UI component library
- **Vite**: Build tool and development server

## Key Components

### Core Functionality

- **Web3Context**: Manages wallet connection and blockchain state
- **NotificationContext**: Centralized notification system for users
- **ContractService**: Handles all interactions with smart contracts
- **AlchemyService**: Fetches NFT metadata from Alchemy API

### User Interface

- **NFT Management**:
  - `MyNFTs`: Displays user-owned NFTs available for deposit
  - `VaultAssets`: Shows NFTs deposited as collateral
  - `NFTCard`: Reusable component for displaying NFT details
  
- **Lending Operations**:
  - Borrow functionality against deposited NFTs
  - Loan repayment system
  - Withdrawal of NFTs after loan repayment

- **Admin Functions**:
  - Collection management
  - Oracle price updates
  - System parameter configuration

## Smart Contract Integration

The frontend integrates with the following contracts:

- **NFTVaultV3**: Core lending protocol
- **DPOTokenV3**: Debt position tokens
- **GameFiOracleV3**: Price oracle for NFT valuations
- **MockGameNFT**: Test NFT collection

## Testing the Application

For testing instructions, see the root level `README-TESTING.md` file, which includes:

1. Setting up MetaMask for DevPros network
2. Minting test NFTs using provided scripts
3. Step-by-step workflow for testing all features

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Future Enhancements

1. Enhanced NFT metadata display with game statistics
2. Real-time price feeds for NFT valuations
3. Governance voting interface
4. Analytics dashboard for protocol metrics
