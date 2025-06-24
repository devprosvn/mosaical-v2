require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.21",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    devpros: {
      url: "YourRPCURL", // YourRPCURL
      accounts: ["YourPrivateKeyWithout0x"],
      chainId: YourChainId, // YourChainId
      gasPrice: "auto",
      timeout: 60000
    },
    saga: {
      url: "YourRPCURL", // YourRPCURL
      accounts: ["YourPrivateKeyWithout0x"], // YourPrivateKeyWithout0x
      chainId: YourChainId, // YourChainId
      gasPrice: "auto",
      timeout: 60000
    },
    hardhat: {
      chainId: YourChainId, // YourChainId
      accounts: {
        accountsBalance: "YourAccountsBalance" // YourAccountsBalance
      }
    }
  },
  etherscan: {
    apiKey: {
      devpros: "empty"
    },
    customChains: [
      {
        network: "YourNetwork", // YourNetwork
        chainId: YourChainId, // YourChainId
        urls: {
          apiURL: "YourAPIURL", // YourAPIURL
          browserURL: "YourBlockExplorer" // YourBlockExplorer
        }
      }
    ]
  },
  sourcify: {
    enabled: false
  },
  paths: {
    sources: "./src/contracts",
    tests: "./src/test", 
    cache: "./src/cache",
    artifacts: "./src/artifacts"
  }
}; 