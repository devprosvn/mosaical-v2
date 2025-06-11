
require("@nomicfoundation/hardhat-toolbox");
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
      gasPrice: "auto", // Fixed gas price is disabled on this chainlet
      timeout: 60000
    },
    hardhat: {
      chainId: 1337,
      accounts: {
        accountsBalance: "10000000000000000000000000" // Very large balance for local testing
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
