import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../constants/contracts';
import NFTVaultV3_ABI from '../abi/contracts/NFTVaultV3.sol/NFTVaultV3.json';

/**
 * Fetches user's deposited NFTs directly from the blockchain by scanning deposit events
 * and checking deposit status in the contract
 * 
 * @param {ethers.Provider} provider - Ethers provider
 * @param {string} account - User's wallet address
 * @returns {Promise<Array>} Array of deposited NFTs
 */
export async function fetchUserDepositedNFTs(provider, account) {
  if (!provider || !account) return [];

  console.log("1️⃣ [vaultService] Starting fetchUserDepositedNFTs for account:", account);
  
  try {
    const vaultContract = new ethers.Contract(
      CONTRACT_ADDRESSES.NFTVault, 
      NFTVaultV3_ABI.abi, 
      provider
    );
    
    // We'll use a combination of methods to get deposits:
    // 1. Check direct deposits mapping for known NFTs
    // 2. Scan events as a backup method
    
    const userDeposits = [];
    const collectionAddress = CONTRACT_ADDRESSES.MockGameNFT;
    
    console.log("2️⃣ [vaultService] Scanning for deposits in collection:", collectionAddress);
    
    // Scan through token IDs (0-20 for MVP)
    // In production, you'd want to use events or a subgraph
    for (let i = 0; i < 20; i++) {
      try {
        const depositInfo = await vaultContract.deposits(collectionAddress, i);
        
        // Check if this NFT is deposited by the user
        if (depositInfo && 
            depositInfo.owner && 
            depositInfo.owner.toLowerCase() === account.toLowerCase() && 
            depositInfo.isActive) {
          
          console.log(`3️⃣ [vaultService] Found deposited NFT #${i}`);
          
          userDeposits.push({
            collectionAddress: collectionAddress,
            tokenId: i.toString(),
            owner: account
          });
        }
      } catch (error) {
        console.log(`Error checking deposit for token #${i}:`, error.message);
        // Continue to next token
      }
    }
    
    console.log(`4️⃣ [vaultService] Found ${userDeposits.length} deposited NFTs`);
    return userDeposits;
    
  } catch (error) {
    console.error("❌ [vaultService] Error in fetchUserDepositedNFTs:", error);
    return [];
  }
}

/**
 * Gets detailed information about a user's position for a specific NFT
 * 
 * @param {ethers.Provider} provider - Ethers provider
 * @param {string} account - User's wallet address
 * @param {string} collectionAddress - NFT collection address
 * @param {string} tokenId - NFT token ID
 * @returns {Promise<Object>} User position details
 */
export async function getUserPositionDetails(provider, account, collectionAddress, tokenId) {
  if (!provider || !account) {
    return { maxBorrow: 0, totalDebt: 0, hasLoan: false };
  }

  console.log(`1️⃣ [vaultService] Getting position for NFT #${tokenId}`);
  
  try {
    const vaultContract = new ethers.Contract(
      CONTRACT_ADDRESSES.NFTVault, 
      NFTVaultV3_ABI.abi, 
      provider
    );
    
    const position = await vaultContract.getUserPosition(
      account,
      collectionAddress,
      tokenId
    );
    
    console.log(`2️⃣ [vaultService] Position for NFT #${tokenId}:`, {
      maxBorrow: ethers.formatUnits(position.maxBorrow, 18) + ' DPSV',
      totalDebt: ethers.formatUnits(position.totalDebt, 18) + ' DPSV',
      hasLoan: position.hasLoan
    });
    
    return position;
  } catch (error) {
    console.error(`❌ [vaultService] Error getting position for NFT #${tokenId}:`, error);
    return { maxBorrow: 0, totalDebt: 0, hasLoan: false };
  }
} 