
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract DPOTokenV3 is ERC20, Ownable, ReentrancyGuard {
    
    // Core mappings
    mapping(address => mapping(uint256 => uint256)) public nftTokenSupply;
    mapping(address => mapping(uint256 => mapping(address => uint256))) public tokenHoldings;
    mapping(address => mapping(uint256 => address)) public nftToDPOToken;
    
    // Trading system
    struct MarketOrder {
        address maker;
        uint256 price;
        uint256 amount;
        uint256 timestamp;
        bool isBuy;
    }
    
    mapping(address => mapping(uint256 => MarketOrder[])) public buyOrders;
    mapping(address => mapping(uint256 => MarketOrder[])) public sellOrders;
    
    // Interest distribution
    struct InterestAccrual {
        uint256 totalDistributed;
        uint256 lastDistributionTimestamp;
        mapping(address => uint256) lastClaimedTimestamp;
        mapping(address => uint256) unclaimed;
    }
    
    mapping(address => mapping(uint256 => InterestAccrual)) public interestAccrual;
    
    uint256 public tradingFee = 50; // 0.5%
    address public feeRecipient;
    address public loanManager;
    
    // Events
    event DPOTokensMinted(address indexed user, address indexed collection, uint256 indexed tokenId, uint256 amount);
    event DPOTokensBurned(address indexed user, address indexed collection, uint256 indexed tokenId, uint256 amount);
    event SellOrderPlaced(address indexed user, address indexed collection, uint256 indexed tokenId, uint256 amount, uint256 price);
    event BuyOrderPlaced(address indexed user, address indexed collection, uint256 indexed tokenId, uint256 amount, uint256 price);
    event InterestDistributed(address indexed collection, uint256 indexed tokenId, uint256 amount);
    event InterestClaimed(address indexed user, address indexed collection, uint256 indexed tokenId, uint256 amount);
    
    modifier onlyLoanManager() {
        require(msg.sender == loanManager, "Only loan manager");
        _;
    }
    
    constructor() ERC20("Mosaical DPO Token", "MDPO") Ownable(msg.sender) {
        feeRecipient = msg.sender;
    }
    
    function setLoanManager(address _loanManager) external onlyOwner {
        loanManager = _loanManager;
    }
    
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        feeRecipient = _feeRecipient;
    }
    
    function mintDPOTokens(
        address user,
        address collection,
        uint256 tokenId,
        uint256 loanAmount
    ) external onlyLoanManager {
        uint256 tokenSupply = (loanAmount * 1000) / (10**15);
        
        _mint(user, tokenSupply);
        nftTokenSupply[collection][tokenId] = tokenSupply;
        tokenHoldings[collection][tokenId][user] = tokenSupply;
        
        emit DPOTokensMinted(user, collection, tokenId, tokenSupply);
    }
    
    function burnDPOTokens(
        address user,
        address collection,
        uint256 tokenId,
        uint256 amount
    ) external onlyLoanManager {
        require(tokenHoldings[collection][tokenId][user] >= amount, "Insufficient DPO tokens");
        
        _burn(user, amount);
        tokenHoldings[collection][tokenId][user] -= amount;
        nftTokenSupply[collection][tokenId] -= amount;
        
        emit DPOTokensBurned(user, collection, tokenId, amount);
    }
    
    function placeSellOrder(
        address collection,
        uint256 tokenId,
        uint256 amount,
        uint256 pricePerToken
    ) external {
        require(amount > 0, "Invalid amount");
        require(pricePerToken > 0, "Invalid price");
        require(tokenHoldings[collection][tokenId][msg.sender] >= amount, "Insufficient DPO tokens");
        
        sellOrders[collection][tokenId].push(MarketOrder({
            maker: msg.sender,
            price: pricePerToken,
            amount: amount,
            timestamp: block.timestamp,
            isBuy: false
        }));
        
        emit SellOrderPlaced(msg.sender, collection, tokenId, amount, pricePerToken);
    }
    
    function placeBuyOrder(
        address collection,
        uint256 tokenId,
        uint256 amount,
        uint256 pricePerToken
    ) external payable {
        require(amount > 0, "Invalid amount");
        require(pricePerToken > 0, "Invalid price");
        
        uint256 totalCost = amount * pricePerToken;
        require(msg.value >= totalCost, "Insufficient payment");
        
        // Try to match with existing sell orders
        _matchOrders(collection, tokenId, amount, pricePerToken, msg.sender);
        
        emit BuyOrderPlaced(msg.sender, collection, tokenId, amount, pricePerToken);
    }
    
    function _matchOrders(
        address collection,
        uint256 tokenId,
        uint256 buyAmount,
        uint256 buyPrice,
        address buyer
    ) internal {
        MarketOrder[] storage sells = sellOrders[collection][tokenId];
        
        for (uint i = 0; i < sells.length && buyAmount > 0; i++) {
            MarketOrder storage sellOrder = sells[i];
            
            if (sellOrder.price <= buyPrice && sellOrder.amount > 0) {
                uint256 tradeAmount = buyAmount < sellOrder.amount ? buyAmount : sellOrder.amount;
                
                // Execute trade
                tokenHoldings[collection][tokenId][sellOrder.maker] -= tradeAmount;
                tokenHoldings[collection][tokenId][buyer] += tradeAmount;
                
                // Handle payment
                uint256 payment = tradeAmount * sellOrder.price;
                payable(sellOrder.maker).transfer(payment);
                
                sellOrder.amount -= tradeAmount;
                buyAmount -= tradeAmount;
            }
        }
    }
    
    function distributeInterest(
        address collection,
        uint256 tokenId,
        uint256 interestAmount
    ) external payable {
        require(msg.value >= interestAmount, "Insufficient payment");
        
        InterestAccrual storage accrual = interestAccrual[collection][tokenId];
        accrual.totalDistributed += interestAmount;
        accrual.lastDistributionTimestamp = block.timestamp;
        
        emit InterestDistributed(collection, tokenId, interestAmount);
    }
    
    function calculatePendingInterest(
        address user,
        address collection,
        uint256 tokenId
    ) external view returns (uint256) {
        InterestAccrual storage accrual = interestAccrual[collection][tokenId];
        uint256 userBalance = tokenHoldings[collection][tokenId][user];
        uint256 totalSupply = nftTokenSupply[collection][tokenId];
        
        if (totalSupply == 0) return 0;
        
        uint256 userShare = (userBalance * accrual.totalDistributed) / totalSupply;
        return userShare - accrual.unclaimed[user];
    }
    
    function claimInterest(address collection, uint256 tokenId) external nonReentrant {
        InterestAccrual storage accrual = interestAccrual[collection][tokenId];
        uint256 pending = this.calculatePendingInterest(msg.sender, collection, tokenId);
        
        require(pending > 0, "No pending interest");
        
        accrual.unclaimed[msg.sender] += pending;
        accrual.lastClaimedTimestamp[msg.sender] = block.timestamp;
        
        payable(msg.sender).transfer(pending);
        
        emit InterestClaimed(msg.sender, collection, tokenId, pending);
    }
    
    receive() external payable {}
}
