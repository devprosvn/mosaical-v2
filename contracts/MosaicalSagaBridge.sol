
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MosaicalSagaBridge is Ownable, IERC721Receiver, ReentrancyGuard {
    mapping(uint256 => bool) public supportedChainlets;
    mapping(address => mapping(uint256 => address)) public remoteMappings;
    mapping(bytes32 => bool) public processedMessages;

    event NFTBridgeInitiated(
        address indexed collection,
        uint256 indexed tokenId,
        address indexed owner,
        uint256 destinationChainlet,
        bytes32 messageId
    );

    event NFTBridgeCompleted(
        address indexed collection,
        uint256 indexed tokenId,
        address indexed owner,
        uint256 sourceChainlet,
        bytes32 messageId
    );

    event ChainletAdded(uint256 indexed chainletId);
    event CollectionMapped(address indexed localCollection, uint256 indexed chainletId, address remoteCollection);

    constructor() Ownable(msg.sender) {}

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
        uint256 destinationChainlet
    ) external payable nonReentrant {
        require(supportedChainlets[destinationChainlet], "Chainlet not supported");
        require(remoteMappings[collection][destinationChainlet] != address(0), "Collection not mapped");
        require(msg.value >= 0.001 ether, "Insufficient bridge fee");

        // Transfer NFT to bridge
        IERC721(collection).safeTransferFrom(msg.sender, address(this), tokenId);

        // Generate message ID
        bytes32 messageId = keccak256(abi.encodePacked(
            collection,
            tokenId,
            msg.sender,
            destinationChainlet,
            block.timestamp
        ));

        emit NFTBridgeInitiated(collection, tokenId, msg.sender, destinationChainlet, messageId);
    }

    function completeBridge(
        address collection,
        uint256 tokenId,
        address originalOwner,
        uint256 sourceChainlet,
        bytes32 messageId
    ) external onlyOwner {
        require(!processedMessages[messageId], "Message already processed");
        require(supportedChainlets[sourceChainlet], "Invalid source chainlet");

        processedMessages[messageId] = true;

        // In a real implementation, this would mint a new NFT or release an existing one
        // For testing, we'll just emit an event
        emit NFTBridgeCompleted(collection, tokenId, originalOwner, sourceChainlet, messageId);
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    receive() external payable {}
}
