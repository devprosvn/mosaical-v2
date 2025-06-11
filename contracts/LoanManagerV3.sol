
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface INFTVault {
    function deposits(address collection, uint256 tokenId) external view returns (address, uint256, bool);
    function getMaxBorrowAmount(address collection, uint256 tokenId) external view returns (uint256);
}

interface IDPOToken {
    function mintDPOTokens(address user, address collection, uint256 tokenId, uint256 loanAmount) external;
    function burnDPOTokens(address user, address collection, uint256 tokenId, uint256 amount) external;
}

contract LoanManagerV3 is Ownable, ReentrancyGuard {
    
    INFTVault public nftVault;
    IDPOToken public dpoToken;
    
    struct LoanData {
        uint256 accruedInterest;
        uint256 lastUpdateTime;
    }
    
    struct InterestRateModel {
        uint256 baseRate;
        uint256 slope1;
        uint256 slope2;
        uint256 optimalUtilization;
    }
    
    mapping(address => mapping(address => mapping(uint256 => uint256))) public loans;
    mapping(address => mapping(address => mapping(uint256 => LoanData))) public loanData;
    mapping(address => mapping(address => mapping(uint256 => uint256))) public loanHealthFactors;
    mapping(address => InterestRateModel) public interestRateModels;
    mapping(address => uint256) public collectionUtilization;
    
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    
    event LoanCreated(address indexed borrower, address indexed collection, uint256 indexed tokenId, uint256 amount);
    event LoanRepaid(address indexed borrower, address indexed collection, uint256 indexed tokenId, uint256 amount);
    event InterestUpdated(address indexed borrower, address indexed collection, uint256 indexed tokenId, uint256 interest);
    
    constructor() Ownable(msg.sender) {}
    
    function setNFTVault(address _nftVault) external onlyOwner {
        nftVault = INFTVault(_nftVault);
    }
    
    function setDPOToken(address _dpoToken) external onlyOwner {
        dpoToken = IDPOToken(_dpoToken);
    }
    
    function borrow(
        address collection,
        uint256 tokenId,
        uint256 amount
    ) external nonReentrant {
        (address owner, , bool isActive) = nftVault.deposits(collection, tokenId);
        require(owner == msg.sender, "Not your NFT");
        require(isActive, "NFT not deposited");
        require(loans[msg.sender][collection][tokenId] == 0, "Active loan exists");
        
        uint256 maxBorrow = nftVault.getMaxBorrowAmount(collection, tokenId);
        require(amount <= maxBorrow, "Exceeds max LTV");
        require(address(this).balance >= amount, "Insufficient liquidity");
        
        loans[msg.sender][collection][tokenId] = amount;
        loanData[msg.sender][collection][tokenId] = LoanData({
            accruedInterest: 0,
            lastUpdateTime: block.timestamp
        });
        
        // Calculate health factor (simplified)
        loanHealthFactors[msg.sender][collection][tokenId] = (maxBorrow * BASIS_POINTS) / amount;
        
        // Mint DPO tokens
        if (address(dpoToken) != address(0)) {
            dpoToken.mintDPOTokens(msg.sender, collection, tokenId, amount);
        }
        
        payable(msg.sender).transfer(amount);
        
        emit LoanCreated(msg.sender, collection, tokenId, amount);
    }
    
    function repay(
        address collection,
        uint256 tokenId,
        uint256 amount
    ) external payable nonReentrant {
        require(loans[msg.sender][collection][tokenId] > 0, "No active loan");
        require(msg.value >= amount, "Insufficient payment");
        
        uint256 loanAmount = loans[msg.sender][collection][tokenId];
        LoanData storage data = loanData[msg.sender][collection][tokenId];
        
        uint256 totalOwed = loanAmount + data.accruedInterest;
        require(amount >= totalOwed, "Insufficient repayment");
        
        loans[msg.sender][collection][tokenId] = 0;
        loanHealthFactors[msg.sender][collection][tokenId] = 0;
        data.accruedInterest = 0;
        
        // Refund excess
        if (msg.value > totalOwed) {
            payable(msg.sender).transfer(msg.value - totalOwed);
        }
        
        emit LoanRepaid(msg.sender, collection, tokenId, totalOwed);
    }
    
    function updateLoanInterest(
        address borrower,
        address collection,
        uint256 tokenId
    ) external {
        uint256 loanAmount = loans[borrower][collection][tokenId];
        if (loanAmount == 0) return;
        
        LoanData storage data = loanData[borrower][collection][tokenId];
        uint256 timeElapsed = block.timestamp - data.lastUpdateTime;
        
        if (timeElapsed > 0) {
            uint256 rate = calculateInterestRate(collection);
            uint256 interest = (loanAmount * rate * timeElapsed) / (BASIS_POINTS * SECONDS_PER_YEAR);
            
            data.accruedInterest += interest;
            data.lastUpdateTime = block.timestamp;
            
            emit InterestUpdated(borrower, collection, tokenId, interest);
        }
    }
    
    function calculateInterestRate(address collection) public view returns (uint256) {
        InterestRateModel memory model = interestRateModels[collection];
        if (model.baseRate == 0) return 500; // Default 5%
        
        uint256 utilization = collectionUtilization[collection];
        
        if (utilization <= model.optimalUtilization) {
            return model.baseRate + (utilization * model.slope1) / BASIS_POINTS;
        } else {
            uint256 excessUtilization = utilization - model.optimalUtilization;
            return model.baseRate + model.slope1 + (excessUtilization * model.slope2) / BASIS_POINTS;
        }
    }
    
    function setInterestRateModel(
        address collection,
        uint256 baseRate,
        uint256 slope1,
        uint256 slope2,
        uint256 optimalUtilization
    ) external onlyOwner {
        interestRateModels[collection] = InterestRateModel({
            baseRate: baseRate,
            slope1: slope1,
            slope2: slope2,
            optimalUtilization: optimalUtilization
        });
    }
    
    function setCollectionUtilization(address collection, uint256 utilization) external onlyOwner {
        collectionUtilization[collection] = utilization;
    }
    
    receive() external payable {}
}
