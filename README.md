
# Mosaical MVP - Decentralized NFT Fractionalization Platform

Mosaical là một nền tảng phi tập trung cho phép phân mảnh (fractionalize) NFT và tạo ra các token DPO (Diversified Portfolio Option) để giao dịch và đầu tư vào danh mục NFT đa dạng.

## 📋 Todo List

### ✅ Completed
- [x] Smart contract development (8 contracts)
- [x] Contract compilation system
- [x] Deployment scripts for Saga chainlet
- [x] Contract flattening for verification
- [x] Basic testing framework
- [x] Environment configuration

### 🔧 In Progress
- [ ] Contract verification on Saga Explorer
- [ ] Frontend development
- [ ] API integration
- [ ] Advanced testing scenarios

### 📅 Planned
- [ ] Oracle price feed integration
- [ ] Cross-chain bridge functionality
- [ ] Governance voting mechanism
- [ ] Staking rewards system
- [ ] Mobile application
- [ ] Audit and security review

## 🏗️ System Architecture

```mermaid
graph TB
    User[👤 User] --> Frontend[🖥️ Frontend DApp]
    Frontend --> Web3[🔗 Web3 Provider]
    Web3 --> Saga[🌐 Saga Chainlet]
    
    subgraph "Smart Contracts"
        MockNFT[🎮 MockGameNFT]
        Vault[🏦 NFTVaultV3]
        DPO[💰 DPOTokenV3]
        Loan[📋 LoanManagerV3]
        Oracle[📊 GameFiOracleV3]
        Gov[🗳️ MosaicalGovernance]
        GovToken[🎫 GovernanceToken]
        Bridge[🌉 MosaicalSagaBridge]
    end
    
    Saga --> MockNFT
    Saga --> Vault
    Saga --> DPO
    Saga --> Loan
    Saga --> Oracle
    Saga --> Gov
    Saga --> GovToken
    Saga --> Bridge
    
    Oracle --> ExternalAPI[📡 External Price APIs]
    Bridge --> OtherChains[⛓️ Other Blockchains]
```

## 🎯 Core Features

### 1. NFT Fractionalization
- Deposit NFTs vào vault để nhận DPO tokens
- Phân mảnh ownership của high-value NFTs
- Liquidity mining và yield farming

### 2. Decentralized Finance (DeFi)
- Lending/borrowing với NFT collateral
- Interest distribution system
- Order book trading cho DPO tokens

### 3. Governance System
- Community voting trên protocol changes
- Proposal creation và execution
- Token-based voting power

### 4. Cross-chain Bridge
- Transfer assets giữa các chains
- Multi-chain NFT support
- Unified liquidity pools

## 📊 Functional Diagram

```mermaid
flowchart TD
    Start([🚀 User Start]) --> Choice{Select Action}
    
    Choice -->|Deposit NFT| DepositFlow[📥 Deposit NFT]
    Choice -->|Trade DPO| TradeFlow[💱 Trade DPO Tokens]
    Choice -->|Borrow| BorrowFlow[💰 Borrow Against NFT]
    Choice -->|Governance| GovFlow[🗳️ Governance Actions]
    
    DepositFlow --> CheckNFT{Valid NFT?}
    CheckNFT -->|Yes| MintDPO[🪙 Mint DPO Tokens]
    CheckNFT -->|No| Error1[❌ Error: Invalid NFT]
    MintDPO --> Success1[✅ Success: DPO Received]
    
    TradeFlow --> CheckBalance{Sufficient Balance?}
    CheckBalance -->|Yes| ExecuteTrade[⚡ Execute Trade]
    CheckBalance -->|No| Error2[❌ Error: Insufficient Funds]
    ExecuteTrade --> Success2[✅ Success: Trade Complete]
    
    BorrowFlow --> CheckCollateral{Valid Collateral?}
    CheckCollateral -->|Yes| CreateLoan[📋 Create Loan]
    CheckCollateral -->|No| Error3[❌ Error: Invalid Collateral]
    CreateLoan --> Success3[✅ Success: Loan Created]
    
    GovFlow --> CheckVotingPower{Has Voting Power?}
    CheckVotingPower -->|Yes| Vote[🗳️ Cast Vote]
    CheckVotingPower -->|No| Error4[❌ Error: No Voting Power]
    Vote --> Success4[✅ Success: Vote Recorded]
    
    Success1 --> End([🏁 End])
    Success2 --> End
    Success3 --> End
    Success4 --> End
    Error1 --> End
    Error2 --> End
    Error3 --> End
    Error4 --> End
```

## 🎭 Use Case Diagram

### System Level Use Cases

```mermaid
graph LR
    User[👤 User]
    Investor[👨‍💼 Investor]
    Admin[👑 Admin]
    Oracle[🤖 Oracle]
    
    subgraph "Mosaical System"
        UC1[Deposit NFT]
        UC2[Withdraw NFT]
        UC3[Trade DPO Tokens]
        UC4[Create Loan]
        UC5[Repay Loan]
        UC6[Vote on Proposals]
        UC7[Create Proposals]
        UC8[Update Prices]
        UC9[Manage System]
        UC10[Bridge Assets]
    end
    
    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    
    Investor --> UC3
    Investor --> UC6
    Investor --> UC7
    
    Admin --> UC9
    Admin --> UC7
    
    Oracle --> UC8
    
    User --> UC10
```

### NFT Vault Module Use Cases

```mermaid
graph LR
    NFTOwner[🎨 NFT Owner]
    DPOHolder[💰 DPO Holder]
    
    subgraph "NFT Vault Module"
        UC1[Deposit NFT]
        UC2[Withdraw NFT]
        UC3[Check Vault Status]
        UC4[Calculate DPO Value]
        UC5[Emergency Withdraw]
    end
    
    NFTOwner --> UC1
    NFTOwner --> UC2
    NFTOwner --> UC3
    NFTOwner --> UC5
    
    DPOHolder --> UC2
    DPOHolder --> UC3
    DPOHolder --> UC4
```

### Loan Manager Module Use Cases

```mermaid
graph LR
    Borrower[💳 Borrower]
    Lender[🏦 Lender]
    
    subgraph "Loan Manager Module"
        UC1[Create Loan Request]
        UC2[Approve Loan]
        UC3[Repay Loan]
        UC4[Liquidate Collateral]
        UC5[Check Loan Status]
        UC6[Calculate Interest]
    end
    
    Borrower --> UC1
    Borrower --> UC3
    Borrower --> UC5
    
    Lender --> UC2
    Lender --> UC4
    Lender --> UC5
    Lender --> UC6
```

### Governance Module Use Cases

```mermaid
graph LR
    TokenHolder[🎫 Token Holder]
    Proposer[📝 Proposer]
    
    subgraph "Governance Module"
        UC1[Create Proposal]
        UC2[Vote on Proposal]
        UC3[Execute Proposal]
        UC4[Delegate Voting Power]
        UC5[Check Voting History]
    end
    
    TokenHolder --> UC2
    TokenHolder --> UC4
    TokenHolder --> UC5
    
    Proposer --> UC1
    Proposer --> UC3
```

## 🏛️ Class Diagram

```mermaid
classDiagram
    class MockGameNFT {
        +string name
        +string symbol
        +constructor(name, symbol)
        +mint(to, tokenId)
        +exists(tokenId) bool
        +tokenURI(tokenId) string
    }
    
    class NFTVaultV3 {
        +mapping vaultedNFTs
        +mapping dpoBalances
        +address oracle
        +constructor(oracle)
        +depositNFT(collection, tokenId)
        +withdrawNFT(collection, tokenId)
        +calculateDPOValue(collection, tokenId) uint256
        +emergencyWithdraw(collection, tokenId)
    }
    
    class DPOTokenV3 {
        +mapping authorizedMinters
        +mapping tokenHoldings
        +mapping claimableInterest
        +constructor()
        +mint(to, amount)
        +mintOnLoan(collection, tokenId, borrower, amount)
        +distributeInterest(collection, tokenId, holder, amount)
        +claimInterest(collection, tokenId)
        +placeBuyOrder(collection, tokenId, amount, price)
        +placeSellOrder(collection, tokenId, amount, price)
    }
    
    class LoanManagerV3 {
        +address nftVault
        +address dpoToken
        +mapping loans
        +constructor(vault, dpoToken)
        +createLoan(collection, tokenId, amount, duration)
        +repayLoan(loanId)
        +liquidateLoan(loanId)
        +calculateInterest(loanId) uint256
    }
    
    class GameFiOracleV3 {
        +mapping priceFeeds
        +mapping authorizedUpdaters
        +constructor()
        +updatePrice(collection, tokenId, price)
        +getPrice(collection, tokenId) uint256
        +addPriceFeed(collection, feedAddress)
    }
    
    class MosaicalGovernance {
        +address governanceToken
        +mapping proposals
        +constructor(govToken)
        +createProposal(description, targets, values, calldatas)
        +vote(proposalId, support)
        +executeProposal(proposalId)
        +getVotingPower(account) uint256
    }
    
    class GovernanceToken {
        +constructor(name, symbol)
        +mint(to, amount)
        +delegate(delegatee)
        +getVotes(account) uint256
    }
    
    class MosaicalSagaBridge {
        +address trustedRemote
        +mapping bridgedAssets
        +constructor(trustedRemote)
        +bridgeToRemote(tokenId, amount, recipient)
        +receiveFromRemote(tokenId, amount, recipient)
        +updateTrustedRemote(newRemote)
    }
    
    NFTVaultV3 --> GameFiOracleV3 : uses
    NFTVaultV3 --> DPOTokenV3 : mints
    LoanManagerV3 --> NFTVaultV3 : manages
    LoanManagerV3 --> DPOTokenV3 : mints
    MosaicalGovernance --> GovernanceToken : uses
    MockGameNFT --> NFTVaultV3 : deposited to
```

## 📊 Entity Relationship Diagram

```mermaid
erDiagram
    USER {
        address wallet_address PK
        uint256 dpo_balance
        uint256 governance_tokens
        uint256 voting_power
        bool is_authorized_minter
    }
    
    NFT {
        address collection_address PK
        uint256 token_id PK
        address owner
        bool is_vaulted
        uint256 estimated_value
        string metadata_uri
    }
    
    VAULT {
        address vault_address PK
        uint256 total_dpo_minted
        uint256 total_nfts_deposited
        address oracle_address
        bool emergency_paused
    }
    
    DPO_TOKEN {
        address token_address PK
        uint256 total_supply
        uint256 decimals
        string name
        string symbol
    }
    
    LOAN {
        uint256 loan_id PK
        address borrower
        address collection_address
        uint256 token_id
        uint256 principal_amount
        uint256 interest_rate
        uint256 duration
        uint256 start_timestamp
        bool is_repaid
        bool is_liquidated
    }
    
    PROPOSAL {
        uint256 proposal_id PK
        address proposer
        string description
        uint256 vote_start
        uint256 vote_end
        uint256 votes_for
        uint256 votes_against
        bool executed
        bool cancelled
    }
    
    VOTE {
        uint256 vote_id PK
        uint256 proposal_id FK
        address voter
        bool support
        uint256 voting_power
        uint256 timestamp
    }
    
    PRICE_FEED {
        address collection_address PK
        uint256 token_id PK
        uint256 current_price
        uint256 last_updated
        address feed_source
        bool is_active
    }
    
    BRIDGE_TRANSACTION {
        uint256 tx_id PK
        address from_chain
        address to_chain
        address sender
        address recipient
        uint256 amount
        uint256 timestamp
        bool completed
    }
    
    USER ||--o{ NFT : owns
    USER ||--o{ LOAN : borrows
    USER ||--o{ VOTE : casts
    USER ||--o{ PROPOSAL : creates
    
    NFT ||--o| VAULT : deposited_in
    NFT ||--o| LOAN : collateral_for
    NFT ||--o| PRICE_FEED : has_price
    
    VAULT ||--|| DPO_TOKEN : mints
    VAULT ||--o{ LOAN : manages
    
    PROPOSAL ||--o{ VOTE : receives
    
    LOAN }|--|| NFT : secured_by
    LOAN }|--|| USER : borrowed_by
    
    PRICE_FEED }|--|| NFT : prices
```

## 🚀 Quick Start

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your private key and network settings
```

### 2. Compile Contracts
```bash
# Using workflow button or command
npm run compile
# or
node scripts/compile.js
```

### 3. Deploy Contracts
```bash
# Deploy to Saga chainlet
npx hardhat run scripts/deploy.js --network devpros

# Deploy with JSON output
npx hardhat run scripts/deploy-with-json.js --network devpros
```

### 4. Verify Contracts
```bash
# Flatten contracts first
node scripts/flatten.js

# Manual verification on Saga Explorer
# Use flattened files in /flattened directory
```

### 5. Run Tests
```bash
npx hardhat test
```

## 📁 Project Structure

```
├── contracts/              # Smart contracts
│   ├── MockGameNFT.sol     # Example NFT contract
│   ├── NFTVaultV3.sol      # NFT vault for deposits
│   ├── DPOTokenV3.sol      # Fractionalized tokens
│   ├── LoanManagerV3.sol   # Lending protocol
│   ├── GameFiOracleV3.sol  # Price oracle
│   ├── MosaicalGovernance.sol # DAO governance
│   ├── GovernanceToken.sol # Voting tokens
│   └── MosaicalSagaBridge.sol # Cross-chain bridge
├── scripts/                # Deployment & utility scripts
├── test/                   # Test files
├── deployments/            # Deployment records
├── flattened/              # Flattened contracts for verification
└── .env.example           # Environment template
```

## 🌐 Network Configuration

### Saga Chainlet (devpros)
- **RPC URL**: `https://devpros-2749656616387000-1.jsonrpc.sagarpc.io`
- **Chain ID**: `2749656616387000`
- **Explorer**: `https://devpros-2749656616387000-1.sagaexplorer.io`
- **WebSocket**: `https://devpros-2749656616387000-1.ws.sagarpc.io`

### Contract Addresses (Latest Deployment)
```json
{
  "MockGameNFT": "0x165ABbf7859997e9Ebed825df101E313Db642dda",
  "GovernanceToken": "0x54bef235A25daC5B4386A05e25D37688C5379936",
  "GameFiOracleV3": "0x980F5eA0dc03175056BC041f4708C82B74d6E322",
  "NFTVaultV3": "0x869d9bF00823018f74854033040943A1ff5EFf60",
  "MosaicalGovernance": "0xd31E3D5e43E9945B4AF2aDD7f5a54C00E76b0991",
  "DPOTokenV3": "0x6d66483DC259783f4E4aDe90b1fAB01F8A876D2e",
  "LoanManagerV3": "0xC9D80AF77a91d7FB7A73189D1D97ABc29399460c",
  "MosaicalSagaBridge": "0x2FbA9CcF4930FB188a4A5A7a7bFC6aDBda0eb439"
}
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run compile` | Compile smart contracts |
| `npm run deploy` | Deploy contracts to network |
| `npm run test` | Run test suite |
| `npm run flatten` | Generate flattened contracts |
| `npm run verify` | Verify contracts on explorer |

## 🛡️ Security Considerations

- All contracts use OpenZeppelin secure implementations
- Multi-signature requirements for critical operations
- Emergency pause mechanisms
- Oracle price manipulation protection
- Reentrancy guards on financial functions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Join our Discord community
- Follow our documentation

---

*Built with ❤️ on Saga Chainlet*
