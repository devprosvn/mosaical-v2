// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DPOTokenV3 is ERC20, Ownable {

    // Authorization for minting
    mapping(address => bool) public authorizedMinters;

    // NFT-specific token holdings
    mapping(address => mapping(uint256 => mapping(address => uint256))) public tokenHoldings;
    mapping(address => mapping(uint256 => uint256)) public nftTokenSupply;

    event InterestDistributed(address indexed collection, uint256 indexed tokenId, uint256 amount);
    event InterestClaimed(address indexed user, address indexed collection, uint256 indexed tokenId, uint256 amount);
    event OrderPlaced(address indexed user, address indexed collection, uint256 indexed tokenId, bool isBuy, uint256 amount, uint256 price);
    event TradeExecuted(address indexed buyer, address indexed seller, address indexed collection, uint256 tokenId, uint256 amount, uint256 price);
    event TokensMinted(address indexed to, uint256 amount);
    event MinterAuthorized(address indexed minter);

    constructor() ERC20("Diversified Portfolio Option", "DPO") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10**18); // Initial supply
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
}