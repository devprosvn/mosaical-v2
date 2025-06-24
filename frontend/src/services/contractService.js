import { Contract } from 'ethers';
import { CONTRACT_ADDRESSES } from '../constants/contracts';

// Import ABIs
import NFTVaultABI from '../abi/contracts/NFTVaultV3.sol/NFTVaultV3.json';
import DPOTokenABI from '../abi/contracts/DPOTokenV3.sol/DPOTokenV3.json';
import GameFiOracleABI from '../abi/contracts/GameFiOracleV3.sol/GameFiOracleV3.json';

// Simple ERC721 ABI for approving NFTs
const IERC721ABI = [
  "function approve(address to, uint256 tokenId) external",
  "function ownerOf(uint256 tokenId) external view returns (address owner)"
];

export class ContractService {
  constructor(provider, signer) {
    this.provider = provider;
    this.signer = signer;
    this.contracts = {};
    
    if (provider) {
      this.initContracts();
    }
  }

  initContracts() {
    // Initialize contracts for read-only operations (with provider)
    this.contracts.nftVaultRO = new Contract(
      CONTRACT_ADDRESSES.NFTVault,
      NFTVaultABI.abi,
      this.provider
    );
    
    this.contracts.dpoTokenRO = new Contract(
      CONTRACT_ADDRESSES.DPOToken,
      DPOTokenABI.abi,
      this.provider
    );
    
    this.contracts.gameFiOracleRO = new Contract(
      CONTRACT_ADDRESSES.GameFiOracle,
      GameFiOracleABI.abi,
      this.provider
    );

    // Initialize contracts for write operations (with signer) if available
    if (this.signer) {
      this.contracts.nftVault = this.contracts.nftVaultRO.connect(this.signer);
      this.contracts.dpoToken = this.contracts.dpoTokenRO.connect(this.signer);
      this.contracts.gameFiOracle = this.contracts.gameFiOracleRO.connect(this.signer);
    }
  }

  // NFTVault functions
  async getSupportedCollections() {
    try {
      // Use events to get supported collections since there's no direct method
      const collectionAddedFilter = this.contracts.nftVaultRO.filters.CollectionAdded();
      const events = await this.contracts.nftVaultRO.queryFilter(collectionAddedFilter, -10000);
      
      // Extract unique collection addresses
      const collectionsSet = new Set();
      for (const event of events) {
        collectionsSet.add(event.args.collection.toLowerCase());
      }
      
      return Array.from(collectionsSet);
    } catch (error) {
      console.error("Error getting supported collections:", error);
      
      // For MVP fallback - can hardcode known collections
      const fallbackCollections = [
        // Example: MockGameNFT address
        CONTRACT_ADDRESSES.MockGameNFT
      ].filter(address => address && address !== "0x0000000000000000000000000000000000000000");
      
      return fallbackCollections;
    }
  }

  async getUserDeposits(userAddress) {
    try {
      // We'll use events to get the user's deposits since there's no direct method
      // First, check if the contract has getDepositInfo method
      const depositInfoAvailable = this.contracts.nftVaultRO.getDepositInfo !== undefined;
      
      // Get all NFT Deposited events for this user
      const depositFilter = this.contracts.nftVaultRO.filters.NFTDeposited(userAddress);
      const withdrawFilter = this.contracts.nftVaultRO.filters.NFTWithdrawn(userAddress);
      
      // Get deposit events (limited to last 1000 blocks for demo purposes)
      // In production, you'd want to use a subgraph or backend indexer
      const depositEvents = await this.contracts.nftVaultRO.queryFilter(depositFilter, 0, 'latest');
      const withdrawEvents = await this.contracts.nftVaultRO.queryFilter(withdrawFilter, 0, 'latest');
      
      // Process events to get unique collection/tokenId pairs
      const deposits = [];
      const withdrawn = new Set();
      
      // Track withdrawals
      for (const event of withdrawEvents) {
        const { collection, tokenId } = event.args;
        withdrawn.add(`${collection.toLowerCase()}-${tokenId.toString()}`);
      }
      
      // Process deposits, excluding withdrawn NFTs
      for (const event of depositEvents) {
        const { collection, tokenId } = event.args;
        const key = `${collection.toLowerCase()}-${tokenId.toString()}`;
        
        // Skip if this NFT was withdrawn
        if (withdrawn.has(key)) continue;
        
        // If the contract has getDepositInfo, double-check the deposit is still active
        if (depositInfoAvailable) {
          const [owner, isActive] = await this.contracts.nftVaultRO.getDepositInfo(collection, tokenId);
          if (!isActive || owner.toLowerCase() !== userAddress.toLowerCase()) continue;
        }
        
        deposits.push({
          collectionAddress: collection,
          tokenId: tokenId.toString(),
          owner: userAddress
        });
      }
      
      return deposits;
    } catch (error) {
      console.error("Error getting user deposits:", error);
      // If event-based approach fails, return empty array for MVP
      return [];
    }
  }

  async depositNFT(collectionAddress, tokenId) {
    try {
      // First approve the NFT transfer
      const nftContract = new Contract(
        collectionAddress,
        IERC721ABI,
        this.signer
      );
      
      const approveTx = await nftContract.approve(
        CONTRACT_ADDRESSES.NFTVault, 
        tokenId
      );
      await approveTx.wait();
      
      // Then deposit the NFT
      const tx = await this.contracts.nftVault.depositNFT(
        collectionAddress, 
        tokenId
      );
      
      return await tx.wait();
    } catch (error) {
      console.error("Error depositing NFT:", error);
      throw error;
    }
  }

  async withdrawNFT(collectionAddress, tokenId) {
    try {
      const tx = await this.contracts.nftVault.withdrawNFT(
        collectionAddress, 
        tokenId
      );
      return await tx.wait();
    } catch (error) {
      console.error("Error withdrawing NFT:", error);
      throw error;
    }
  }

  async getUserPosition(userAddress, collectionAddress, tokenId) {
    try {
      return await this.contracts.nftVaultRO.getUserPosition(
        userAddress,
        collectionAddress,
        tokenId
      );
    } catch (error) {
      console.error("Error getting user position:", error);
      throw error;
    }
  }

  async borrow(collectionAddress, tokenId, amount) {
    try {
      console.log(`Borrowing ${amount} DPSV from collection ${collectionAddress} for token ${tokenId}`);
      const tx = await this.contracts.nftVault.borrow(
        collectionAddress,
        tokenId,
        amount
      );
      return await tx.wait();
    } catch (error) {
      console.error("Error borrowing:", error);
      throw error;
    }
  }

  async repayLoan(collectionAddress, tokenId, value) {
    if (!this.signer) throw new Error("Signer not available");

    try {
        const tx = await this.contracts.nftVault.repayLoan(
            collectionAddress, 
            tokenId,
            { value: value } // Correctly structure the overrides object
        );
        return await tx.wait();
    } catch (error) {
        console.error("Error in contractService.repayLoan:", error);
        throw error;
    }
  }

  // Admin functions
  async addSupportedCollection(collectionAddress, maxLTV, liquidationThreshold, baseInterestRate) {
    try {
      const tx = await this.contracts.nftVault.addSupportedCollection(
        collectionAddress,
        maxLTV,
        liquidationThreshold,
        baseInterestRate
      );
      return await tx.wait();
    } catch (error) {
      console.error("Error adding supported collection:", error);
      throw error;
    }
  }

  async updateFloorPrice(collectionAddress, price) {
    try {
      const tx = await this.contracts.gameFiOracle.updateFloorPrice(
        collectionAddress,
        price
      );
      return await tx.wait();
    } catch (error) {
      console.error("Error updating floor price:", error);
      throw error;
    }
  }

  // Liquidation functions
  async liquidateLoan(collectionAddress, tokenId) {
    try {
      const tx = await this.contracts.nftVault.liquidate(
        collectionAddress,
        tokenId
      );
      return await tx.wait();
    } catch (error) {
      console.error("Error liquidating loan:", error);
      throw error;
    }
  }

  async getLoansAtRisk() {
    try {
      // This would ideally be implemented with a subgraph or backend indexer
      // For MVP, we'll use events and filter manually
      
      // Get all borrow events
      const borrowFilter = this.contracts.nftVaultRO.filters.Borrowed();
      const borrowEvents = await this.contracts.nftVaultRO.queryFilter(borrowFilter, -10000);
      
      // Get all repay events
      const repayFilter = this.contracts.nftVaultRO.filters.LoanRepaid();
      const repayEvents = await this.contracts.nftVaultRO.queryFilter(repayFilter, -10000);
      
      // Get all liquidation events
      const liquidationFilter = this.contracts.nftVaultRO.filters.Liquidated();
      const liquidationEvents = await this.contracts.nftVaultRO.queryFilter(liquidationFilter, -10000);
      
      // Track repaid and liquidated loans
      const closedLoans = new Set();
      for (const event of [...repayEvents, ...liquidationEvents]) {
        const { collection, tokenId } = event.args;
        closedLoans.add(`${collection.toLowerCase()}-${tokenId.toString()}`);
      }
      
      // Process borrow events to find active loans
      const activeLoans = [];
      for (const event of borrowEvents) {
        const { borrower, collection, tokenId } = event.args;
        const key = `${collection.toLowerCase()}-${tokenId.toString()}`;
        
        // Skip if this loan was repaid or liquidated
        if (closedLoans.has(key)) continue;
        
        try {
          // Get the current user position
          const position = await this.getUserPosition(borrower, collection, tokenId);
          
          // Get collection parameters
          const collectionParams = await this.contracts.nftVaultRO.getCollectionParameters(collection);
          const liquidationThreshold = Number(collectionParams.liquidationThreshold) / 100; // Convert from basis points to percentage
          
          // Check if the loan is at risk (current LTV >= liquidation threshold)
          if (Number(position.currentLTV) >= liquidationThreshold) {
            activeLoans.push({
              borrower,
              collectionAddress: collection,
              tokenId: tokenId.toString(),
              currentLTV: Number(position.currentLTV),
              liquidationThreshold,
              totalDebt: position.totalDebt,
              maxBorrow: position.maxBorrow
            });
          }
        } catch (error) {
          console.error(`Error processing loan for ${collection}-${tokenId}:`, error);
          // Continue to next loan
        }
      }
      
      return activeLoans;
    } catch (error) {
      console.error("Error getting loans at risk:", error);
      return [];
    }
  }

  // DPO Token functions
  async getDPOTokenBalance(userAddress, collectionAddress, tokenId) {
    try {
      // Get the DPO token address for this NFT
      const dpoTokenAddress = await this.contracts.dpoTokenRO.nftToDPOToken(collectionAddress, tokenId);
      
      // If no token exists, return 0
      if (dpoTokenAddress === "0x0000000000000000000000000000000000000000") {
        return 0;
      }
      
      // Get the user's balance
      return await this.contracts.dpoTokenRO.tokenHoldings(collectionAddress, tokenId, userAddress);
    } catch (error) {
      console.error("Error getting DPO token balance:", error);
      return 0;
    }
  }

  async getDPOTokenSupply(collectionAddress, tokenId) {
    try {
      return await this.contracts.dpoTokenRO.nftTokenSupply(collectionAddress, tokenId);
    } catch (error) {
      console.error("Error getting DPO token supply:", error);
      return 0;
    }
  }

  async tradeDPOTokens(collectionAddress, tokenId, recipientAddress, amount) {
    try {
      const tx = await this.contracts.dpoToken.tradeDPOTokens(
        collectionAddress,
        tokenId,
        recipientAddress,
        amount
      );
      return await tx.wait();
    } catch (error) {
      console.error("Error trading DPO tokens:", error);
      throw error;
    }
  }

  /**
   * Simple ERC20 transfer of DPO tokens (does not update per-NFT ledgers)
   * @param {string} recipientAddress Recipient wallet
   * @param {bigint|string} amountWei  Token amount in wei (10^18)
   */
  async transferDPOTokens(recipientAddress, amountWei) {
    if (!this.signer) throw new Error('Signer not available');
    try {
      const tx = await this.contracts.dpoToken.transfer(recipientAddress, amountWei);
      return await tx.wait();
    } catch (error) {
      console.error('Error transferring DPO tokens:', error);
      throw error;
    }
  }

  // Check if an address is the contract owner
  async isContractOwner(address) {
    try {
      const owner = await this.contracts.nftVaultRO.owner();
      return owner.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.error("Error checking if address is contract owner:", error);
      return false;
    }
  }

  async getWalletBalance() {
    if (!this.provider || !this.signer) return 0n;
    const address = await this.signer.getAddress();
    return await this.provider.getBalance(address);
  }

  async setDPOToken(dpoTokenAddress) {
    if (!this.signer) throw new Error('Signer not available');
    try {
      const tx = await this.contracts.nftVault.setDPOToken(dpoTokenAddress);
      const receipt = await tx.wait();

      // Update local instance to new DPO token address for signer & provider
      this.contracts.dpoTokenRO = new Contract(
        dpoTokenAddress,
        DPOTokenABI.abi,
        this.provider
      );
      if (this.signer) {
        this.contracts.dpoToken = this.contracts.dpoTokenRO.connect(this.signer);
      }

      // Authorize the vault as minter (requires owner of DPO token)
      try {
        const authTx = await this.contracts.dpoToken.authorizeMinter(CONTRACT_ADDRESSES.NFTVault);
        await authTx.wait();
      } catch (e) {
        console.warn('authorizeMinter failed (maybe already authorized):', e?.reason || e?.message);
      }

      return receipt;
    } catch (error) {
      console.error('Error setting DPO token:', error);
      throw error;
    }
  }
} 