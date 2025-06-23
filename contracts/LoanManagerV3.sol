// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "./NFTVaultV3.sol";
import "./DPOTokenV3.sol";

contract LoanManagerV3 is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    struct Loan {
        uint256 principal;
        uint256 interestRate;
        uint256 startTime;
        uint256 lastUpdateTime;
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
    mapping(address => uint256) public collectionUtilization;

    NFTVaultV3 public nftVault;
    DPOTokenV3 public dpoToken;

    event LoanCreated(address indexed borrower, address indexed collection, uint256 indexed tokenId, uint256 amount);
    event LoanRepaid(address indexed borrower, address indexed collection, uint256 indexed tokenId, uint256 amount);
    event InterestAccrued(address indexed borrower, address indexed collection, uint256 indexed tokenId, uint256 interest);

    constructor() Ownable(msg.sender) {
        // Initialize with default parameters
    }

    function setNFTVault(address _nftVault) external onlyOwner {
        nftVault = NFTVaultV3(_nftVault);
    }

    function setDPOToken(address _dpoToken) external onlyOwner {
        dpoToken = DPOTokenV3(_dpoToken);
    }

    function borrow(address collection, uint256 tokenId, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(address(nftVault) != address(0), "NFT Vault not set");

        // Check if NFT is deposited and owned by borrower
        (address owner, bool isActive) = nftVault.getDepositInfo(collection, tokenId);
        require(owner == msg.sender, "Not your NFT");
        require(isActive, "NFT not deposited");

        require(address(this).balance >= amount, "Insufficient funds");

        // Check LTV
        uint256 maxLTV = nftVault.getMaxLTV(collection, tokenId);
        uint256 nftValue = 10 ether; // Mock value for testing
        uint256 maxBorrowAmount = (nftValue * maxLTV) / 10000;
        require(amount <= maxBorrowAmount, "Exceeds max LTV");

        // Create loan
        uint256 interestRate = calculateInterestRate(collection);
        loanData[msg.sender][collection][tokenId] = Loan({
            principal: amount,
            interestRate: interestRate,
            startTime: block.timestamp,
            lastUpdateTime: block.timestamp,
            isActive: true
        });

        // Calculate health factor
        uint256 healthFactor = (nftValue * 10000) / amount; // Scaled by 10000
        loanHealthFactors[msg.sender][collection][tokenId] = healthFactor;

        // Mint DPO tokens if DPO contract is set
        if (address(dpoToken) != address(0)) {
            dpoToken.mintTokens(collection, tokenId, msg.sender, amount);
        }

        // Transfer ETH to borrower
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
        collectionUtilization[collection] = utilization;
    }

    function calculateInterestRate(address collection) external view returns (uint256) {
        InterestRateModel memory model = interestRateModels[collection];
        uint256 utilization = collectionUtilization[collection];

        if (utilization <= model.optimalUtilization) {
            return model.baseRate + (utilization * model.slope1) / 10000;
        } else {
            uint256 excessUtilization = utilization - model.optimalUtilization;
            return model.baseRate + model.slope1 + (excessUtilization * model.slope2) / 10000;
        }
    }

    receive() external payable {}
}