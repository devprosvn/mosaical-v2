// Contract addresses - replace with actual deployed addresses
export const CONTRACT_ADDRESSES = {
  NFTVault: "YourNFTVaultAddress", // YourNFTVaultAddress
  DPOToken: "YourDPOTokenAddress", // YourDPOTokenAddress
  GameFiOracle: "YourGameFiOracleAddress", // YourGameFiOracleAddress
  MosaicalGovernance: "YourMosaicalGovernanceAddress", // YourMosaicalGovernanceAddress
  MockGameNFT: "YourMockGameNFTAddress" // YourMockGameNFTAddress
};

// Supported networks
export const SUPPORTED_NETWORKS = {
  // Example network configs - update with actual supported networks
  // Ethereum Mainnet
  1: {
    name: "Ethereum",
    rpcUrl: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY",
    blockExplorer: "https://etherscan.io"
  },
  // Goerli Testnet
  5: {
    name: "Goerli",
    rpcUrl: "https://goerli.infura.io/v3/YOUR_INFURA_KEY",
    blockExplorer: "https://goerli.etherscan.io"
  },
  // Sepolia Testnet
  11155111: {
    name: "Sepolia",
    rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
    blockExplorer: "https://sepolia.etherscan.io"
  },
  // Saga devpros
  YourChainId: {
    name: "YourNetwork", // YourNetwork
    rpcUrl: "YourRPCURL", // YourRPCURL
    blockExplorer: "YourBlockExplorer", // YourBlockExplorer
    currency: {
      name: "YourCurrencyName", // YourCurrencyName
      symbol: "YourCurrencySymbol", // YourCurrencySymbol
      decimals: 18 // YourCurrencyDecimals
    }
  }
  // Add more networks as needed
}; 