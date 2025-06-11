
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

// ============================================================================
// OpenZeppelin Contracts
// ============================================================================

// @openzeppelin/contracts/utils/Context.sol
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}

// @openzeppelin/contracts/access/Ownable.sol
abstract contract Ownable is Context {
    address private _owner;

    error OwnableUnauthorizedAccount(address account);
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

// @openzeppelin/contracts/utils/ReentrancyGuard.sol
abstract contract ReentrancyGuard {
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    uint256 private _status;

    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    modifier nonReentrant() {
        _checkReentrancy();

        _status = ENTERED;

        _;

        _status = NOT_ENTERED;
    }

    function _checkReentrancy() private {
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }
    }

    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
    }
}

// @openzeppelin/contracts/utils/math/Math.sol
library Math {
    error MathOverflowedMulDiv();

    enum Rounding {
        Floor, // Toward negative infinity
        Ceil, // Toward positive infinity
        Trunc, // Toward zero
        Expand // Away from zero
    }

    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a : b;
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    function average(uint256 a, uint256 b) internal pure returns (uint256) {
        return (a & b) + (a ^ b) / 2;
    }

    function ceilDiv(uint256 a, uint256 b) internal pure returns (uint256) {
        if (b == 0) {
            return a / b;
        }
        return a == 0 ? 0 : (a - 1) / b + 1;
    }

    function mulDiv(uint256 x, uint256 y, uint256 denominator) internal pure returns (uint256 result) {
        unchecked {
            uint256 prod0 = x * y;
            uint256 prod1;
            assembly {
                let mm := mulmod(x, y, not(0))
                prod1 := sub(sub(mm, prod0), lt(mm, prod0))
            }

            if (prod1 == 0) {
                return prod0 / denominator;
            }

            if (denominator <= prod1) {
                revert MathOverflowedMulDiv();
            }

            uint256 remainder;
            assembly {
                remainder := mulmod(x, y, denominator)
                prod1 := sub(prod1, gt(remainder, prod0))
                prod0 := sub(prod0, remainder)
            }

            uint256 twos = denominator & (0 - denominator);
            assembly {
                denominator := div(denominator, twos)
                prod0 := div(prod0, twos)
                twos := add(div(sub(0, twos), twos), 1)
            }

            prod0 |= prod1 * twos;

            uint256 inverse = (3 * denominator) ^ 2;

            inverse *= 2 - denominator * inverse;
            inverse *= 2 - denominator * inverse;
            inverse *= 2 - denominator * inverse;
            inverse *= 2 - denominator * inverse;
            inverse *= 2 - denominator * inverse;
            inverse *= 2 - denominator * inverse;

            result = prod0 * inverse;
            return result;
        }
    }

    /**
     * @dev Return the floor of log10(value), useful to compute number of digits.
     */
    function log10(uint256 value) internal pure returns (uint256) {
        uint256 result = 0;
        while (value >= 10) {
            value /= 10;
            result++;
        }
        return result;
    }

    /**
     * @dev Return the floor of log256(value), useful for hex-length.
     */
    function log256(uint256 value) internal pure returns (uint256) {
        uint256 result = 0;
        while (value > 0xff) {
            value >>= 8;
            result++;
        }
        return result;
    }
}

// @openzeppelin/contracts/token/ERC20/IERC20.sol
interface IERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

// @openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol
interface IERC20Metadata is IERC20 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
}

// @openzeppelin/contracts/interfaces/draft-IERC6093.sol
interface IERC20Errors {
    error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed);
    error ERC20InvalidSender(address sender);
    error ERC20InvalidReceiver(address receiver);
    error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed);
    error ERC20InvalidApprover(address approver);
    error ERC20InvalidSpender(address spender);
}

// @openzeppelin/contracts/token/ERC20/ERC20.sol
abstract contract ERC20 is Context, IERC20, IERC20Metadata, IERC20Errors {
    mapping(address account => uint256) private _balances;
    mapping(address account => mapping(address spender => uint256)) private _allowances;

    uint256 private _totalSupply;

    string private _name;
    string private _symbol;

    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    function name() public view virtual returns (string memory) {
        return _name;
    }

    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    function decimals() public view virtual returns (uint8) {
        return 18;
    }

    function totalSupply() public view virtual returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view virtual returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 value) public virtual returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, value);
        return true;
    }

    function allowance(address owner, address spender) public view virtual returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 value) public virtual returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public virtual returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, value);
        _transfer(from, to, value);
        return true;
    }

    function _mint(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(address(0), account, value);
    }

    function _burn(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        _update(account, address(0), value);
    }

    function _transfer(address from, address to, uint256 value) internal {
        if (from == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        if (to == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(from, to, value);
    }

    function _update(address from, address to, uint256 value) internal virtual {
        if (from == address(0)) {
            _totalSupply += value;
        } else {
            uint256 fromBalance = _balances[from];
            if (fromBalance < value) {
                revert ERC20InsufficientBalance(from, fromBalance, value);
            }
            unchecked {
                _balances[from] = fromBalance - value;
            }
        }

        if (to == address(0)) {
            unchecked {
                _totalSupply -= value;
            }
        } else {
            unchecked {
                _balances[to] += value;
            }
        }

        emit Transfer(from, to, value);
    }

    function _approve(address owner, address spender, uint256 value) internal {
        _approve(owner, spender, value, true);
    }

    function _approve(address owner, address spender, uint256 value, bool emitEvent) internal virtual {
        if (owner == address(0)) {
            revert ERC20InvalidApprover(address(0));
        }
        if (spender == address(0)) {
            revert ERC20InvalidSpender(address(0));
        }
        _allowances[owner][spender] = value;
        if (emitEvent) {
            emit Approval(owner, spender, value);
        }
    }

    function _spendAllowance(address owner, address spender, uint256 value) internal virtual {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance != type(uint256).max) {
            if (currentAllowance < value) {
                revert ERC20InsufficientAllowance(spender, currentAllowance, value);
            }
            unchecked {
                _approve(owner, spender, currentAllowance - value, false);
            }
        }
    }
}

// @openzeppelin/contracts/utils/introspection/IERC165.sol
interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

// @openzeppelin/contracts/token/ERC721/IERC721.sol
interface IERC721 is IERC165 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function balanceOf(address owner) external view returns (uint256 balance);
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
    function getApproved(uint256 tokenId) external view returns (address operator);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

// @openzeppelin/contracts/token/ERC721/IERC721Receiver.sol
interface IERC721Receiver {
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4);
}

// @openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol
interface IERC721Metadata is IERC721 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}

// @openzeppelin/contracts/utils/Strings.sol
library Strings {
    bytes16 private constant HEX_DIGITS = "0123456789abcdef";
    uint8 private constant ADDRESS_LENGTH = 20;

    error StringsInsufficientHexLength(uint256 value, uint256 length);

    function toString(uint256 value) internal pure returns (string memory) {
        unchecked {
            uint256 length = Math.log10(value) + 1;
            string memory buffer = new string(length);
            uint256 ptr;
            assembly {
                ptr := add(buffer, add(32, length))
            }
            while (true) {
                ptr--;
                assembly {
                    mstore8(ptr, byte(mod(value, 10), HEX_DIGITS))
                }
                value /= 10;
                if (value == 0) break;
            }
            return buffer;
        }
    }

    function toHexString(uint256 value) internal pure returns (string memory) {
        unchecked {
            return toHexString(value, Math.log256(value) + 1);
        }
    }

    function toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
        uint256 localValue = value;
        bytes memory buffer = new bytes(2 * length + 2);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i = 2 * length + 1; i > 1; --i) {
            buffer[i] = HEX_DIGITS[localValue & 0xf];
            localValue >>= 4;
        }
        if (localValue != 0) {
            revert StringsInsufficientHexLength(value, length);
        }
        return string(buffer);
    }

    function toHexString(address addr) internal pure returns (string memory) {
        return toHexString(uint256(uint160(addr)), ADDRESS_LENGTH);
    }

    function equal(string memory a, string memory b) internal pure returns (bool) {
        return bytes(a).length == bytes(b).length && keccak256(bytes(a)) == keccak256(bytes(b));
    }
}

// @openzeppelin/contracts/utils/introspection/ERC165.sol
abstract contract ERC165 is IERC165 {
    function supportsInterface(bytes4 interfaceId) public view virtual returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
    }
}

// @openzeppelin/contracts/interfaces/draft-IERC6093.sol (ERC721Errors)
interface IERC721Errors {
    error ERC721InvalidOwner(address owner);
    error ERC721NonexistentToken(uint256 tokenId);
    error ERC721IncorrectOwner(address sender, uint256 tokenId, address owner);
    error ERC721InvalidSender(address sender);
    error ERC721InvalidReceiver(address receiver);
    error ERC721InsufficientApproval(address operator, uint256 tokenId);
    error ERC721InvalidApprover(address approver);
    error ERC721InvalidOperator(address operator);
}

// @openzeppelin/contracts/token/ERC721/ERC721.sol
abstract contract ERC721 is Context, ERC165, IERC721, IERC721Metadata, IERC721Errors {
    mapping(uint256 tokenId => address) private _owners;
    mapping(address owner => uint256) private _balances;
    mapping(uint256 tokenId => address) private _tokenApprovals;
    mapping(address owner => mapping(address operator => bool)) private _operatorApprovals;

    string private _name;
    string private _symbol;

    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC721Metadata).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function balanceOf(address owner) public view virtual returns (uint256) {
        if (owner == address(0)) {
            revert ERC721InvalidOwner(address(0));
        }
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) public view virtual returns (address) {
        return _requireOwned(tokenId);
    }

    function name() public view virtual returns (string memory) {
        return _name;
    }

    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    function tokenURI(uint256 tokenId) public view virtual returns (string memory) {
        _requireOwned(tokenId);

        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString())) : "";
    }

    function _baseURI() internal view virtual returns (string memory) {
        return "";
    }

    function approve(address to, uint256 tokenId) public virtual {
        _approve(to, tokenId, _msgSender());
    }

    function getApproved(uint256 tokenId) public view virtual returns (address) {
        _requireOwned(tokenId);

        return _getApproved(tokenId);
    }

    function setApprovalForAll(address operator, bool approved) public virtual {
        _setApprovalForAll(_msgSender(), operator, approved);
    }

    function isApprovedForAll(address owner, address operator) public view virtual returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public virtual {
        if (to == address(0)) {
            revert ERC721InvalidReceiver(address(0));
        }
        address previousOwner = _update(to, tokenId, _msgSender());
        if (previousOwner != from) {
            revert ERC721IncorrectOwner(from, tokenId, previousOwner);
        }
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public virtual {
        transferFrom(from, to, tokenId);
        _checkOnERC721Received(from, to, tokenId, data);
    }

    function _ownerOf(uint256 tokenId) internal view virtual returns (address) {
        return _owners[tokenId];
    }

    function _getApproved(uint256 tokenId) internal view virtual returns (address) {
        return _tokenApprovals[tokenId];
    }

    function _isAuthorized(address owner, address spender, uint256 tokenId) internal view virtual returns (bool) {
        return
            spender != address(0) &&
            (owner == spender || isApprovedForAll(owner, spender) || _getApproved(tokenId) == spender);
    }

    function _checkAuthorized(address owner, address spender, uint256 tokenId) internal view virtual {
        if (!_isAuthorized(owner, spender, tokenId)) {
            if (owner == address(0)) {
                revert ERC721NonexistentToken(tokenId);
            } else {
                revert ERC721InsufficientApproval(spender, tokenId);
            }
        }
    }

    function _increaseBalance(address account, uint128 value) internal virtual {
        unchecked {
            _balances[account] += value;
        }
    }

    function _update(address to, uint256 tokenId, address auth) internal virtual returns (address) {
        address from = _ownerOf(tokenId);

        if (auth != address(0)) {
            _checkAuthorized(from, auth, tokenId);
        }

        if (from != address(0)) {
            _approve(address(0), tokenId, address(0), false);

            unchecked {
                _balances[from] -= 1;
            }
        }

        if (to != address(0)) {
            unchecked {
                _balances[to] += 1;
            }
        }

        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);

        return from;
    }

    function _mint(address to, uint256 tokenId) internal {
        if (to == address(0)) {
            revert ERC721InvalidReceiver(address(0));
        }
        address previousOwner = _update(to, tokenId, address(0));
        if (previousOwner != address(0)) {
            revert ERC721InvalidSender(address(0));
        }
    }

    function _safeMint(address to, uint256 tokenId) internal {
        _safeMint(to, tokenId, "");
    }

    function _safeMint(address to, uint256 tokenId, bytes memory data) internal virtual {
        _mint(to, tokenId);
        _checkOnERC721Received(address(0), to, tokenId, data);
    }

    function _burn(uint256 tokenId) internal {
        address previousOwner = _update(address(0), tokenId, address(0));
        if (previousOwner == address(0)) {
            revert ERC721NonexistentToken(tokenId);
        }
    }

    function _approve(address to, uint256 tokenId, address auth) internal {
        _approve(to, tokenId, auth, true);
    }

    function _approve(address to, uint256 tokenId, address auth, bool emitEvent) internal virtual {
        if (emitEvent || auth != address(0)) {
            address owner = _requireOwned(tokenId);

            if (auth != address(0) && owner != auth && !isApprovedForAll(owner, auth)) {
                revert ERC721InvalidApprover(auth);
            }

            if (emitEvent) {
                emit Approval(owner, to, tokenId);
            }
        }

        _tokenApprovals[tokenId] = to;
    }

    function _setApprovalForAll(address owner, address operator, bool approved) internal virtual {
        if (operator == address(0)) {
            revert ERC721InvalidOperator(operator);
        }
        _operatorApprovals[owner][operator] = approved;
        emit ApprovalForAll(owner, operator, approved);
    }

    function _requireOwned(uint256 tokenId) internal view returns (address) {
        address owner = _ownerOf(tokenId);
        if (owner == address(0)) {
            revert ERC721NonexistentToken(tokenId);
        }
        return owner;
    }

    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory data) private {
        if (to.code.length > 0) {
            try IERC721Receiver(to).onERC721Received(_msgSender(), from, tokenId, data) returns (bytes4 retval) {
                if (retval != IERC721Receiver.onERC721Received.selector) {
                    revert ERC721InvalidReceiver(to);
                }
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert ERC721InvalidReceiver(to);
                } else {
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        }
    }
}

// ============================================================================
// MOSAICAL CONTRACTS
// ============================================================================

// GovernanceToken.sol
contract GovernanceToken is ERC20, Ownable {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) Ownable(msg.sender) {}
    
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}

// MockGameNFT.sol
contract MockGameNFT is ERC721, Ownable {
    using Strings for uint256;

    string private constant ASSET_PLATFORM = "ethereum";
    string private constant BASE_URI = "https://api.coingecko.com/api/v3/nfts/";

    constructor(string memory name, string memory symbol)
        ERC721(name, symbol)
        Ownable(msg.sender)
    {}

    function mint(address to, uint256 tokenId) external onlyOwner {
        _mint(to, tokenId);
    }

    function exists(uint256 tokenId) external view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");

        return string(
            abi.encodePacked(
                BASE_URI,
                ASSET_PLATFORM,
                "/contract/",
                Strings.toHexString(uint160(address(this)), 20),
                "?token_ids%5B%5D=",
                Strings.toString(tokenId)
            )
        );
    }
}

// GameFiOracleV3.sol
contract GameFiOracleV3 is Ownable, ReentrancyGuard {
    using Math for uint256;
    
    struct PriceData {
        uint256 floorPrice;
        uint256 lastUpdate;
        bool isActive;
    }
    
    struct UtilityData {
        uint256 score;
        uint256 lastUpdate;
        bool isActive;
    }
    
    struct CollectionMetrics {
        uint256 volume24h;
        uint256 holders;
        uint256 listingCount;
        uint256 avgHoldTime;
        bool isGameFi;
    }
    
    mapping(address => PriceData) public priceData;
    mapping(address => mapping(uint256 => UtilityData)) public utilityData;
    mapping(address => CollectionMetrics) public collectionMetrics;
    mapping(address => bool) public authorizedUpdaters;
    
    uint256 public constant PRICE_STALENESS_THRESHOLD = 1 hours;
    uint256 public constant UTILITY_STALENESS_THRESHOLD = 6 hours;
    uint256 public constant MIN_UTILITY_SCORE = 1;
    uint256 public constant MAX_UTILITY_SCORE = 100;
    
    event PriceUpdated(address indexed collection, uint256 newPrice, uint256 timestamp);
    event UtilityUpdated(address indexed collection, uint256 indexed tokenId, uint256 score);
    event CollectionMetricsUpdated(address indexed collection, uint256 volume, uint256 holders);
    event UpdaterAuthorized(address indexed updater, bool authorized);
    
    modifier onlyAuthorized() {
        require(authorizedUpdaters[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    constructor() Ownable(msg.sender) {
        authorizedUpdaters[msg.sender] = true;
    }
    
    function authorizeUpdater(address updater, bool authorized) external onlyOwner {
        authorizedUpdaters[updater] = authorized;
        emit UpdaterAuthorized(updater, authorized);
    }
    
    function updateFloorPrice(address collection, uint256 price) external onlyAuthorized {
        require(price > 0, "Invalid price");
        
        priceData[collection] = PriceData({
            floorPrice: price,
            lastUpdate: block.timestamp,
            isActive: true
        });
        
        emit PriceUpdated(collection, price, block.timestamp);
    }
    
    function batchUpdatePrices(
        address[] calldata collections,
        uint256[] calldata prices
    ) external onlyAuthorized {
        require(collections.length == prices.length, "Array length mismatch");
        
        for (uint256 i = 0; i < collections.length; i++) {
            if (prices[i] > 0) {
                priceData[collections[i]] = PriceData({
                    floorPrice: prices[i],
                    lastUpdate: block.timestamp,
                    isActive: true
                });
                
                emit PriceUpdated(collections[i], prices[i], block.timestamp);
            }
        }
    }
    
    function updateUtilityScore(
        address collection,
        uint256 tokenId,
        uint256 score
    ) external onlyAuthorized {
        require(score >= MIN_UTILITY_SCORE && score <= MAX_UTILITY_SCORE, "Invalid score");
        
        utilityData[collection][tokenId] = UtilityData({
            score: score,
            lastUpdate: block.timestamp,
            isActive: true
        });
        
        emit UtilityUpdated(collection, tokenId, score);
    }
    
    function batchUpdateUtilityScores(
        address[] calldata collections,
        uint256[] calldata tokenIds,
        uint256[] calldata scores
    ) external onlyAuthorized {
        require(
            collections.length == tokenIds.length && 
            collections.length == scores.length,
            "Array length mismatch"
        );
        
        for (uint256 i = 0; i < collections.length; i++) {
            if (scores[i] >= MIN_UTILITY_SCORE && scores[i] <= MAX_UTILITY_SCORE) {
                utilityData[collections[i]][tokenIds[i]] = UtilityData({
                    score: scores[i],
                    lastUpdate: block.timestamp,
                    isActive: true
                });
                
                emit UtilityUpdated(collections[i], tokenIds[i], scores[i]);
            }
        }
    }
    
    function updateCollectionMetrics(
        address collection,
        uint256 volume24h,
        uint256 holders,
        uint256 listingCount,
        uint256 avgHoldTime,
        bool isGameFi
    ) external onlyAuthorized {
        collectionMetrics[collection] = CollectionMetrics({
            volume24h: volume24h,
            holders: holders,
            listingCount: listingCount,
            avgHoldTime: avgHoldTime,
            isGameFi: isGameFi
        });
        
        emit CollectionMetricsUpdated(collection, volume24h, holders);
    }
    
    function getFloorPrice(address collection) external view returns (uint256) {
        PriceData memory data = priceData[collection];
        
        if (!data.isActive) return 0;
        if (block.timestamp - data.lastUpdate > PRICE_STALENESS_THRESHOLD) return 0;
        
        return data.floorPrice;
    }
    
    function getUtilityScore(address collection, uint256 tokenId) external view returns (uint256) {
        UtilityData memory data = utilityData[collection][tokenId];
        
        if (!data.isActive) {
            CollectionMetrics memory metrics = collectionMetrics[collection];
            if (metrics.isGameFi) {
                return _calculateDefaultUtilityScore(collection);
            }
            return MIN_UTILITY_SCORE;
        }
        
        if (block.timestamp - data.lastUpdate > UTILITY_STALENESS_THRESHOLD) {
            return MIN_UTILITY_SCORE;
        }
        
        return data.score;
    }
    
    function isActiveAsset(address collection, uint256 tokenId) external view returns (bool) {
        PriceData memory price = priceData[collection];
        if (!price.isActive || block.timestamp - price.lastUpdate > PRICE_STALENESS_THRESHOLD) {
            return false;
        }
        
        CollectionMetrics memory metrics = collectionMetrics[collection];
        if (!metrics.isGameFi) return false;
        
        return true;
    }
    
    function getPriceInfo(address collection) external view returns (
        uint256 floorPrice,
        uint256 lastUpdate,
        bool isActive,
        bool isStale
    ) {
        PriceData memory data = priceData[collection];
        floorPrice = data.floorPrice;
        lastUpdate = data.lastUpdate;
        isActive = data.isActive;
        isStale = block.timestamp - data.lastUpdate > PRICE_STALENESS_THRESHOLD;
    }
    
    function getUtilityInfo(address collection, uint256 tokenId) external view returns (
        uint256 score,
        uint256 lastUpdate,
        bool isActive,
        bool isStale
    ) {
        UtilityData memory data = utilityData[collection][tokenId];
        score = data.isActive ? data.score : _calculateDefaultUtilityScore(collection);
        lastUpdate = data.lastUpdate;
        isActive = data.isActive;
        isStale = data.isActive && block.timestamp - data.lastUpdate > UTILITY_STALENESS_THRESHOLD;
    }
    
    function getCollectionHealth(address collection) external view returns (
        uint256 healthScore,
        bool isLiquid,
        bool hasRecentActivity
    ) {
        CollectionMetrics memory metrics = collectionMetrics[collection];
        PriceData memory price = priceData[collection];
        
        if (!metrics.isGameFi || !price.isActive) {
            return (0, false, false);
        }
        
        uint256 volumeScore = metrics.volume24h > 1 ether ? 25 : (metrics.volume24h * 25 / 1 ether);
        uint256 holderScore = metrics.holders > 1000 ? 25 : (metrics.holders * 25 / 1000);
        uint256 liquidityScore = metrics.listingCount > 100 ? 25 : (metrics.listingCount * 25 / 100);
        uint256 holdScore = metrics.avgHoldTime > 30 days ? 25 : (metrics.avgHoldTime * 25 / 30 days);
        
        healthScore = volumeScore + holderScore + liquidityScore + holdScore;
        if (healthScore > 100) healthScore = 100;
        
        isLiquid = metrics.listingCount > 10 && metrics.volume24h > 0.1 ether;
        hasRecentActivity = block.timestamp - price.lastUpdate < 1 hours;
    }
    
    function _calculateDefaultUtilityScore(address collection) internal view returns (uint256) {
        CollectionMetrics memory metrics = collectionMetrics[collection];
        
        if (!metrics.isGameFi) return MIN_UTILITY_SCORE;
        
        uint256 baseScore = 30;
        
        if (metrics.holders > 5000) baseScore = baseScore + 20;
        else if (metrics.holders > 1000) baseScore = baseScore + 10;
        
        if (metrics.volume24h > 10 ether) baseScore = baseScore + 15;
        else if (metrics.volume24h > 1 ether) baseScore = baseScore + 5;
        
        if (metrics.listingCount > 100) baseScore = baseScore + 10;
        
        return baseScore > MAX_UTILITY_SCORE ? MAX_UTILITY_SCORE : baseScore;
    }
    
    function emergencyPause(address collection, bool paused) external onlyOwner {
        priceData[collection].isActive = !paused;
    }
    
    function emergencyUpdatePrice(address collection, uint256 price) external onlyOwner {
        priceData[collection] = PriceData({
            floorPrice: price,
            lastUpdate: block.timestamp,
            isActive: true
        });
        
        emit PriceUpdated(collection, price, block.timestamp);
    }
}

// DPOTokenV3.sol
contract DPOTokenV3 is ERC20, Ownable {

    mapping(address => bool) public authorizedMinters;

    mapping(address => mapping(uint256 => mapping(address => uint256))) public tokenHoldings;
    mapping(address => mapping(uint256 => uint256)) public nftTokenSupply;

    mapping(address => mapping(uint256 => mapping(address => uint256))) public claimableInterest;

    event InterestDistributed(address indexed collection, uint256 indexed tokenId, address indexed holder, uint256 amount);
    event InterestClaimed(address indexed user, address indexed collection, uint256 indexed tokenId, uint256 amount);
    event OrderPlaced(address indexed user, address indexed collection, uint256 indexed tokenId, bool isBuy, uint256 amount, uint256 price);
    event TradeExecuted(address indexed buyer, address indexed seller, address indexed collection, uint256 tokenId, uint256 amount, uint256 price);
    event TokensMinted(address indexed to, uint256 amount);
    event MinterAuthorized(address indexed minter);

    constructor() ERC20("Diversified Portfolio Option", "DPO") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10**18);
    }

    function mint(address to, uint256 amount) external {
        require(authorizedMinters[msg.sender] || msg.sender == owner(), "Not authorized to mint");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    function authorizeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = true;
        emit MinterAuthorized(minter);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    function mintOnLoan(
        address collection,
        uint256 tokenId,
        address borrower,
        uint256 amount
    ) external {
        require(authorizedMinters[msg.sender], "Not authorized to mint");

        _mint(borrower, amount);

        tokenHoldings[collection][tokenId][borrower] += amount;
        nftTokenSupply[collection][tokenId] += amount;

        emit TokensMinted(borrower, amount);
    }

    function distributeInterest(address collection, uint256 tokenId, address holder, uint256 amount) external onlyOwner {
        claimableInterest[collection][tokenId][holder] += amount;
        emit InterestDistributed(collection, tokenId, holder, amount);
    }

    function calculatePendingInterest(address user, address collection, uint256 tokenId) external view returns (uint256) {
        return claimableInterest[collection][tokenId][user];
    }

    function claimInterest(address collection, uint256 tokenId) external {
        uint256 pending = claimableInterest[collection][tokenId][msg.sender];
        if (pending > 0) {
            claimableInterest[collection][tokenId][msg.sender] = 0;
            _mint(msg.sender, pending);
            emit InterestClaimed(msg.sender, collection, tokenId, pending);
        }
    }

    function placeSellOrder(address collection, uint256 tokenId, uint256 amount, uint256 price) external {
        require(tokenHoldings[collection][tokenId][msg.sender] >= amount, "Insufficient balance");
        emit OrderPlaced(msg.sender, collection, tokenId, false, amount, price);
    }

    function placeBuyOrder(address collection, uint256 tokenId, uint256 amount, uint256 price) external payable {
        require(msg.value >= (amount * price) / 10**18, "Insufficient payment");
        
        tokenHoldings[collection][tokenId][msg.sender] += amount;
        
        emit OrderPlaced(msg.sender, collection, tokenId, true, amount, price);
        emit TradeExecuted(msg.sender, msg.sender, collection, tokenId, amount, price);
    }
}

// NFTVaultV3.sol
interface IGameFiOracle {
    function getFloorPrice(address collection) external view returns (uint256);
    function getUtilityScore(address collection, uint256 tokenId) external view returns (uint256);
    function isActiveAsset(address collection, uint256 tokenId) external view returns (bool);
}

contract NFTVaultV3 is Ownable, ReentrancyGuard {

    IGameFiOracle public oracle;

    struct NFTDeposit {
        address owner;
        uint256 depositTime;
        bool isActive;
    }

    struct Loan {
        uint256 amount;
        uint256 startTime;
        uint256 interestRate;
        bool isActive;
    }

    struct CollectionConfig {
        bool isSupported;
        uint256 maxLTV;
        uint256 liquidationThreshold;
        uint256 baseInterestRate;
    }

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

    uint256 public constant LIQUIDATION_PENALTY = 1000;
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    event NFTDeposited(address indexed user, address indexed collection, uint256 indexed tokenId);
    event NFTWithdrawn(address indexed user, address indexed collection, uint256 indexed tokenId);
    event LoanCreated(address indexed user, address indexed collection, uint256 indexed tokenId, uint256 amount);
    event LoanRepaid(address indexed user, address indexed collection, uint256 indexed tokenId, uint256 amount);
    event CollectionAdded(address indexed collection, uint256 maxLTV, uint256 liquidationThreshold);
    event Liquidation(address indexed collection, uint256 indexed tokenId, uint256 debtAmount, uint256 salePrice);
    event GameCategorySet(address indexed collection, uint8 category);
    event CollectionRiskTierSet(address indexed collection, uint8 tier);

    function addSupportedCollection(
        address collection,
        uint256 maxLTV,
        uint256 liquidationThreshold,
        uint256 baseInterestRate
    ) public onlyOwner {
        require(maxLTV <= 8000, "Max LTV too high");
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
        addSupportedCollection(collection, 7000, 8500, 500);
    }

    constructor(address _oracle) Ownable(msg.sender) {
        oracle = IGameFiOracle(_oracle);

        riskModels[1] = RiskModel(70, 80, 20, 1 ether);
        riskModels[2] = RiskModel(65, 75, 15, 2 ether);
        riskModels[3] = RiskModel(60, 70, 10, 3 ether);
        riskModels[4] = RiskModel(55, 65, 8, 5 ether);
        riskModels[5] = RiskModel(50, 60, 5, 10 ether);
    }

    function updateOracle(address _oracle) external onlyOwner {
        oracle = IGameFiOracle(_oracle);
    }

    function depositNFT(address collection, uint256 tokenId) external nonReentrant {
        require(collectionConfigs[collection].isSupported, "Collection not supported");
        require(IERC721(collection).ownerOf(tokenId) == msg.sender, "Not NFT owner");

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

        IERC721(collection).transferFrom(address(this), msg.sender, tokenId);

        emit Liquidation(collection, tokenId, totalDebt, salePrice);
    }

    function getMaxBorrowAmount(address collection, uint256 tokenId) public view returns (uint256) {
        if (!oracle.isActiveAsset(collection, tokenId)) return 0;

        uint256 floorPrice = oracle.getFloorPrice(collection);
        uint256 utilityScore = oracle.getUtilityScore(collection, tokenId);
        uint256 maxLTV = collectionConfigs[collection].maxLTV;

        uint256 adjustedLTV = maxLTV + (utilityScore * 500 / 100);
        if (adjustedLTV > 8000) adjustedLTV = 8000;

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

        if (floorPrice == 0) return BASIS_POINTS;
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

    function setGameCategory(address collection, uint8 category) external onlyOwner {
        require(category > 0 && category <= 10, "Invalid game category");
        emit GameCategorySet(collection, category);
    }

    function setCollectionRiskTier(address collection, uint8 tier) external onlyOwner {
        require(tier >= 1 && tier <= 5, "Invalid risk tier");
        collectionRiskTiers[collection] = tier;
        emit CollectionRiskTierSet(collection, tier);
    }

    function getMaxLTV(address collection, uint256 tokenId) public view returns (uint256) {
        uint8 riskTier = collectionRiskTiers[collection];
        if (riskTier == 0) riskTier = 3;

        RiskModel memory model = riskModels[riskTier];
        uint256 utilityScore = oracle.getUtilityScore(collection, tokenId);

        uint256 bonus = (utilityScore * model.maxUtilityBonus) / 100;
        return model.baseLTV + bonus;
    }

    function emergencyWithdraw(address collection, uint256 tokenId) external onlyOwner {
        IERC721(collection).transferFrom(address(this), owner(), tokenId);
    }

    receive() external payable {}
}

// LoanManagerV3.sol
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
            interestRate: 500,
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
        return 500;
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

        loanHealthFactors[msg.sender][collection][tokenId] = 15000;

        dpoToken.mintOnLoan(collection, tokenId, msg.sender, amount);

        payable(msg.sender).transfer(amount);

        emit LoanCreated(msg.sender, collection, tokenId, amount);
    }

    function repay(address collection, uint256 tokenId) external payable nonReentrant {
        require(loanData[msg.sender][collection][tokenId].isActive, "No active loan");

        updateLoanInterest(msg.sender, collection, tokenId);

        LoanData storage loan = loanData[msg.sender][collection][tokenId];
        uint256 totalOwed = loan.principal + loan.accruedInterest;

        require(msg.value >= totalOwed, "Insufficient payment to cover full debt");

        loan.isActive = false;
        loan.principal = 0;
        loan.accruedInterest = 0;

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
        if (model.baseRate == 0) return 500;

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

    receive() external payable {}
}

// MosaicalGovernance.sol
contract MosaicalGovernance is Ownable, ReentrancyGuard {
    
    IERC20 public governanceToken;
    
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool cancelled;
        ProposalType proposalType;
        bytes proposalData;
    }
    
    enum ProposalType {
        PARAMETER_CHANGE,
        COLLECTION_ADDITION,
        ORACLE_UPDATE,
        EMERGENCY_ACTION,
        TREASURY_ACTION
    }
    
    enum VoteChoice {
        AGAINST,
        FOR,
        ABSTAIN
    }
    
    struct Vote {
        bool hasVoted;
        VoteChoice choice;
        uint256 weight;
    }
    
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Vote)) public votes;
    mapping(address => uint256) public delegatedVotes;
    mapping(address => address) public delegates;
    
    uint256 public proposalCount;
    uint256 public constant VOTING_DURATION = 3 days;
    uint256 public constant MIN_PROPOSAL_THRESHOLD = 100000 * 10**18;
    uint256 public constant QUORUM_PERCENTAGE = 10;
    uint256 public constant APPROVAL_THRESHOLD = 51;
    
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        uint256 startTime,
        uint256 endTime
    );
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        VoteChoice choice,
        uint256 weight
    );
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);
    event DelegateChanged(address indexed delegator, address indexed newDelegate);
    
    constructor(address _governanceToken) Ownable(msg.sender) {
        governanceToken = IERC20(_governanceToken);
    }
    
    function delegate(address delegatee) external {
        address currentDelegate = delegates[msg.sender];
        uint256 delegatorBalance = governanceToken.balanceOf(msg.sender);
        
        if (currentDelegate != address(0)) {
            delegatedVotes[currentDelegate] = delegatedVotes[currentDelegate] - delegatorBalance;
        }
        
        delegates[msg.sender] = delegatee;
        if (delegatee != address(0)) {
            delegatedVotes[delegatee] = delegatedVotes[delegatee] + delegatorBalance;
        }
        
        emit DelegateChanged(msg.sender, delegatee);
    }
    
    function getVotingPower(address account) public view returns (uint256) {
        return governanceToken.balanceOf(account) + delegatedVotes[account];
    }
    
    function createProposal(
        string memory title,
        string memory description,
        ProposalType proposalType,
        bytes memory proposalData
    ) external returns (uint256) {
        require(getVotingPower(msg.sender) >= MIN_PROPOSAL_THRESHOLD, "Insufficient voting power");
        require(bytes(title).length > 0, "Empty title");
        require(bytes(description).length > 0, "Empty description");
        
        proposalCount++;
        uint256 proposalId = proposalCount;
        
        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            title: title,
            description: description,
            startTime: block.timestamp,
            endTime: block.timestamp + VOTING_DURATION,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            executed: false,
            cancelled: false,
            proposalType: proposalType,
            proposalData: proposalData
        });
        
        emit ProposalCreated(
            proposalId,
            msg.sender,
            title,
            block.timestamp,
            block.timestamp + VOTING_DURATION
        );
        
        return proposalId;
    }
    
    function vote(uint256 proposalId, VoteChoice choice) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        require(block.timestamp >= proposal.startTime, "Voting not started");
        require(block.timestamp <= proposal.endTime, "Voting ended");
        require(!proposal.executed, "Proposal already executed");
        require(!proposal.cancelled, "Proposal cancelled");
        
        Vote storage userVote = votes[proposalId][msg.sender];
        require(!userVote.hasVoted, "Already voted");
        
        uint256 weight = getVotingPower(msg.sender);
        require(weight > 0, "No voting power");
        
        userVote.hasVoted = true;
        userVote.choice = choice;
        userVote.weight = weight;
        
        if (choice == VoteChoice.FOR) {
            proposal.forVotes = proposal.forVotes + weight;
        } else if (choice == VoteChoice.AGAINST) {
            proposal.againstVotes = proposal.againstVotes + weight;
        } else {
            proposal.abstainVotes = proposal.abstainVotes + weight;
        }
        
        emit VoteCast(proposalId, msg.sender, choice, weight);
    }
    
    function executeProposal(uint256 proposalId) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        require(block.timestamp > proposal.endTime, "Voting still active");
        require(!proposal.executed, "Already executed");
        require(!proposal.cancelled, "Proposal cancelled");
        
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        uint256 totalSupply = governanceToken.totalSupply();
        uint256 quorumRequired = totalSupply * QUORUM_PERCENTAGE / 100;
        require(totalVotes >= quorumRequired, "Quorum not reached");
        
        uint256 approvalVotes = proposal.forVotes;
        uint256 totalVotesForApproval = proposal.forVotes + proposal.againstVotes;
        require(
            approvalVotes * 100 / totalVotesForApproval >= APPROVAL_THRESHOLD,
            "Proposal not approved"
        );
        
        proposal.executed = true;
        
        _executeProposalAction(proposal);
        
        emit ProposalExecuted(proposalId);
    }
    
    function cancelProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        require(
            msg.sender == proposal.proposer || msg.sender == owner(),
            "Not authorized to cancel"
        );
        require(!proposal.executed, "Already executed");
        require(!proposal.cancelled, "Already cancelled");
        
        proposal.cancelled = true;
        emit ProposalCancelled(proposalId);
    }
    
    function getProposal(uint256 proposalId) external view returns (
        uint256 id,
        address proposer,
        string memory title,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 abstainVotes,
        bool executed,
        bool cancelled,
        ProposalType proposalType
    ) {
        Proposal memory proposal = proposals[proposalId];
        return (
            proposal.id,
            proposal.proposer,
            proposal.title,
            proposal.description,
            proposal.startTime,
            proposal.endTime,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.abstainVotes,
            proposal.executed,
            proposal.cancelled,
            proposal.proposalType
        );
    }
    
    function getProposalState(uint256 proposalId) external view returns (string memory) {
        Proposal memory proposal = proposals[proposalId];
        
        if (proposal.id == 0) return "NonExistent";
        if (proposal.cancelled) return "Cancelled";
        if (proposal.executed) return "Executed";
        if (block.timestamp <= proposal.endTime) return "Active";
        
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        uint256 totalSupply = governanceToken.totalSupply();
        uint256 quorumRequired = totalSupply * QUORUM_PERCENTAGE / 100;
        
        if (totalVotes < quorumRequired) return "Failed";
        
        uint256 approvalVotes = proposal.forVotes;
        uint256 totalVotesForApproval = proposal.forVotes + proposal.againstVotes;
        
        if (totalVotesForApproval == 0 || approvalVotes * 100 / totalVotesForApproval < APPROVAL_THRESHOLD) {
            return "Failed";
        }
        
        return "Succeeded";
    }
    
    function getUserVote(uint256 proposalId, address user) external view returns (
        bool hasVoted,
        VoteChoice choice,
        uint256 weight
    ) {
        Vote memory userVote = votes[proposalId][user];
        return (userVote.hasVoted, userVote.choice, userVote.weight);
    }
    
    function _executeProposalAction(Proposal memory proposal) internal {
        if (proposal.proposalType == ProposalType.PARAMETER_CHANGE) {
        } else if (proposal.proposalType == ProposalType.COLLECTION_ADDITION) {
        } else if (proposal.proposalType == ProposalType.ORACLE_UPDATE) {
        } else if (proposal.proposalType == ProposalType.EMERGENCY_ACTION) {
        } else if (proposal.proposalType == ProposalType.TREASURY_ACTION) {
        }
    }
    
    function emergencyPause() external onlyOwner {
    }
    
    function updateVotingParameters(
        uint256 newVotingDuration,
        uint256 newMinProposalThreshold,
        uint256 newQuorumPercentage,
        uint256 newApprovalThreshold
    ) external onlyOwner {
    }
}

// MosaicalSagaBridge.sol
contract MosaicalSagaBridge is Ownable, ReentrancyGuard {
    
    address public layerZeroEndpoint;
    
    mapping(uint256 => bool) public supportedChainlets;
    mapping(address => mapping(uint256 => address)) public remoteMappings;
    mapping(address => mapping(uint256 => bool)) public bridgedNFTs;
    
    event NFTBridgeInitiated(
        address indexed collection,
        uint256 indexed tokenId,
        uint256 indexed chainletId,
        address user
    );
    
    event NFTBridgeCompleted(
        address indexed collection,
        uint256 indexed tokenId,
        uint256 indexed chainletId,
        address user
    );
    
    event ChainletAdded(uint256 indexed chainletId);
    event CollectionMapped(address indexed collection, uint256 indexed chainletId, address remoteCollection);
    
    constructor(address _layerZeroEndpoint) Ownable(msg.sender) {
        layerZeroEndpoint = _layerZeroEndpoint;
    }
    
    function addSupportedChainlet(uint256 chainletId) external onlyOwner {
        supportedChainlets[chainletId] = true;
        emit ChainletAdded(chainletId);
    }
    
    function mapCollection(
        address localCollection,
        uint256 chainletId,
        address remoteCollection
    ) external onlyOwner {
        require(supportedChainlets[chainletId], "Chainlet not supported");
        remoteMappings[localCollection][chainletId] = remoteCollection;
        emit CollectionMapped(localCollection, chainletId, remoteCollection);
    }
    
    function bridgeNFT(
        address collection,
        uint256 tokenId,
        uint256 chainletId
    ) external payable nonReentrant {
        require(supportedChainlets[chainletId], "Chainlet not supported");
        require(remoteMappings[collection][chainletId] != address(0), "Collection not mapped");
        require(IERC721(collection).ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(msg.value >= 0.01 ether, "Insufficient bridge fee");
        
        IERC721(collection).transferFrom(msg.sender, address(this), tokenId);
        bridgedNFTs[collection][tokenId] = true;
        
        emit NFTBridgeInitiated(collection, tokenId, chainletId, msg.sender);
    }
    
    function releaseBridgedNFT(
        address collection,
        uint256 tokenId,
        address recipient
    ) external onlyOwner {
        require(bridgedNFTs[collection][tokenId], "NFT not bridged");
        
        bridgedNFTs[collection][tokenId] = false;
        IERC721(collection).transferFrom(address(this), recipient, tokenId);
        
        emit NFTBridgeCompleted(collection, tokenId, 0, recipient);
    }
    
    function updateLayerZeroEndpoint(address _endpoint) external onlyOwner {
        layerZeroEndpoint = _endpoint;
    }
    
    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    receive() external payable {}
}
