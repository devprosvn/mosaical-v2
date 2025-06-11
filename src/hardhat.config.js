
require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require('dotenv').config();

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
    saga: {
      url: process.env.RPC_URL || "https://mosaical-2745549204473000-1.jsonrpc.sagarpc.io",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 2745549204473000,
      gasPrice: "auto",
      timeout: 60000
    },
    mosaical: {
      url: "https://mosaical-2745549204473000-1.jsonrpc.sagarpc.io",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 2745549204473000,
      gasPrice: "auto",
      timeout: 60000
    },
    hardhat: {
      chainId: 1337,
      accounts: {
        accountsBalance: "10000000000000000000000000"
      }
    }
  },
  etherscan: {
    apiKey: {
      saga: "empty",
      mosaical: "empty"
    },
    customChains: [
      {
        network: "saga",
        chainId: 2745549204473000,
        urls: {
          apiURL: "https://api-mosaical-2745549204473000-1.sagaexplorer.io/api",
          browserURL: "https://mosaical-2745549204473000-1.sagaexplorer.io"
        }
      },
      {
        network: "mosaical", 
        chainId: 2745549204473000,
        urls: {
          apiURL: "https://api-mosaical-2745549204473000-1.sagaexplorer.io/api",
          browserURL: "https://mosaical-2745549204473000-1.sagaexplorer.io"
        }
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test", 
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
