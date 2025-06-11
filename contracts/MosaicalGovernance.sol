
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract MosaicalGovernance is ReentrancyGuard {
    IERC20 public governanceToken;
    
    uint256 public proposalCount;
    
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        bytes[] calls;
        address[] targets;
        uint256[] values;
        bool executed;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
    }
    
    mapping(uint256 => Proposal) public proposals;
    
    struct Receipt {
        bool hasVoted;
        bool support;
        uint256 votes;
    }
    
    mapping(uint256 => mapping(address => Receipt)) public receipts;
    
    mapping(address => address) public delegates;
    mapping(address => uint256) public checkpoints;
    
    uint256 public votingDelay = 13140; // ~2 days in blocks
    uint256 public votingPeriod = 40320; // ~1 week in blocks
    uint256 public proposalThreshold = 1000000 * 10**18; // 1M tokens to propose
    uint256 public quorumVotes = 5000000 * 10**18; // 5M tokens for quorum
    
    event ProposalCreated(uint256 id, address proposer, string description);
    event VoteCast(address voter, uint256 proposalId, bool support, uint256 votes);
    event ProposalExecuted(uint256 id);
    
    constructor(address _governanceToken) {
        governanceToken = IERC20(_governanceToken);
    }
    
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public returns (uint256) {
        require(
            governanceToken.balanceOf(msg.sender) >= proposalThreshold,
            "MosaicalGovernance::propose: below threshold"
        );
        
        require(targets.length == values.length && targets.length == calldatas.length,
            "MosaicalGovernance::propose: invalid proposal"
        );
        
        proposalCount++;
        Proposal memory newProposal = Proposal({
            id: proposalCount,
            proposer: msg.sender,
            description: description,
            calls: calldatas,
            targets: targets,
            values: values,
            executed: false,
            startBlock: block.number + votingDelay,
            endBlock: block.number + votingDelay + votingPeriod,
            forVotes: 0,
            againstVotes: 0
        });
        
        proposals[proposalCount] = newProposal;
        emit ProposalCreated(proposalCount, msg.sender, description);
        
        return proposalCount;
    }
    
    function castVote(uint256 proposalId, bool support) public {
        Proposal storage proposal = proposals[proposalId];
        require(block.number >= proposal.startBlock, "Voting not started");
        require(block.number < proposal.endBlock, "Voting closed");
        
        Receipt storage receipt = receipts[proposalId][msg.sender];
        require(!receipt.hasVoted, "Already voted");
        
        uint256 votes = getVotingPower(msg.sender);
        
        if (support) {
            proposal.forVotes += votes;
        } else {
            proposal.againstVotes += votes;
        }
        
        receipt.hasVoted = true;
        receipt.support = support;
        receipt.votes = votes;
        
        emit VoteCast(msg.sender, proposalId, support, votes);
    }
    
    function execute(uint256 proposalId) public nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(block.number > proposal.endBlock, "Voting still active");
        require(!proposal.executed, "Already executed");
        require(
            proposal.forVotes > proposal.againstVotes && 
            proposal.forVotes >= quorumVotes,
            "Proposal not passed"
        );
        
        proposal.executed = true;
        
        for (uint256 i = 0; i < proposal.targets.length; i++) {
            (bool success, ) = proposal.targets[i].call{value: proposal.values[i]}(proposal.calls[i]);
            require(success, "Proposal execution failed");
        }
        
        emit ProposalExecuted(proposalId);
    }
    
    function getVotingPower(address account) public view returns (uint256) {
        return governanceToken.balanceOf(account);
    }
    
    function delegate(address delegatee) public {
        delegates[msg.sender] = delegatee;
    }
    
    modifier onlyGov() {
        require(msg.sender == address(this), "Only governance");
        _;
    }
}
