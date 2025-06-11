// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract LoanManagerV3 is Ownable, ReentrancyGuard {

    address public nftVault;
    address public dpoToken;
    uint256 public nextLoanId;

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

    mapping(uint256 => Loan) public loans;
    mapping(address => mapping(address => mapping(uint256 => uint256))) public nftToLoan;

    event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 amount);
    event LoanRepaid(uint256 indexed loanId, address indexed borrower);

    constructor(address _nftVault, address _dpoToken) Ownable(msg.sender) {
        nftVault = _nftVault;
        dpoToken = _dpoToken;
        nextLoanId = 1;
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

        emit LoanCreated(loanId, msg.sender, amount);
        return loanId;
    }

    function repayLoan(uint256 loanId) external payable {
        Loan storage loan = loans[loanId];
        require(loan.isActive, "Loan not active");
        require(loan.borrower == msg.sender, "Not borrower");
        require(msg.value >= loan.amount, "Insufficient payment");

        loan.isActive = false;
        loan.isRepaid = true;

        emit LoanRepaid(loanId, msg.sender);
    }

    function calculateDynamicInterestRate(address collection, uint256 tokenId) external pure returns (uint256) {
        // Simplified calculation
        return 500; // 5%
    }
}