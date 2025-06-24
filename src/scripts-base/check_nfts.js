const { ethers } = require("hardhat");

// --- CHANGE THESE PARAMETERS ---
// The address of the deployed MockGameNFT contract
const NFT_CONTRACT_ADDRESS = "0xYourNFTContractAddress"; // YourNFTContractAddress
// The address whose NFTs you want to check
const ADDRESS_TO_CHECK = "0xYourAddress"; // YourAddress
// --- END OF PARAMETERS ---

async function main() {
  console.log("=== NFT OWNERSHIP CHECK SCRIPT ===");
  console.log("Connecting to the contract...");

  const nftContract = await ethers.getContractAt("MockGameNFT", NFT_CONTRACT_ADDRESS);
  
  console.log(`Connected to MockGameNFT at: ${NFT_CONTRACT_ADDRESS}`);
  console.log(`Checking NFT ownership for address: ${ADDRESS_TO_CHECK}`);

  // We don't know how many NFTs to check, so we'll check up to a reasonable limit
  const MAX_TOKEN_ID_TO_CHECK = 100;
  const ownedTokens = [];

  console.log("\nScanning token IDs from 1 to", MAX_TOKEN_ID_TO_CHECK, "...");
  
  // Attempt to check each token ID
  for (let tokenId = 1; tokenId <= MAX_TOKEN_ID_TO_CHECK; tokenId++) {
    try {
      // First check if the token exists
      let exists = false;
      
      try {
        exists = await nftContract.exists(tokenId);
      } catch (error) {
        // If 'exists' function is not available, we'll have to try 'ownerOf' directly
        exists = true; // Assume it might exist and we'll catch if it doesn't
      }
      
      if (!exists) {
        continue; // Skip non-existent tokens
      }
      
      // Check who owns this token
      try {
        const owner = await nftContract.ownerOf(tokenId);
        
        // If the owner matches our address to check
        if (owner.toLowerCase() === ADDRESS_TO_CHECK.toLowerCase()) {
          ownedTokens.push(tokenId);
          console.log(`✅ Token ID ${tokenId} is owned by the address`);
          
          // Optionally get token URI/metadata
          try {
            const tokenURI = await nftContract.tokenURI(tokenId);
            console.log(`   Token URI: ${tokenURI}`);
          } catch (error) {
            console.log(`   Could not retrieve tokenURI: ${error.message}`);
          }
        }
      } catch (error) {
        // Token does not exist or other error
        if (!error.message.includes("nonexistent token")) {
          console.log(`❌ Error checking Token ID ${tokenId}: ${error.message}`);
        }
      }
    } catch (error) {
      console.log(`❌ Error scanning token ${tokenId}: ${error.message}`);
    }
  }

  console.log("\n=== NFT Ownership Summary ===");
  if (ownedTokens.length === 0) {
    console.log(`❌ Address ${ADDRESS_TO_CHECK} does not own any NFTs from this collection.`);
  } else {
    console.log(`✅ Address ${ADDRESS_TO_CHECK} owns the following ${ownedTokens.length} token(s):`);
    console.log(ownedTokens.join(", "));
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in main function:", error);
    process.exit(1);
  }); 