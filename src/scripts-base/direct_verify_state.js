const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// --- CẬP NHẬT CÁC ĐỊA CHỈ TỪ FILE CONSTANTS CỦA BẠN ---
const NFT_VAULT_ADDRESS = "0xYourNFTVaultAddress";
const NFT_COLLECTION_ADDRESS = "0xYourNFTCollectionAddress";
const USER_ADDRESS = "0xYourWalletAddress"; // Ví của bạn
const TOKEN_ID_TO_CHECK = 3; // NFT #3 bạn đã deposit
const RPC_URL = "YourRPCURL";
// -----------------------------------------------------------------

// Load ABIs
function loadABI(contractName) {
  const artifactPath = path.join(__dirname, `../artifacts/contracts/${contractName}.sol/${contractName}.json`);
  if (!fs.existsSync(artifactPath)) {
    console.error(`ABI file not found: ${artifactPath}`);
    console.error(`Make sure you've compiled the contracts with 'npx hardhat compile'`);
    process.exit(1);
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  return artifact.abi;
}

async function main() {
  console.log("--- Verifying On-Chain State on devpros (Direct) ---");
  
  // Connect to provider
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  // Load ABIs
  const NFTVaultABI = loadABI("NFTVaultV3");
  const GameFiOracleABI = loadABI("GameFiOracleV3");
  const MockNFTABI = loadABI("MockGameNFT");
  
  // Connect to contracts
  const nftVault = new ethers.Contract(NFT_VAULT_ADDRESS, NFTVaultABI, provider);
  const mockNFT = new ethers.Contract(NFT_COLLECTION_ADDRESS, MockNFTABI, provider);

  // 1. Kiểm tra xem NFT có thực sự nằm trong Vault không
  const depositInfo = await nftVault.deposits(NFT_COLLECTION_ADDRESS, TOKEN_ID_TO_CHECK);
  console.log(`\n1. Checking Deposit Status for NFT #${TOKEN_ID_TO_CHECK}:`);
  if (depositInfo.owner.toLowerCase() === USER_ADDRESS.toLowerCase() && depositInfo.isActive) {
    console.log(`✅ SUCCESS: NFT #${TOKEN_ID_TO_CHECK} is correctly deposited by ${depositInfo.owner}`);
  } else {
    console.log(`❌ FAILED: NFT #${TOKEN_ID_TO_CHECK} is NOT in the vault for this user.`);
    console.log(`   Owner: ${depositInfo.owner}`);
    console.log(`   Is Active: ${depositInfo.isActive}`);
  }

  // 2. Kiểm tra vị thế và hạn mức vay của NFT đó
  console.log(`\n2. Checking User Position for NFT #${TOKEN_ID_TO_CHECK}:`);
  const position = await nftVault.getUserPosition(USER_ADDRESS, NFT_COLLECTION_ADDRESS, TOKEN_ID_TO_CHECK);

  const maxBorrow = ethers.formatEther(position.maxBorrow.toString());
  console.log(` -> Max Borrow Amount: ${maxBorrow} DPSV`);
  console.log(` -> Total Debt: ${ethers.formatEther(position.totalDebt.toString())} DPSV`);
  console.log(` -> Has Active Loan: ${position.hasLoan}`);

  if (parseFloat(maxBorrow) > 0) {
    console.log("✅ SUCCESS: The borrow amount is valid. The 'Borrow' button should be ENABLED.");
  } else {
    console.log("❌ FAILED: The borrow amount is 0. This is why the 'Borrow' button is disabled.");
    
    // Kiểm tra thêm về Oracle price
    console.log("\n3. Checking Oracle Floor Price:");
    const oracleAddress = await nftVault.oracle();
    const oracle = new ethers.Contract(oracleAddress, GameFiOracleABI, provider);
    const floorPrice = await oracle.getFloorPrice(NFT_COLLECTION_ADDRESS);
    console.log(` -> Floor Price: ${ethers.formatEther(floorPrice.toString())} DPSV`);
    
    if (floorPrice.toString() === "0") {
      console.log("❌ FAILED: The floor price is 0. This is why the max borrow amount is 0.");
      console.log("   Solution: Run the update oracle script to set a floor price.");
      console.log("   Command: node src/scripts/direct_full_setup.js 3");
    }
  }
  
  // 3. Kiểm tra tất cả NFT của user trong vault bằng cách quét trực tiếp
  console.log("\n4. Checking All User Deposits:");
  console.log("   Scanning for deposits in the vault...");
  
  // Quét qua 20 token ID đầu tiên để tìm deposit
  const userDeposits = [];
  for (let i = 0; i < 20; i++) {
    try {
      const depositInfo = await nftVault.deposits(NFT_COLLECTION_ADDRESS, i);
      if (depositInfo.owner.toLowerCase() === USER_ADDRESS.toLowerCase() && depositInfo.isActive) {
        userDeposits.push({
          collectionAddress: NFT_COLLECTION_ADDRESS,
          tokenId: i,
          isActive: depositInfo.isActive
        });
      }
    } catch (error) {
      // Bỏ qua lỗi và tiếp tục quét
    }
  }
  
  console.log(` -> Total Deposits Found: ${userDeposits.length}`);
  
  if (userDeposits.length > 0) {
    console.log(" -> Deposits Details:");
    for (let i = 0; i < userDeposits.length; i++) {
      const deposit = userDeposits[i];
      console.log(`    Deposit #${i+1}:`);
      console.log(`    - Collection: ${deposit.collectionAddress}`);
      console.log(`    - Token ID: ${deposit.tokenId}`);
      console.log(`    - Is Active: ${deposit.isActive}`);
    }
    console.log("✅ SUCCESS: Found deposits for this user.");
  } else {
    console.log("❌ FAILED: No deposits found for this user.");
    console.log("   This explains why 'You have no NFTs in the vault' is showing.");
    
    // Kiểm tra xem user có sở hữu NFT nào không
    console.log("\n   Checking if user owns any NFTs:");
    const balance = await mockNFT.balanceOf(USER_ADDRESS);
    console.log(`   -> User owns ${balance.toString()} NFTs`);
    
    if (balance.toString() === "0") {
      console.log("   ℹ️ User doesn't own any NFTs. Mint some NFTs first:");
      console.log("   Command: node src/scripts/direct_full_setup.js 5");
    } else {
      console.log("   ℹ️ User owns NFTs but hasn't deposited them to the vault.");
    }
  }
  
  // 4. Kiểm tra thanh khoản của vault
  console.log("\n5. Checking Vault Liquidity:");
  const vaultBalance = await provider.getBalance(NFT_VAULT_ADDRESS);
  console.log(` -> Vault Balance: ${ethers.formatEther(vaultBalance.toString())} DPSV`);
  
  if (vaultBalance.toString() === "0") {
    console.log("❌ FAILED: The vault has no liquidity. This is why borrowing might fail.");
    console.log("   Solution: Run the add liquidity script.");
    console.log("   Command: node src/scripts/direct_full_setup.js 4");
  } else {
    console.log("✅ SUCCESS: The vault has liquidity available for borrowing.");
  }
}

main().catch(console.error); 