// Sources flattened with hardhat v2.24.2 https://hardhat.org

// SPDX-License-Identifier: MIT

// File @openzeppelin/contracts/utils/Context.sol@v5.3.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}


// File @openzeppelin/contracts/access/Ownable.sol@v5.3.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}


// File @openzeppelin/contracts/token/ERC20/IERC20.sol@v5.3.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (token/ERC20/IERC20.sol)

pragma solidity ^0.8.20;

/**
 * @dev Interface of the ERC-20 standard as defined in the ERC.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}


// File @openzeppelin/contracts/utils/ReentrancyGuard.sol@v5.3.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/ReentrancyGuard.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If EIP-1153 (transient storage) is available on the chain you're deploying at,
 * consider using {ReentrancyGuardTransient} instead.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    uint256 private _status;

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be NOT_ENTERED
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }

        // Any calls to nonReentrant after this point will fail
        _status = ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
    }
}


// File contracts/LoanManagerV3.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.21;



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

        // Mint DPO tokens
        dpoToken.mintOnLoan(collection, tokenId, msg.sender, amount);

        // Transfer ETH to borrower
        payable(msg.sender).transfer(amount);

        emit LoanCreated(msg.sender, collection, tokenId, amount);
    }

    function repay(address collection, uint256 tokenId) external payable nonReentrant {
        require(loanData[msg.sender][collection][tokenId].isActive, "No active loan");

        updateLoanInterest(msg.sender, collection, tokenId);

        LoanData storage loan = loanData[msg.sender][collection][tokenId];
        uint256 totalOwed = loan.principal + loan.accruedInterest;

        // The single, most important check: Did the user send enough value?
        require(msg.value >= totalOwed, "Insufficient payment to cover full debt");

        // Close loan
        loan.isActive = false;
        loan.principal = 0;
        loan.accruedInterest = 0; // Also clear the accrued interest

        // Refund excess payment
        if (msg.value > totalOwed) {
            payable(msg.sender).transfer(msg.value - totalOwed);
        }

        emit LoanRepaid(msg.sender, collection, tokenId, totalOwed);
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

    // Receive ETH for liquidity
    receive() external payable {}
}
