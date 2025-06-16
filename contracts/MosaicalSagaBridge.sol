
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MosaicalSagaBridge is Ownable, ReentrancyGuard {
    
    address public layerZeroEndpoint;
    bool public isPaused;
    
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
    event BridgePaused();
    event BridgeUnpaused();
    
    modifier whenNotPaused() {
        require(!isPaused, "Bridge is paused");
        _;
    }
    
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
    ) external payable nonReentrant whenNotPaused {
        require(supportedChainlets[chainletId], "Chainlet not supported");
        require(remoteMappings[collection][chainletId] != address(0), "Collection not mapped");
        require(IERC721(collection).ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(msg.value >= 0.01 ether, "Insufficient bridge fee");
        
        // Lock NFT in bridge
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
    
    function pauseBridge() external onlyOwner {
        isPaused = true;
        emit BridgePaused();
    }
    
    function unpauseBridge() external onlyOwner {
        isPaused = false;
        emit BridgeUnpaused();
    }
    
    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    receive() external payable {}
}
