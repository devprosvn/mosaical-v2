// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "base64-sol/base64.sol";

contract MockGameNFTWithURI is ERC721, Ownable {
    using Strings for uint256;
    uint256 private _nextTokenId;
    
    // Mapping from token ID to custom URI
    mapping(uint256 => string) private _tokenURIs;

    constructor(string memory name, string memory symbol)
        ERC721(name, symbol)
        Ownable(msg.sender)
    {}

    function mint(address to, uint256 tokenId) public onlyOwner {
        _safeMint(to, tokenId);
    }

    function safeMint(address to) public {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
    }
    
    // New function to mint with a custom image URL
    function safeMintWithImage(address to, string memory imageUrl) public {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, imageUrl);
    }
    
    // Function to set a custom URI for a token
    function setTokenURI(uint256 tokenId, string memory imageUrl) public {
        require(_exists(tokenId), "URI set for nonexistent token");
        require(ownerOf(tokenId) == msg.sender || msg.sender == owner(), "Only token owner or contract owner can set URI");
        _setTokenURI(tokenId, imageUrl);
    }
    
    // Internal function to set the token URI
    function _setTokenURI(uint256 tokenId, string memory imageUrl) internal {
        _tokenURIs[tokenId] = imageUrl;
    }

    function exists(uint256 tokenId) external view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
    
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "URI query for nonexistent token");
        
        string memory imageUrl = _tokenURIs[tokenId];
        
        // If no custom URI is set, use the default
        if (bytes(imageUrl).length == 0) {
            imageUrl = "ipfs://QmTestImage";
        }
        
        // Return Base64-encoded JSON metadata
        string memory json = Base64.encode(
            abi.encodePacked(
                '{"name": "Test Game NFT #', 
                Strings.toString(tokenId), 
                '", "description": "A mock GameFi NFT for testing", "image": "', 
                imageUrl, 
                '", "attributes": [{"trait_type": "Level", "value": "50"}, {"trait_type": "Rarity", "value": "Epic"}]}'
            )
        );
        
        return string(abi.encodePacked('data:application/json;base64,', json));
    }
} 