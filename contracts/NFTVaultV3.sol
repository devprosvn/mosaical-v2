// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IGameFiOracle {
    function getFloorPrice(address collection) external view returns (uint256);
    function getUtilityScore(address collection, uint256 tokenId) external view returns (uint256);
    function isActiveAsset(address collection, uint256 tokenId) external view returns (bool);
}

interface IDPOToken {
    function mintTokens(address collection, uint256 tokenId, address borrower, uint256 amount) external;
}

contract NFTVaultV3 is Ownable, ReentrancyGuard {

    IGameFiOracle public oracle;
    IDPOToken public dpoToken;

    // Core data structures
    struct NFTDeposit {
        address owner;
        uint256 depositTime;
        bool isActive;
    }

    struct Loan {
        uint256 amount;
        uint256 startTime;
        uint256 interestRate; // basis points (100 = 1%)
        bool isActive;
    }

    struct CollectionConfig {
        bool isSupported;
        uint256 maxLTV; // basis points (7000 = 70%)
        uint256 liquidationThreshold; // basis points
        uint256 baseInterestRate; // basis points
    }

    // Mappings
    mapping(address => mapping(uint256 => NFTDeposit)) public deposits;
    mapping(address => mapping(uint256 => Loan)) public loans;
    mapping(address => CollectionConfig) public collectionConfigs;
    // Removed userETHBalances - using direct native DPSV transfers
    mapping(address => uint8) public collectionRiskTiers;

    struct RiskModel {
        uint256 baseLTV;
        uint256 liquidationThreshold;
        uint256 maxUtilityBonus;
        uint256 minCollateralAmount;
    }

    mapping(uint8 => RiskModel) public riskModels;

    // Constants
    uint256 public constant LIQUIDATION_PENALTY = 1000; // 10%
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    // Events
    event NFTDeposited(address indexed user, address indexed collection, uint256 indexed tokenId);
    event NFTWithdrawn(address indexed user, address indexed collection, uint256 indexed tokenId);
    event LoanCreated(address indexed user, address indexed collection, uint256 indexed tokenId, uint256 amount);
    event LoanRepaid(address indexed user, address indexed collection, uint256 indexed tokenId, uint256 amount);
    event CollectionAdded(address indexed collection, uint256 maxLTV, uint256 liquidationThreshold);
    event Liquidation(address indexed collection, uint256 indexed tokenId, uint256 debtAmount, uint256 salePrice);

    // Admin functions
    function addSupportedCollection(
        address collection,
        uint256 maxLTV,
        uint256 liquidationThreshold,
        uint256 baseInterestRate
    ) public onlyOwner {
        require(maxLTV <= 8000, "Max LTV too high"); // Max 80%
        require(liquidationThreshold >= maxLTV, "Invalid liquidation threshold");

        collectionConfigs[collection] = CollectionConfig({
            isSupported: true,
            maxLTV: maxLTV,
            liquidationThreshold: liquidationThreshold,
            baseInterestRate: baseInterestRate
        });

        emit CollectionAdded(collection, maxLTV, liquidationThreshold);
    }

    function addSupportedCollection(address collection) public onlyOwner {
        addSupportedCollection(collection, 7000, 8500, 500); // 70% LTV, 85% liquidation, 5% interest
    }

    constructor(address _oracle) Ownable(msg.sender) {
        oracle = IGameFiOracle(_oracle);

        // Initialize risk models
        riskModels[1] = RiskModel(70, 80, 20, 1 ether);   // Tier 1: 70% LTV, 80% liquidation
        riskModels[2] = RiskModel(65, 75, 15, 2 ether);   // Tier 2: 65% LTV, 75% liquidation  
        riskModels[3] = RiskModel(60, 70, 10, 3 ether);   // Tier 3: 60% LTV, 70% liquidation
        riskModels[4] = RiskModel(55, 65, 8, 5 ether);    // Tier 4: 55% LTV, 65% liquidation
        riskModels[5] = RiskModel(50, 60, 5, 10 ether);   // Tier 5: 50% LTV, 60% liquidation
    }

    function updateOracle(address _oracle) external onlyOwner {
        oracle = IGameFiOracle(_oracle);
    }

    function setDPOToken(address _dpoToken) external onlyOwner {
        dpoToken = IDPOToken(_dpoToken);
    }

    // Core NFT functions
    function depositNFT(address collection, uint256 tokenId) external nonReentrant {
        require(collectionConfigs[collection].isSupported, "Collection not supported");
        require(IERC721(collection).ownerOf(tokenId) == msg.sender, "Not NFT owner");

        // Transfer NFT to vault
        IERC721(collection).transferFrom(msg.sender, address(this), tokenId);

        deposits[collection][tokenId] = NFTDeposit({
            owner: msg.sender,
            depositTime: block.timestamp,
            isActive: true
        });

        emit NFTDeposited(msg.sender, collection, tokenId);
    }

    function withdrawNFT(address collection, uint256 tokenId) external nonReentrant {
        NFTDeposit storage deposit = deposits[collection][tokenId];
        require(deposit.owner == msg.sender, "Not your NFT");
        require(deposit.isActive, "NFT not active");
        require(!loans[collection][tokenId].isActive, "Active loan exists");

        deposit.isActive = false;
        IERC721(collection).transferFrom(address(this), msg.sender, tokenId);

        emit NFTWithdrawn(msg.sender, collection, tokenId);
    }

    // Lending functions
    function borrow(address collection, uint256 tokenId, uint256 amount) external nonReentrant {
        NFTDeposit storage deposit = deposits[collection][tokenId];
        require(deposit.owner == msg.sender, "Not your NFT");
        require(deposit.isActive, "NFT not deposited");
        require(!loans[collection][tokenId].isActive, "Active loan exists");

        uint256 maxBorrow = getMaxBorrowAmount(collection, tokenId);
        require(amount <= maxBorrow, "Exceeds max LTV");
        require(address(this).balance >= amount, "Insufficient funds");

        CollectionConfig memory config = collectionConfigs[collection];
        loans[collection][tokenId] = Loan({
            amount: amount,
            startTime: block.timestamp,
            interestRate: config.baseInterestRate,
            isActive: true
        });

        // Mint DPO tokens if DPO token contract is set
        if (address(dpoToken) != address(0)) {
            dpoToken.mintTokens(collection, tokenId, msg.sender, amount);
        }

        // Transfer native DPSV to borrower
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "DPSV transfer failed");

        emit LoanCreated(msg.sender, collection, tokenId, amount);
    }

    function repayLoan(address collection, uint256 tokenId) external payable nonReentrant {
        Loan storage loan = loans[collection][tokenId];
        NFTDeposit storage deposit = deposits[collection][tokenId];

        require(deposit.owner == msg.sender, "Not your NFT");
        require(loan.isActive, "No active loan");

        uint256 totalDebt = getTotalDebt(collection, tokenId);
        require(msg.value >= totalDebt, "Insufficient payment");

        loan.isActive = false;

        // Refund excess payment
        if (msg.value > totalDebt) {
            payable(msg.sender).transfer(msg.value - totalDebt);
        }

        emit LoanRepaid(msg.sender, collection, tokenId, totalDebt);
    }

    // withdrawETH removed - borrowers receive DPSV directly upon borrowing

    // Liquidation
    function liquidate(address collection, uint256 tokenId) external nonReentrant {
        Loan storage loan = loans[collection][tokenId];
        require(loan.isActive, "No active loan");

        uint256 currentLTV = getCurrentLTV(collection, tokenId);
        uint256 liquidationThreshold = collectionConfigs[collection].liquidationThreshold;
        require(currentLTV >= liquidationThreshold, "Not liquidatable");

        uint256 totalDebt = getTotalDebt(collection, tokenId);
        uint256 floorPrice = oracle.getFloorPrice(collection);
        uint256 salePrice = floorPrice * (BASIS_POINTS - LIQUIDATION_PENALTY) / BASIS_POINTS;

        loan.isActive = false;
        deposits[collection][tokenId].isActive = false;

        // Transfer NFT to liquidator (simplified - in production would use auction)
        IERC721(collection).transferFrom(address(this), msg.sender, tokenId);

        emit Liquidation(collection, tokenId, totalDebt, salePrice);
    }

    // View functions
    function getMaxBorrowAmount(address collection, uint256 tokenId) public view returns (uint256) {
        if (!oracle.isActiveAsset(collection, tokenId)) return 0;

        uint256 floorPrice = oracle.getFloorPrice(collection);
        if (floorPrice == 0) return 0;

        // getMaxLTV now returns basis points consistently
        uint256 maxLTV = getMaxLTV(collection, tokenId);
        if (maxLTV == 0) return 0;

        return floorPrice * maxLTV / BASIS_POINTS;
    }

    function getTotalDebt(address collection, uint256 tokenId) public view returns (uint256) {
        Loan memory loan = loans[collection][tokenId];
        if (!loan.isActive) return 0;

        uint256 timeElapsed = block.timestamp - loan.startTime;
        uint256 interest = loan.amount * loan.interestRate * timeElapsed / BASIS_POINTS / SECONDS_PER_YEAR;

        return loan.amount + interest;
    }

    function getCurrentLTV(address collection, uint256 tokenId) public view returns (uint256) {
        if (!loans[collection][tokenId].isActive) return 0;

        uint256 totalDebt = getTotalDebt(collection, tokenId);
        uint256 floorPrice = oracle.getFloorPrice(collection);

        if (floorPrice == 0) return BASIS_POINTS; // 100% if no price data
        return totalDebt * BASIS_POINTS / floorPrice;
    }

    function getUserPosition(address user, address collection, uint256 tokenId) 
        external view returns (
            bool hasDeposit,
            bool hasLoan,
            uint256 loanAmount,
            uint256 totalDebt,
            uint256 maxBorrow,
            uint256 currentLTV
        ) {
        NFTDeposit memory deposit = deposits[collection][tokenId];
        Loan memory loan = loans[collection][tokenId];

        hasDeposit = deposit.owner == user && deposit.isActive;
        hasLoan = loan.isActive;
        loanAmount = loan.amount;
        totalDebt = getTotalDebt(collection, tokenId);
        maxBorrow = getMaxBorrowAmount(collection, tokenId);
        currentLTV = getCurrentLTV(collection, tokenId);
    }

    // Admin functions for GameFi support
    function setGameCategory(address collection, uint8 category) external onlyOwner {
        require(category > 0 && category <= 10, "Invalid game category");
        // Store game category for collection (implementation depends on your needs)
        emit GameCategorySet(collection, category);
    }

    function setCollectionRiskTier(address collection, uint8 tier) external onlyOwner {
        require(tier >= 1 && tier <= 5, "Invalid risk tier");
        collectionRiskTiers[collection] = tier;
        emit CollectionRiskTierSet(collection, tier);
    }

    function getMaxLTV(address collection, uint256 tokenId) public view returns (uint256) {
        uint8 riskTier = collectionRiskTiers[collection];
        uint256 baseLTV;
        
        if (riskTier > 0 && riskTier <= 5) {
            // Use risk model - convert % to basis points
            RiskModel storage model = riskModels[riskTier];
            baseLTV = model.baseLTV * 100; // Convert 65% -> 6500 basis points
        } else {
            // Fall back to collection config or default
            baseLTV = collectionConfigs[collection].maxLTV;
            if (baseLTV == 0) baseLTV = 7000; // Default 70% in basis points
        }

        // Add utility score bonus (already in basis points)
        uint256 utilityScore = oracle.getUtilityScore(collection, tokenId);
        uint256 utilityBonus = utilityScore * 10; // 1% (100 basis points) per 10 utility points

        return baseLTV + utilityBonus;
    }

    function getDepositInfo(address collection, uint256 tokenId) public view returns (address owner, bool isActive) {
        NFTDeposit storage deposit = deposits[collection][tokenId];
        return (deposit.owner, deposit.isActive);
    }

    // Events for admin functions
    event GameCategorySet(address indexed collection, uint8 category);
    event CollectionRiskTierSet(address indexed collection, uint8 tier);

    // Emergency functions
    function emergencyWithdraw(address collection, uint256 tokenId) external onlyOwner {
        IERC721(collection).transferFrom(address(this), owner(), tokenId);
    }

    // Receive ETH for liquidity
    receive() external payable {}
}