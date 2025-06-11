
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IAIPricePredictor {
    function predictNFTPrice(address collection, uint256 tokenId) external view returns (uint256 price, uint256 confidence);
}

contract GameFiOracleV3 is Ownable, ReentrancyGuard {
    mapping(address => uint256) public collectionFloorPrices;
    mapping(address => mapping(uint256 => uint256)) public nftUtilityScores;
    
    struct PricePoint {
        uint256 timestamp;
        uint256 price;
    }
    
    mapping(address => PricePoint[30]) public priceHistory;
    mapping(address => uint8) public historyIndex;
    mapping(address => uint256) public collectionVolatility;
    
    struct PriceSource {
        string name;
        uint256 weight;
        uint256 reliability;
        uint256 lastUpdateTimestamp;
    }
    
    mapping(address => PriceSource[]) public priceSources;
    
    struct GameMetrics {
        uint256 activeUsers;
        uint256 avgPlaytime;
        uint256 revenue;
        uint256 retention;
    }
    
    mapping(address => GameMetrics) public gameMetrics;
    mapping(address => uint256) public predictionConfidence;
    
    address public aiPricePredictionSystem;
    mapping(address => bool) public authorizedFeeders;
    mapping(address => uint256) public lastPriceUpdateTime;
    uint256 public constant RATE_LIMIT_DURATION = 3600; // 1 hour
    
    event FloorPriceUpdated(address indexed collection, uint256 price, uint256 previousPrice);
    event VolatilityUpdated(address indexed collection, uint256 volatility);
    event GameMetricsUpdated(address indexed collection, uint256 activeUsers, uint256 avgPlaytime, uint256 revenue, uint256 retention);
    event PredictionConfidenceUpdated(address indexed collection, uint256 confidence);
    
    constructor() Ownable(msg.sender) {}
    
    function initialize() external onlyOwner {
        // Initialize with admin as authorized feeder
        authorizedFeeders[msg.sender] = true;
    }
    
    function setAIPredictionSystem(address _aiSystem) external onlyOwner {
        aiPricePredictionSystem = _aiSystem;
    }
    
    function setCollectionFloorPrice(address collection, uint256 price) external onlyAuthorizedFeeder {
        require(block.timestamp >= lastPriceUpdateTime[collection] + RATE_LIMIT_DURATION, "Rate limited");
        
        uint256 prevPrice = collectionFloorPrices[collection];
        collectionFloorPrices[collection] = price;
        lastPriceUpdateTime[collection] = block.timestamp;
        
        uint8 index = historyIndex[collection];
        priceHistory[collection][index] = PricePoint({
            timestamp: block.timestamp,
            price: price
        });
        
        historyIndex[collection] = (index + 1) % 30;
        
        if (prevPrice > 0) {
            updateVolatility(collection);
        }
        
        emit FloorPriceUpdated(collection, price, prevPrice);
    }
    
    function updateVolatility(address collection) internal {
        uint256 oldestTimestamp = type(uint256).max;
        uint256 newestTimestamp = 0;
        uint256 oldestPrice = 0;
        uint256 newestPrice = 0;
        
        for (uint8 i = 0; i < 30; i++) {
            PricePoint memory pp = priceHistory[collection][i];
            if (pp.timestamp == 0) continue;
            
            if (pp.timestamp < oldestTimestamp) {
                oldestTimestamp = pp.timestamp;
                oldestPrice = pp.price;
            }
            
            if (pp.timestamp > newestTimestamp) {
                newestTimestamp = pp.timestamp;
                newestPrice = pp.price;
            }
        }
        
        if (oldestTimestamp == newestTimestamp) return;
        
        uint256 timespan = newestTimestamp - oldestTimestamp;
        if (timespan < 1 days) return;
        
        uint256 avgPrice = (oldestPrice + newestPrice) / 2;
        uint256 maxDeviation = 0;
        
        for (uint8 i = 0; i < 30; i++) {
            PricePoint memory pp = priceHistory[collection][i];
            if (pp.timestamp == 0) continue;
            
            uint256 deviation;
            if (pp.price > avgPrice) {
                deviation = ((pp.price - avgPrice) * 10000) / avgPrice;
            } else {
                deviation = ((avgPrice - pp.price) * 10000) / avgPrice;
            }
            
            if (deviation > maxDeviation) {
                maxDeviation = deviation;
            }
        }
        
        uint256 daysInSample = timespan / 1 days;
        uint256 dailyVolatility = maxDeviation / daysInSample;
        
        collectionVolatility[collection] = dailyVolatility;
        
        emit VolatilityUpdated(collection, dailyVolatility);
    }
    
    function getNFTPrice(address collection, uint256 tokenId) external view returns (uint256) {
        uint256 floorPrice = collectionFloorPrices[collection];
        uint256 utilityScore = nftUtilityScores[collection][tokenId];
        uint256 volatility = collectionVolatility[collection];
        
        if (utilityScore == 0) utilityScore = 100;
        
        uint256 basePrice = (floorPrice * utilityScore) / 100;
        
        // Try AI prediction if available
        if (aiPricePredictionSystem != address(0)) {
            try IAIPricePredictor(aiPricePredictionSystem).predictNFTPrice(collection, tokenId) returns (uint256 aiPrice, uint256 confidence) {
                if (confidence >= 70) {
                    uint256 aiWeight = confidence * 100;
                    basePrice = ((basePrice * (10000 - aiWeight)) + (aiPrice * aiWeight)) / 10000;
                }
            } catch {
                // Fallback to standard pricing
            }
        }
        
        if (volatility > 0) {
            uint256 volatilityDiscount = (volatility * 1000) / 5000;
            if (volatilityDiscount > 1000) volatilityDiscount = 1000;
            
            basePrice = basePrice - ((basePrice * volatilityDiscount) / 10000);
        }
        
        return basePrice;
    }
    
    function setNFTUtilityScore(address collection, uint256 tokenId, uint256 score) external onlyAuthorizedFeeder {
        nftUtilityScores[collection][tokenId] = score;
    }
    
    function updateGameMetrics(
        address collection,
        uint256 activeUsers,
        uint256 avgPlaytime,
        uint256 revenue,
        uint256 retention
    ) external onlyAuthorizedFeeder {
        gameMetrics[collection] = GameMetrics({
            activeUsers: activeUsers,
            avgPlaytime: avgPlaytime,
            revenue: revenue,
            retention: retention
        });
        
        emit GameMetricsUpdated(collection, activeUsers, avgPlaytime, revenue, retention);
    }
    
    function getGameEngagementFactor(address collection) public view returns (uint256) {
        GameMetrics memory metrics = gameMetrics[collection];
        
        if (metrics.activeUsers == 0) return 50;
        
        uint256 userScore = 0;
        if (metrics.activeUsers >= 100000) userScore = 30;
        else if (metrics.activeUsers >= 50000) userScore = 25;
        else if (metrics.activeUsers >= 10000) userScore = 20;
        else if (metrics.activeUsers >= 5000) userScore = 15;
        else if (metrics.activeUsers >= 1000) userScore = 10;
        else userScore = 5;
        
        uint256 playtimeScore = 0;
        if (metrics.avgPlaytime >= 120) playtimeScore = 20;
        else if (metrics.avgPlaytime >= 60) playtimeScore = 15;
        else if (metrics.avgPlaytime >= 30) playtimeScore = 10;
        else playtimeScore = 5;
        
        uint256 revenueScore = 0;
        if (metrics.revenue >= 100000) revenueScore = 30;
        else if (metrics.revenue >= 50000) revenueScore = 25;
        else if (metrics.revenue >= 10000) revenueScore = 20;
        else if (metrics.revenue >= 5000) revenueScore = 15;
        else if (metrics.revenue >= 1000) revenueScore = 10;
        else revenueScore = 5;
        
        uint256 retentionScore = 0;
        if (metrics.retention >= 8000) retentionScore = 20;
        else if (metrics.retention >= 6000) retentionScore = 15;
        else if (metrics.retention >= 4000) retentionScore = 10;
        else retentionScore = 5;
        
        return userScore + playtimeScore + revenueScore + retentionScore;
    }
    
    function updatePredictionConfidence(address collection, uint256 confidence) external onlyAISystem {
        require(confidence <= 100, "Confidence must be 0-100");
        predictionConfidence[collection] = confidence;
        
        emit PredictionConfidenceUpdated(collection, confidence);
    }
    
    function setOracleFeeder(address feeder, bool authorized) external onlyOwner {
        authorizedFeeders[feeder] = authorized;
    }
    
    function getPriceSourceCount(address collection) external view returns (uint256) {
        return priceSources[collection].length;
    }
    
    modifier onlyAuthorizedFeeder() {
        require(authorizedFeeders[msg.sender], "Not authorized feeder");
        _;
    }
    
    modifier onlyAISystem() {
        require(msg.sender == aiPricePredictionSystem, "Not AI system");
        _;
    }
}
