import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from './useWeb3';
import { useContracts } from './useContracts';
import { CONTRACT_ADDRESSES } from '../constants/contracts';
import NFTVaultV3_ABI from '../abi/contracts/NFTVaultV3.sol/NFTVaultV3.json';
import { fetchNFTMetadata } from '../services/alchemyService';
import { fetchUserDepositedNFTs, getUserPositionDetails } from '../services/vaultService';

/**
 * Custom hook to fetch and manage vault assets (NFTs deposited as collateral)
 * This serves as the single source of truth for NFT vault data across the app
 * 
 * @param {number} refreshTrigger - Increment this value to force a refresh
 * @returns {Object} Object containing assets, loading state, and error
 */
export function useVaultAssets(refreshTrigger = 0) {
    const { account, provider } = useWeb3();
    const { contractService } = useContracts();
    const [assets, setAssets] = useState([]);
    const [refreshTick, setRefreshTick] = useState(0); // trigger full refresh
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userPositions, setUserPositions] = useState({});

    useEffect(() => {
        const fetchAndProcessAssets = async () => {
            if (!account || !provider || !contractService) {
                console.log("⚠️ [useVaultAssets] Missing account, provider or contractService");
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                console.log("1️⃣ [useVaultAssets] Starting to fetch assets for account:", account);
                
                // Use our direct scanning function from vaultService.js
                const deposits = await fetchUserDepositedNFTs(provider, account);
                console.log("2️⃣ [useVaultAssets] Found deposits:", deposits);
                
                if (!deposits || deposits.length === 0) {
                    console.log("⚠️ [useVaultAssets] No deposits found");
                    setAssets([]);
                    setIsLoading(false);
                    return;
                }
                
                // Fetch metadata and position for each deposited NFT
                const assetsWithMetadata = await Promise.all(
                    deposits.map(async (deposit) => {
                        try {
                            console.log(`3️⃣ [useVaultAssets] Processing deposited NFT #${deposit.tokenId}...`);
                            
                            // Get metadata
                            let metadata;
                            try {
                                metadata = await fetchNFTMetadata(deposit.collectionAddress, deposit.tokenId);
                            } catch (metadataError) {
                                console.error(`Error fetching metadata for NFT #${deposit.tokenId}:`, metadataError);
                                // Provide fallback metadata if fetch fails
                                metadata = {
                                    name: `NFT #${deposit.tokenId}`,
                                    description: "GameFi NFT",
                                    image: "https://via.placeholder.com/300"
                                };
                            }
                            
                            // Get position using our custom function
                            const position = await getUserPositionDetails(
                                provider,
                                account,
                                deposit.collectionAddress,
                                deposit.tokenId
                            );
                            
                            // Store position in state
                            setUserPositions(prev => ({
                                ...prev,
                                [`${deposit.collectionAddress}-${deposit.tokenId}`]: position
                            }));
                            
                            // Ensure the NFT object has the right structure for other components
                            return {
                                ...deposit,
                                ...metadata,
                                contract: { address: deposit.collectionAddress },
                                position
                            };
                        } catch (err) {
                            console.error(`Error processing NFT ${deposit.collectionAddress}-${deposit.tokenId}:`, err);
                            return {
                                ...deposit,
                                name: `NFT #${deposit.tokenId}`,
                                contract: { address: deposit.collectionAddress },
                                error: err.message
                            };
                        }
                    })
                );
                
                console.log("4️⃣ [useVaultAssets] Processed assets:", assetsWithMetadata);
                setAssets(assetsWithMetadata);
            } catch (err) {
                console.error('❌ [useVaultAssets] Error fetching vault assets:', err);
                setError('Failed to load your vault assets');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAndProcessAssets();
    }, [account, provider, contractService, refreshTrigger, refreshTick]);

    // Separate assets into those with loans and those without
    const activeLoans = assets.filter(asset => 
        asset.position && 
        asset.position.hasLoan && 
        asset.position.totalDebt && 
        asset.position.totalDebt.toString() !== '0'
    );
    
    const availableCollateral = assets.filter(asset => 
        !asset.position || 
        !asset.position.hasLoan || 
        !asset.position.totalDebt || 
        asset.position.totalDebt.toString() === '0'
    );

    return { 
        assets,                // All assets
        activeLoans,           // Assets with active loans
        availableCollateral,   // Assets without loans (available for borrowing)
        userPositions,         // Position data by NFT key
        isLoading, 
        error,
        // Helper method to refresh positions for a specific NFT
        refreshPosition: async (collectionAddress, tokenId) => {
            if (!account || !provider) return null;
            
            try {
                const position = await getUserPositionDetails(
                    provider,
                    account,
                    collectionAddress,
                    tokenId
                );
                
                setUserPositions(prev => ({
                    ...prev,
                    [`${collectionAddress}-${tokenId}`]: position
                }));
                
                return position;
            } catch (err) {
                console.error(`Error refreshing position for NFT ${collectionAddress}-${tokenId}:`, err);
                return null;
            }
        },
        // Full refresh all positions & assets
        refreshAllPositions: async () => {
            setRefreshTick(prev => prev + 1);
        }
    };
} 