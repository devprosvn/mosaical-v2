
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract LoanManagerV3 is Ownable, ReentrancyGuard {
    struct Loan {
        uint256 principal;
        uint256 interestRate;
        uint256 startTime;
        bool isActive;
    }

    struct InterestRateModel {
        uint256 baseRate;
        uint256 slope1;
        uint256 slope2;
        uint256 optimalUtilization;
    }

    mapping(address => mapping(address => mapping(uint256 => Loan))) public loanData;
    mapping(address => mapping(address => mapping(uint256 => uint256))) public loanHealthFactors;
    mapping(address => InterestRateModel) public interestRateModels;
    mapping(address => uint256) public collectionUtilizations;

    event LoanCreated(address indexed borrower, address indexed collection, uint256 indexed tokenId, uint256 amount);
    event LoanRepaid(address indexed borrower, address indexed collection, uint256 indexed tokenId, uint256 amount);

    constructor() Ownable(msg.sender) {}

    function borrow(address collection, uint256 tokenId, uint256 amount) external payable nonReentrant {
        require(amount > 0, "Invalid amount");
        
        // Simple validation - in real implementation would check NFT ownership via vault
        Loan storage loan = loanData[msg.sender][collection][tokenId];
        require(!loan.isActive, "Loan already exists");
        
        // Mock LTV check - in real implementation would check against oracle
        require(amount <= 10 ether, "Exceeds max LTV");
        
        loan.principal = amount;
        loan.interestRate = 500; // 5%
        loan.startTime = block.timestamp;
        loan.isActive = true;
        
        loanHealthFactors[msg.sender][collection][tokenId] = 15000; // 1.5 health factor
        
        // Transfer ETH to borrower
        require(address(this).balance >= amount, "Insufficient funds");
        payable(msg.sender).transfer(amount);
        
        emit LoanCreated(msg.sender, collection, tokenId, amount);
    }

    function repay(address collection, uint256 tokenId) external payable nonReentrant {
        Loan storage loan = loanData[msg.sender][collection][tokenId];
        require(loan.isActive, "No active loan");
        
        uint256 interestOwed = getAccruedInterest(msg.sender, collection, tokenId);
        uint256 totalOwed = loan.principal + interestOwed;
        
        require(msg.value >= totalOwed, "Insufficient payment");
        
        loan.isActive = false;
        loanHealthFactors[msg.sender][collection][tokenId] = 0;
        
        // Return excess payment
        if (msg.value > totalOwed) {
            payable(msg.sender).transfer(msg.value - totalOwed);
        }
        
        emit LoanRepaid(msg.sender, collection, tokenId, msg.value);
    }

    function getAccruedInterest(address borrower, address collection, uint256 tokenId) public view returns (uint256) {
        Loan memory loan = loanData[borrower][collection][tokenId];
        if (!loan.isActive) return 0;
        
        uint256 timeElapsed = block.timestamp - loan.startTime;
        uint256 yearlyInterest = (loan.principal * loan.interestRate) / 10000;
        return (yearlyInterest * timeElapsed) / 365 days;
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
        collectionUtilizations[collection] = utilization;
    }

    function calculateInterestRate(address collection) external view returns (uint256) {
        InterestRateModel memory model = interestRateModels[collection];
        uint256 utilization = collectionUtilizations[collection];
        
        if (utilization <= model.optimalUtilization) {
            return model.baseRate + (utilization * model.slope1) / 10000;
        } else {
            uint256 excessUtilization = utilization - model.optimalUtilization;
            return model.baseRate + model.slope1 + (excessUtilization * model.slope2) / 10000;
        }
    }

    receive() external payable {}
}
