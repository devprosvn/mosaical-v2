/**
 * FRONTEND DEBUG GUIDE
 * 
 * This file contains code snippets to add to your frontend components
 * to help debug issues with data fetching and rendering.
 * 
 * Instructions:
 * 1. Add the console.log statements to the appropriate components
 * 2. Open your browser's developer console (F12)
 * 3. Observe the logs to identify where the issue occurs
 */

/**
 * DEBUGGING VAULT ASSETS (My Vault Tab)
 * 
 * Add this to your VaultAssets.jsx component:
 */

// In VaultAssets.jsx
useEffect(() => {
  const fetchVaultAssets = async () => {
    if (!account || !contractService) {
      console.log("⚠️ [VaultAssets] Missing account or contractService:", { account, contractService });
      return;
    }

    setIsLoading(true);
    console.log("1️⃣ [VaultAssets] Starting to fetch assets for account:", account);

    try {
      const deposits = await contractService.getUserDeposits(account);
      console.log("2️⃣ [VaultAssets] Found raw deposits from contract:", deposits);

      if (!deposits || deposits.length === 0) {
        console.log("⚠️ [VaultAssets] No deposits found. Exiting fetch.");
        setVaultAssets([]);
        setIsLoading(false);
        return;
      }

      const assetsWithPositions = await Promise.all(
        deposits.map(async (deposit) => {
          console.log(`3️⃣ [VaultAssets] Processing deposited NFT #${deposit.tokenId}...`);
          const position = await contractService.getUserPosition(
            account,
            deposit.collectionAddress,
            deposit.tokenId
          );

          // Dòng log quan trọng nhất!
          console.log(`4️⃣ [VaultAssets] Position for NFT #${deposit.tokenId}:`, {
            hasLoan: position.hasLoan,
            maxBorrow: ethers.formatEther(position.maxBorrow),
            totalDebt: ethers.formatEther(position.totalDebt)
          });

          return { ...deposit, position };
        })
      );

      setVaultAssets(assetsWithPositions);
      console.log("5️⃣ [VaultAssets] Successfully set assets state:", assetsWithPositions);

    } catch (err) {
      console.error('❌ [VaultAssets] Error fetching vault assets:', err);
      setError('Failed to load your vault assets');
    } finally {
      setIsLoading(false);
    }
  };

  fetchVaultAssets();
}, [account, contractService, refreshTrigger]);

/**
 * DEBUGGING CONTRACT SERVICE
 * 
 * Add this to your contractService.js file:
 */

// In contractService.js
export const getUserDeposits = async (userAddress) => {
  try {
    console.log("1️⃣ [ContractService] Getting user deposits for:", userAddress);
    const nftVault = await getNFTVaultContract();
    
    if (!nftVault) {
      console.error("❌ [ContractService] NFT Vault contract not initialized");
      return [];
    }
    
    const deposits = await nftVault.getUserDeposits(userAddress);
    console.log("2️⃣ [ContractService] Raw deposits from contract:", deposits);
    
    return deposits;
  } catch (error) {
    console.error("❌ [ContractService] Error in getUserDeposits:", error);
    throw error;
  }
};

export const getUserPosition = async (userAddress, collectionAddress, tokenId) => {
  try {
    console.log(`1️⃣ [ContractService] Getting position for NFT #${tokenId}`);
    const nftVault = await getNFTVaultContract();
    
    if (!nftVault) {
      console.error("❌ [ContractService] NFT Vault contract not initialized");
      return { maxBorrow: 0, totalDebt: 0, hasLoan: false };
    }
    
    const position = await nftVault.getUserPosition(userAddress, collectionAddress, tokenId);
    console.log(`2️⃣ [ContractService] Raw position for NFT #${tokenId}:`, position);
    
    return position;
  } catch (error) {
    console.error(`❌ [ContractService] Error in getUserPosition for NFT #${tokenId}:`, error);
    throw error;
  }
};

/**
 * DEBUGGING WITHDRAW FUNCTION
 * 
 * Fix the handleWithdrawNFT function in VaultAssets.jsx:
 */

// In VaultAssets.jsx
const handleWithdrawNFT = async (nft) => {
  console.log("1️⃣ [Withdraw] Starting withdrawal with NFT:", nft);
  
  try {
    setIsWithdrawing(true);
    
    // Đảm bảo bạn lấy địa chỉ collection một cách an toàn
    const collectionAddress = nft.collectionAddress || nft.contract?.address;
    const tokenId = nft.tokenId;
    
    console.log("2️⃣ [Withdraw] Extracted data:", { collectionAddress, tokenId });

    if (!tokenId || !collectionAddress) {
      console.error("❌ [Withdraw] Invalid NFT data:", { tokenId, collectionAddress });
      showError('Invalid NFT data');
      return;
    }
    
    const result = await contractService.withdrawNFT(collectionAddress, tokenId);
    console.log("3️⃣ [Withdraw] Withdrawal result:", result);
    
    showSuccess('NFT withdrawn successfully');
    setRefreshTrigger(prev => prev + 1);
  } catch (error) {
    console.error("❌ [Withdraw] Withdrawal error:", error);
    showError('Failed to withdraw NFT: ' + error.message);
  } finally {
    setIsWithdrawing(false);
  }
};

/**
 * DEBUGGING WEB3 CONTEXT
 * 
 * Add this to your Web3Context.jsx to debug connection issues:
 */

// In Web3Context.jsx
useEffect(() => {
  const checkConnection = async () => {
    console.log("1️⃣ [Web3Context] Checking connection...");
    
    if (window.ethereum) {
      console.log("2️⃣ [Web3Context] MetaMask is available");
      
      try {
        // Check if already connected
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        console.log("3️⃣ [Web3Context] Current accounts:", accounts);
        
        if (accounts.length > 0) {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          console.log("4️⃣ [Web3Context] Connected to chain:", chainId);
          
          setAccount(accounts[0]);
          setIsConnected(true);
          
          // Initialize provider and signer
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          console.log("5️⃣ [Web3Context] Signer initialized:", await signer.getAddress());
          
          setProvider(provider);
          setSigner(signer);
        } else {
          console.log("⚠️ [Web3Context] No accounts connected");
          setIsConnected(false);
        }
      } catch (error) {
        console.error("❌ [Web3Context] Error checking connection:", error);
      }
    } else {
      console.log("⚠️ [Web3Context] MetaMask not available");
    }
  };
  
  checkConnection();
}, []);

/**
 * HOW TO USE THIS GUIDE
 * 
 * 1. Add the debug code to your components
 * 2. Open your browser's developer console (F12)
 * 3. Look for error messages or unexpected behavior
 * 4. Common issues:
 *    - Missing or incorrect contract addresses
 *    - NFT data structure inconsistencies
 *    - Web3 connection issues
 *    - Contract function errors
 * 
 * After identifying the issue, you can fix it in your code.
 */ 