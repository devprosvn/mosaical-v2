// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DPOTokenV3 is ERC20, Ownable {

    mapping(address => bool) public authorizedMinters;

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