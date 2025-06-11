// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface INFTVault {
    struct NFTDeposit {
        address owner;
        uint256 depositTime;
        bool isActive;
    }
    function deposits(address collection, uint256 tokenId) external view returns (NFTDeposit memory);
    function getMaxLTV(address collection, uint256 tokenId) external view returns (uint256);
    function oracle() external view returns (IGameFiOracle);
}

interface IGameFiOracle {
    function getFloorPrice(address collection) external view returns (uint256);
}

interface IDPOToken {
    function mintOnLoan(address collection, uint256 tokenId, address borrower, uint256 amount) external;
}

contract LoanManagerV3 is Ownable, ReentrancyGuard {

    INFTVault public nftVault;
    IDPOToken public dpoToken;
    uint256 public nextLoanId;

    struct LoanData {
        uint256 principal;
        uint256 accruedInterest;
        uint256 startTime;
        uint256 lastUpdateTime;
        uint256 interestRate;
        bool isActive;
    }

    struct Loan {
        uint256 id;
        address borrower;
        address collection;
        uint256 tokenId;
        uint256 amount;
        uint256 interestRate;
        uint256 startTime;
        uint256 duration;
        bool isActive;
        bool isRepaid;
    }

    // Interest rate models
    struct InterestRateModel {
        uint256 baseRate;
        uint256 slope1;
        uint256 slope2;
        uint256 optimalUtilization;
    }

    mapping(address => InterestRateModel) public interestRateModels;
    mapping(address => uint256) public collectionUtilization;
    mapping(address => mapping(address => mapping(uint256 => LoanData))) public loanData;
    mapping(address => mapping(address => mapping(uint256 => uint256))) public loanHealthFactors;
    mapping(uint256 => Loan) public loans;
    mapping(address => mapping(address => mapping(uint256 => uint256))) public nftToLoan;

    // Events
    event LoanCreated(address indexed borrower, address indexed collection, uint256 indexed tokenId, uint256 amount);
    event LoanRepaid(address indexed borrower, address indexed collection, uint256 indexed tokenId, uint256 amount);
    event InterestUpdated(address indexed borrower, address indexed collection, uint256 indexed tokenId, uint256 interest);

    constructor(address _nftVault, address _dpoToken) Ownable(msg.sender) {
        nftVault = INFTVault(_nftVault);
        dpoToken = IDPOToken(_dpoToken);
    }

    function createLoan(
        address collection,
        uint256 tokenId,
        uint256 amount,
        uint256 duration
    ) external returns (uint256) {
        require(amount > 0, "Invalid loan amount");
        require(duration > 0, "Invalid duration");

        uint256 loanId = nextLoanId++;

        loans[loanId] = Loan({
            id: loanId,
            borrower: msg.sender,
            collection: collection,
            tokenId: tokenId,
            amount: amount,
            interestRate: 500, // 5%
            startTime: block.timestamp,
            duration: duration,
            isActive: true,
            isRepaid: false
        });

        nftToLoan[msg.sender][collection][tokenId] = loanId;

        emit LoanCreated(msg.sender, collection, tokenId, amount);
        return loanId;
    }

    function repayLoan(uint256 loanId) external payable {
        Loan storage loan = loans[loanId];
        require(loan.isActive, "Loan not active");
        require(loan.borrower == msg.sender, "Not borrower");
        require(msg.value >= loan.amount, "Insufficient payment");

        loan.isActive = false;
        loan.isRepaid = true;

        emit LoanRepaid(loan.borrower, loan.collection, loan.tokenId, loan.amount);
    }

    function calculateDynamicInterestRate(address /* collection */, uint256 /* tokenId */) external pure returns (uint256) {
        // Simplified calculation
        return 500; // 5% fixed rate for now
    }

    function borrow(address collection, uint256 tokenId, uint256 amount) external nonReentrant {
        require(nftVault.deposits(collection, tokenId).owner == msg.sender, "Not your NFT");
        require(!loanData[msg.sender][collection][tokenId].isActive, "Active loan exists");

        uint256 floorPrice = nftVault.oracle().getFloorPrice(collection);
        uint256 maxLTVPercent = nftVault.getMaxLTV(collection, tokenId);
        uint256 maxBorrow = floorPrice * maxLTVPercent / 100;
        require(amount <= maxBorrow, "Exceeds max LTV");
        require(address(this).balance >= amount, "Insufficient liquidity");

        loanData[msg.sender][collection][tokenId] = LoanData({
            principal: amount,
            accruedInterest: 0,
            startTime: block.timestamp,
            lastUpdateTime: block.timestamp,
            interestRate: calculateInterestRate(collection),
            isActive: true
        });

        loanHealthFactors[msg.sender][collection][tokenId] = 15000; // 1.5x health factor
        loans[msg.sender][collection][tokenId] = amount;

        // Mint DPO tokens
        dpoToken.mintOnLoan(collection, tokenId, msg.sender, amount);

        // Transfer ETH to borrower
        payable(msg.sender).transfer(amount);

        emit LoanCreated(msg.sender, collection, tokenId, amount);
    }

    function repay(address collection, uint256 tokenId, uint256 amount) external payable nonReentrant {
        require(loanData[msg.sender][collection][tokenId].isActive, "No active loan");

        updateLoanInterest(msg.sender, collection, tokenId);

        LoanData storage loan = loanData[msg.sender][collection][tokenId];
        uint256 totalOwed = loan.principal + loan.accruedInterest;

        require(msg.value >= amount, "Insufficient payment");
        require(amount >= totalOwed, "Must repay full amount");

        // Close loan
        loan.isActive = false;
        loans[msg.sender][collection][tokenId] = 0;
        loanData[msg.sender][collection][tokenId] = LoanData({principal:0, accruedInterest:0, startTime:0, lastUpdateTime:0, interestRate: 0, isActive: false});

        // Refund excess
        if (msg.value > amount) {
            payable(msg.sender).transfer(msg.value - amount);
        }

        emit LoanRepaid(msg.sender, collection, tokenId, amount);
    }

    function updateLoanInterest(address borrower, address collection, uint256 tokenId) public {
        LoanData storage loan = loanData[borrower][collection][tokenId];
        if (!loan.isActive) return;

        uint256 timeElapsed = block.timestamp - loan.lastUpdateTime;
        uint256 interest = loan.principal * loan.interestRate * timeElapsed / (10000 * 365 days);

        loan.accruedInterest += interest;
        loan.lastUpdateTime = block.timestamp;

        emit InterestUpdated(borrower, collection, tokenId, interest);
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

    function calculateInterestRate(address collection) public view returns (uint256) {
        InterestRateModel memory model = interestRateModels[collection];
        if (model.baseRate == 0) return 500; // Default 5%

        uint256 utilization = collectionUtilization[collection];

        if (utilization <= model.optimalUtilization) {
            return model.baseRate + (utilization * model.slope1) / 10000;
        } else {
            uint256 excessUtilization = utilization - model.optimalUtilization;
            return model.baseRate + model.slope1 + (excessUtilization * model.slope2) / 10000;
        }
    }

    function getAccruedInterest(address borrower, address collection, uint256 tokenId) external view returns (uint256) {
        LoanData memory loan = loanData[borrower][collection][tokenId];
        if (!loan.isActive) return 0;

        uint256 timeElapsed = block.timestamp - loan.lastUpdateTime;
        uint256 interest = loan.principal * loan.interestRate * timeElapsed / (10000 * 365 days);
        return loan.accruedInterest + interest;
    }

    // Mapping to store loans by address, collection, tokenId for easier access
    mapping(address => mapping(address => mapping(uint256 => uint256))) public loans;

    // Receive ETH for liquidity
    receive() external payable {}
}