
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract MockGameNFT is ERC721, Ownable {
    using Strings for uint256;

    // CoinGecko asset platform ID cho Ethereum
    string private constant ASSET_PLATFORM = "ethereum";
    // Base URL của CoinGecko NFT API
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

    /// @notice Trả về URI theo chuẩn CoinGecko NFT API  
    /// @dev Endpoint: GET /nfts/{asset_platform}/contract/{contract_address}?token_ids[]=tokenId
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");

        // Định dạng URL:
        // https://api.coingecko.com/api/v3/nfts/ethereum/contract/0x1234...abcd?token_ids%5B%5D=1
        return string(
            abi.encodePacked(
                BASE_URI,
                ASSET_PLATFORM,
                "/contract/",
                Strings.toHexString(uint160(address(this)), 20),
                "?token_ids%5B%5D=",
                tokenId.toString()
            )
        );
    }
}
