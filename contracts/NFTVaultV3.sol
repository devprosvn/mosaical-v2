
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTVaultV3 is Ownable, ReentrancyGuard {
    mapping(address => mapping(address => mapping(uint256 => bool))) public deposits;
    mapping(address => bool) public supportedChainlets;
    mapping(address => mapping(address => bool)) public supportedCollections;
    mapping(address => uint8) public gameCategory;
    mapping(address => mapping(uint256 => bytes)) public nftMetadataCache;
    mapping(address => uint8) public collectionRiskTier;
    
    struct RiskModel {
        uint256 baseLTV;
        uint256 liquidationThreshold;
        uint256 maxUtilityBonus;
        uint256 minCollateralAmount;
    }
    
    mapping(uint8 => RiskModel) public riskModels;
    
    struct NFTData {
        address collection;
        uint256 tokenId;
        uint8 gameTier;
        uint256 utilityScore;
        bool isStaked;
        uint256 lastActivityTimestamp;
    }
    
    mapping(address => mapping(uint256 => NFTData)) public nftData;
    
    address public oracle;
    address public loanManager;
    
    event NFTDeposited(address indexed user, address indexed collection, uint256 indexed tokenId, uint256 utilityScore, uint8 gameTier);
    event NFTWithdrawn(address indexed user, address indexed collection, uint256 indexed tokenId);
    event RiskTierUpdated(address indexed collection, uint8 tier);
    event RiskModelUpdated(uint8 tier, uint256 baseLTV, uint256 liquidationThreshold, uint256 maxUtilityBonus);
    
    constructor() Ownable(msg.sender) {
        // Initialize default risk models
        riskModels[1] = RiskModel({
            baseLTV: 70,
            liquidationThreshold: 80,
            maxUtilityBonus: 20,
            minCollateralAmount: 0.1 ether
        });
        
        riskModels[2] = RiskModel({
            baseLTV: 65,
            liquidationThreshold: 75,
            maxUtilityBonus: 15,
            minCollateralAmount: 0.25 ether
        });
        
        riskModels[3] = RiskModel({
            baseLTV: 60,
            liquidationThreshold: 70,
            maxUtilityBonus: 10,
            minCollateralAmount: 0.5 ether
        });
        
        riskModels[4] = RiskModel({
            baseLTV: 50,
            liquidationThreshold: 65,
            maxUtilityBonus: 10,
            minCollateralAmount: 1 ether
        });
        
        riskModels[5] = RiskModel({
            baseLTV: 40,
            liquidationThreshold: 55,
            maxUtilityBonus: 5,
            minCollateralAmount: 2 ether
        });
    }
    
    function initialize(address _oracle, address _loanManager) external onlyOwner {
        oracle = _oracle;
        loanManager = _loanManager;
    }
    
    function depositNFT(address collection, uint256 tokenId) external nonReentrant {
        require(isGameFiNFT(collection), "Not a supported GameFi NFT");
        
        IERC721(collection).transferFrom(msg.sender, address(this), tokenId);
        deposits[msg.sender][collection][tokenId] = true;
        
        NFTData memory data = parseNFTGameData(collection, tokenId);
        nftData[collection][tokenId] = data;
        
        emit NFTDeposited(msg.sender, collection, tokenId, data.utilityScore, data.gameTier);
    }
    
    function withdrawNFT(address collection, uint256 tokenId) external nonReentrant {
        require(deposits[msg.sender][collection][tokenId], "Not your NFT");
        require(getLoanAmount(msg.sender, collection, tokenId) == 0, "Loan exists");
        
        deposits[msg.sender][collection][tokenId] = false;
        IERC721(collection).transferFrom(address(this), msg.sender, tokenId);
        
        emit NFTWithdrawn(msg.sender, collection, tokenId);
    }
    
    function parseNFTGameData(address collection, uint256 tokenId) internal returns (NFTData memory) {
        NFTData memory data;
        data.collection = collection;
        data.tokenId = tokenId;
        
        string memory tokenURI = IERC721Metadata(collection).tokenURI(tokenId);
        nftMetadataCache[collection][tokenId] = bytes(tokenURI);
        
        // Get utility score from oracle
        data.utilityScore = getUtilityScore(collection, tokenId);
        data.gameTier = 1; // Default tier
        data.isStaked = false;
        data.lastActivityTimestamp = block.timestamp;
        
        return data;
    }
    
    function getUtilityScore(address collection, uint256 tokenId) internal view returns (uint256) {
        // In production, would call oracle
        // For now, return default
        return 100;
    }
    
    function getMaxLTV(address collection, uint256 tokenId) public view returns (uint256) {
        uint8 tier = collectionRiskTier[collection];
        if (tier == 0) tier = 3; // Default to middle tier
        
        RiskModel memory model = riskModels[tier];
        
        uint256 utilityScore = nftData[collection][tokenId].utilityScore;
        if (utilityScore == 0) utilityScore = 100;
        
        uint256 utilityBonus = 0;
        if (utilityScore > 100) {
            utilityBonus = ((utilityScore - 100) * model.maxUtilityBonus) / 100;
            if (utilityBonus > model.maxUtilityBonus) {
                utilityBonus = model.maxUtilityBonus;
            }
        }
        
        return model.baseLTV + utilityBonus;
    }
    
    function isGameFiNFT(address collection) public view returns (bool) {
        address chainlet = getChainletFromCollection(collection);
        return supportedChainlets[chainlet] && 
               supportedCollections[chainlet][collection] &&
               gameCategory[collection] > 0;
    }
    
    function getChainletFromCollection(address collection) internal view returns (address) {
        // Simplified implementation - extract chainlet from collection address pattern
        return address(uint160(collection) & 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000);
    }
    
    function getLoanAmount(address user, address collection, uint256 tokenId) internal view returns (uint256) {
        // Call loan manager to get loan amount
        if (loanManager == address(0)) return 0;
        
        (bool success, bytes memory data) = loanManager.staticcall(
            abi.encodeWithSignature("loans(address,address,uint256)", user, collection, tokenId)
        );
        
        if (success && data.length == 32) {
            return abi.decode(data, (uint256));
        }
        
        return 0;
    }
    
    function addSupportedChainlet(address chainlet) external onlyOwner {
        supportedChainlets[chainlet] = true;
    }
    
    function addSupportedCollection(address chainlet, address collection) external onlyOwner {
        require(supportedChainlets[chainlet], "Chainlet not supported");
        supportedCollections[chainlet][collection] = true;
    }
    
    function setGameCategory(address collection, uint8 category) external onlyOwner {
        require(category > 0 && category <= 10, "Invalid game category");
        gameCategory[collection] = category;
    }
    
    function setCollectionRiskTier(address collection, uint8 tier) external onlyOwner {
        require(tier >= 1 && tier <= 5, "Invalid risk tier");
        collectionRiskTier[collection] = tier;
        emit RiskTierUpdated(collection, tier);
    }
    
    function updateRiskModel(
        uint8 tier,
        uint256 baseLTV,
        uint256 liquidationThreshold,
        uint256 maxUtilityBonus,
        uint256 minCollateralAmount
    ) external onlyOwner {
        require(tier >= 1 && tier <= 5, "Invalid risk tier");
        require(baseLTV < liquidationThreshold, "LTV must be < liquidation threshold");
        require(liquidationThreshold <= 90, "Liquidation threshold too high");
        
        riskModels[tier] = RiskModel({
            baseLTV: baseLTV,
            liquidationThreshold: liquidationThreshold,
            maxUtilityBonus: maxUtilityBonus,
            minCollateralAmount: minCollateralAmount
        });
        
        emit RiskModelUpdated(tier, baseLTV, liquidationThreshold, maxUtilityBonus);
    }
}
