
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MyContract is Ownable {
    string public message;
    uint256 public counter;
    
    event MessageUpdated(string newMessage);
    event CounterIncremented(uint256 newValue);
    
    constructor(string memory _initialMessage) Ownable(msg.sender) {
        message = _initialMessage;
        counter = 0;
    }
    
    function updateMessage(string memory _newMessage) public onlyOwner {
        message = _newMessage;
        emit MessageUpdated(_newMessage);
    }
    
    function incrementCounter() public {
        counter++;
        emit CounterIncremented(counter);
    }
    
    function getMessage() public view returns (string memory) {
        return message;
    }
    
    function getCounter() public view returns (uint256) {
        return counter;
    }
}
