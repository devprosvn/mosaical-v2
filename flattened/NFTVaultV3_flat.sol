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


// File @openzeppelin/contracts/utils/introspection/IERC165.sol@v5.3.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/introspection/IERC165.sol)

pragma solidity ^0.8.20;

/**
 * @dev Interface of the ERC-165 standard, as defined in the
 * https://eips.ethereum.org/EIPS/eip-165[ERC].
 *
 * Implementers can declare support of contract interfaces, which can then be
 * queried by others ({ERC165Checker}).
 *
 * For an implementation, see {ERC165}.
 */
interface IERC165 {
    /**
     * @dev Returns true if this contract implements the interface defined by
     * `interfaceId`. See the corresponding
     * https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[ERC section]
     * to learn more about how these ids are created.
     *
     * This function call must use less than 30 000 gas.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}


// File @openzeppelin/contracts/token/ERC721/IERC721.sol@v5.3.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (token/ERC721/IERC721.sol)

pragma solidity ^0.8.20;

/**
 * @dev Required interface of an ERC-721 compliant contract.
 */
interface IERC721 is IERC165 {
    /**
     * @dev Emitted when `tokenId` token is transferred from `from` to `to`.
     */
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    /**
     * @dev Emitted when `owner` enables `approved` to manage the `tokenId` token.
     */
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);

    /**
     * @dev Emitted when `owner` enables or disables (`approved`) `operator` to manage all of its assets.
     */
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    /**
     * @dev Returns the number of tokens in ``owner``'s account.
     */
    function balanceOf(address owner) external view returns (uint256 balance);

    /**
     * @dev Returns the owner of the `tokenId` token.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function ownerOf(uint256 tokenId) external view returns (address owner);

    /**
     * @dev Safely transfers `tokenId` token from `from` to `to`.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `tokenId` token must exist and be owned by `from`.
     * - If the caller is not `from`, it must be approved to move this token by either {approve} or {setApprovalForAll}.
     * - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon
     *   a safe transfer.
     *
     * Emits a {Transfer} event.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;

    /**
     * @dev Safely transfers `tokenId` token from `from` to `to`, checking first that contract recipients
     * are aware of the ERC-721 protocol to prevent tokens from being forever locked.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `tokenId` token must exist and be owned by `from`.
     * - If the caller is not `from`, it must have been allowed to move this token by either {approve} or
     *   {setApprovalForAll}.
     * - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon
     *   a safe transfer.
     *
     * Emits a {Transfer} event.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId) external;

    /**
     * @dev Transfers `tokenId` token from `from` to `to`.
     *
     * WARNING: Note that the caller is responsible to confirm that the recipient is capable of receiving ERC-721
     * or else they may be permanently lost. Usage of {safeTransferFrom} prevents loss, though the caller must
     * understand this adds an external call which potentially creates a reentrancy vulnerability.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `tokenId` token must be owned by `from`.
     * - If the caller is not `from`, it must be approved to move this token by either {approve} or {setApprovalForAll}.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 tokenId) external;

    /**
     * @dev Gives permission to `to` to transfer `tokenId` token to another account.
     * The approval is cleared when the token is transferred.
     *
     * Only a single account can be approved at a time, so approving the zero address clears previous approvals.
     *
     * Requirements:
     *
     * - The caller must own the token or be an approved operator.
     * - `tokenId` must exist.
     *
     * Emits an {Approval} event.
     */
    function approve(address to, uint256 tokenId) external;

    /**
     * @dev Approve or remove `operator` as an operator for the caller.
     * Operators can call {transferFrom} or {safeTransferFrom} for any token owned by the caller.
     *
     * Requirements:
     *
     * - The `operator` cannot be the address zero.
     *
     * Emits an {ApprovalForAll} event.
     */
    function setApprovalForAll(address operator, bool approved) external;

    /**
     * @dev Returns the account approved for `tokenId` token.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function getApproved(uint256 tokenId) external view returns (address operator);

    /**
     * @dev Returns if the `operator` is allowed to manage all of the assets of `owner`.
     *
     * See {setApprovalForAll}
     */
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}


// File @openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol@v5.3.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (token/ERC721/extensions/IERC721Metadata.sol)

pragma solidity ^0.8.20;

/**
 * @title ERC-721 Non-Fungible Token Standard, optional metadata extension
 * @dev See https://eips.ethereum.org/EIPS/eip-721
 */
interface IERC721Metadata is IERC721 {
    /**
     * @dev Returns the token collection name.
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the token collection symbol.
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Returns the Uniform Resource Identifier (URI) for `tokenId` token.
     */
    function tokenURI(uint256 tokenId) external view returns (string memory);
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


// File contracts/NFTVaultV3.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.21;




interface IGameFiOracle {
    function getFloorPrice(address collection) external view returns (uint256);
    function getUtilityScore(address collection, uint256 tokenId) external view returns (uint256);
    function isActiveAsset(address collection, uint256 tokenId) external view returns (bool);
}

contract NFTVaultV3 is Ownable, ReentrancyGuard {

    IGameFiOracle public oracle;

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
    mapping(address => uint256) public userETHBalances;
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
        require(amount <= maxBorrow, "Amount exceeds max borrow");
        require(address(this).balance >= amount, "Insufficient vault liquidity");

        CollectionConfig memory config = collectionConfigs[collection];
        loans[collection][tokenId] = Loan({
            amount: amount,
            startTime: block.timestamp,
            interestRate: config.baseInterestRate,
            isActive: true
        });

        userETHBalances[msg.sender] = userETHBalances[msg.sender] + amount;

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

    function withdrawETH(uint256 amount) external nonReentrant {
        require(userETHBalances[msg.sender] >= amount, "Insufficient balance");
        userETHBalances[msg.sender] = userETHBalances[msg.sender] - amount;
        payable(msg.sender).transfer(amount);
    }

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
        uint256 utilityScore = oracle.getUtilityScore(collection, tokenId);
        uint256 maxLTV = collectionConfigs[collection].maxLTV;

        // Adjust LTV based on utility score (higher utility = higher LTV)
        uint256 adjustedLTV = maxLTV + (utilityScore * 500 / 100); // Max 5% bonus
        if (adjustedLTV > 8000) adjustedLTV = 8000; // Cap at 80%

        return floorPrice * adjustedLTV / BASIS_POINTS;
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
        if (riskTier == 0) riskTier = 3; // Default to tier 3

        RiskModel memory model = riskModels[riskTier];
        uint256 utilityScore = oracle.getUtilityScore(collection, tokenId);

        // Add utility bonus (max bonus defined in risk model)
        uint256 bonus = (utilityScore * model.maxUtilityBonus) / 100;
        return model.baseLTV + bonus;
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
