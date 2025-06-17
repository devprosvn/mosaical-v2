# Mosaical MVP - Decentralized NFT Fractionalization Platform

Mosaical is a decentralized platform that enables NFT fractionalization and creates DPO (Diversified Portfolio Option) tokens for trading and investing in diversified NFT portfolios.

## 🚀 Features

- **NFT Fractionalization**: Deposit NFTs into vaults to receive DPO tokens
- **Lending Protocol**: Borrow against NFT collateral with dynamic interest rates
- **Governance System**: Community-driven protocol governance with voting mechanisms
- **Cross-chain Bridge**: Transfer assets between different blockchain networks
- **Oracle Integration**: Real-time price feeds and utility scoring for GameFi NFTs
- **Risk Management**: Multi-tier risk models with liquidation protection

## 📊 System Architecture

The platform consists of 8 core smart contracts deployed on Saga Chainlet:

1. **MockGameNFT** - Example NFT contract for testing
2. **NFTVaultV3** - Core vault for NFT deposits and collateral management
3. **DPOTokenV3** - Fractionalized tokens with interest distribution
4. **LoanManagerV3** - Lending protocol with dynamic interest rates
5. **GameFiOracleV3** - Price oracle with utility scoring for GameFi assets
6. **MosaicalGovernance** - DAO governance with proposal and voting system
7. **GovernanceToken** - Voting tokens for protocol governance
8. **MosaicalSagaBridge** - Cross-chain bridge for asset transfers

```mermaid
graph TB
    subgraph "External Layer"
        User[Users]
        GameFi[GameFi NFTs]
        CrossChain[Other Chains]
    end
    
    subgraph "Mosaical Platform - Saga Chainlet"
        subgraph "Core Contracts"
            NFTVault[NFTVaultV3<br/>NFT Collateral Management]
            DPOToken[DPOTokenV3<br/>Fractionalized Tokens]
            LoanManager[LoanManagerV3<br/>Lending Protocol]
            Oracle[GameFiOracleV3<br/>Price Oracle]
        end
        
        subgraph "Governance Layer"
            GovToken[GovernanceToken<br/>Voting Power]
            Governance[MosaicalGovernance<br/>DAO Management]
        end
        
        subgraph "Infrastructure"
            Bridge[MosaicalSagaBridge<br/>Cross-chain Bridge]
            MockNFT[MockGameNFT<br/>Test NFT Contract]
        end
    end
    
    User --> NFTVault
    User --> DPOToken
    User --> LoanManager
    User --> Governance
    GameFi --> NFTVault
    CrossChain --> Bridge
    
    NFTVault --> Oracle
    NFTVault --> DPOToken
    LoanManager --> NFTVault
    LoanManager --> DPOToken
    Governance --> GovToken
    Bridge --> NFTVault
    
    style NFTVault fill:#ff9999
    style DPOToken fill:#99ccff
    style LoanManager fill:#99ff99
    style Oracle fill:#ffcc99
    style Governance fill:#cc99ff
```

## 🔄 Functional Diagram

```mermaid
flowchart TD
    subgraph "NFT Deposit Flow"
        A[User Deposits NFT] --> B[Risk Assessment]
        B --> C[Calculate Collateral Value]
        C --> D[Mint DPO Tokens]
        D --> E[Update Vault Records]
    end
    
    subgraph "Lending Flow"
        F[Request Loan] --> G[Check Collateral]
        G --> H[Calculate LTV Ratio]
        H --> I[Approve/Reject Loan]
        I --> J[Disburse Funds]
    end
    
    subgraph "Interest & Liquidation"
        K[Accrue Interest] --> L[Monitor Health Factor]
        L --> M{Health Factor < 1?}
        M -->|Yes| N[Trigger Liquidation]
        M -->|No| O[Continue Monitoring]
        N --> P[Sell Collateral]
        P --> Q[Repay Debt]
    end
    
    subgraph "Governance Flow"
        R[Create Proposal] --> S[Voting Period]
        S --> T[Vote Counting]
        T --> U{Quorum Met?}
        U -->|Yes| V[Execute Proposal]
        U -->|No| W[Proposal Fails]
    end
    
    E --> F
    J --> K
    D --> R
    
    style A fill:#e1f5fe
    style F fill:#f3e5f5
    style K fill:#fff3e0
    style R fill:#e8f5e8
```

## 🎯 Use Case Diagram

### System Level Use Cases

```mermaid
graph LR
    subgraph "Actors"
        NFTHolder[NFT Holder]
        Borrower[Borrower]
        Lender[Lender/DPO Holder]
        Governance[DAO Member]
        Oracle[Oracle Provider]
        Admin[System Admin]
    end
    
    subgraph "System Use Cases"
        UC1[Deposit NFT as Collateral]
        UC2[Withdraw NFT]
        UC3[Borrow Against NFT]
        UC4[Repay Loan]
        UC5[Liquidate Position]
        UC6[Trade DPO Tokens]
        UC7[Earn Interest]
        UC8[Create Governance Proposal]
        UC9[Vote on Proposal]
        UC10[Update Price Feeds]
        UC11[Manage Risk Parameters]
        UC12[Bridge Assets]
    end
    
    NFTHolder --> UC1
    NFTHolder --> UC2
    Borrower --> UC3
    Borrower --> UC4
    Lender --> UC5
    Lender --> UC6
    Lender --> UC7
    Governance --> UC8
    Governance --> UC9
    Oracle --> UC10
    Admin --> UC11
    NFTHolder --> UC12
    
    style NFTHolder fill:#ffebee
    style Borrower fill:#e3f2fd
    style Lender fill:#e8f5e8
    style Governance fill:#f3e5f5
```

### Function Use Cases

#### NFT Vault Use Cases

```mermaid
graph LR
    subgraph "Actors"
        NFTHolder[NFT Holder]
        LoanManager[Loan Manager]
        Oracle[Oracle System]
        Admin[Vault Admin]
    end
    
    subgraph "NFT Vault Functions"
        UC1[depositNFT]
        UC2[withdrawNFT]
        UC3[calculateCollateralValue]
        UC4[updateRiskTier]
        UC5[liquidatePosition]
        UC6[setCollateralFactor]
        UC7[pauseVault]
        UC8[updateOracle]
    end
    
    NFTHolder --> UC1
    NFTHolder --> UC2
    LoanManager --> UC3
    LoanManager --> UC5
    Oracle --> UC3
    Admin --> UC4
    Admin --> UC6
    Admin --> UC7
    Admin --> UC8
    
    style NFTHolder fill:#e3f2fd
    style LoanManager fill:#f3e5f5
    style Oracle fill:#fff3e0
    style Admin fill:#e8f5e8
```

#### DPO Token Use Cases

```mermaid
graph LR
    subgraph "Actors"
        TokenHolder[DPO Token Holder]
        Trader[Trader]
        LoanManager[Loan Manager]
        InterestDistributor[Interest Distributor]
        Minter[Authorized Minter]
    end
    
    subgraph "DPO Token Functions"
        UC1[mint]
        UC2[burn]
        UC3[transfer]
        UC4[distributeInterest]
        UC5[claimInterest]
        UC6[placeBuyOrder]
        UC7[placeSellOrder]
        UC8[authorizeMinter]
        UC9[mintOnLoan]
    end
    
    TokenHolder --> UC2
    TokenHolder --> UC3
    TokenHolder --> UC5
    Trader --> UC6
    Trader --> UC7
    LoanManager --> UC9
    InterestDistributor --> UC4
    Minter --> UC1
    Minter --> UC8
    
    style TokenHolder fill:#e1f5fe
    style Trader fill:#f1f8e9
    style LoanManager fill:#fce4ec
    style InterestDistributor fill:#fff8e1
    style Minter fill:#f3e5f5
```

#### Loan Manager Use Cases

```mermaid
graph LR
    subgraph "Actors"
        Borrower[Borrower]
        Lender[Lender]
        Liquidator[Liquidator]
        RiskManager[Risk Manager]
        Oracle[Oracle Provider]
    end
    
    subgraph "Loan Manager Functions"
        UC1[createLoan]
        UC2[repayLoan]
        UC3[calculateInterest]
        UC4[liquidate]
        UC5[updateHealthFactor]
        UC6[updateInterestRate]
        UC7[pauseLending]
        UC8[setLiquidationThreshold]
        UC9[emergencyWithdraw]
    end
    
    Borrower --> UC1
    Borrower --> UC2
    Lender --> UC3
    Liquidator --> UC4
    RiskManager --> UC5
    RiskManager --> UC6
    RiskManager --> UC7
    RiskManager --> UC8
    Oracle --> UC5
    Borrower --> UC9
    
    style Borrower fill:#e8f5e8
    style Lender fill:#e3f2fd
    style Liquidator fill:#ffebee
    style RiskManager fill:#f3e5f5
    style Oracle fill:#fff3e0
```

#### Governance System Use Cases

```mermaid
graph LR
    subgraph "Actors"
        TokenHolder[Governance Token Holder]
        Proposer[Proposal Creator]
        Voter[Voter]
        Delegate[Delegate]
        Executor[Proposal Executor]
    end
    
    subgraph "Governance Functions"
        UC1[createProposal]
        UC2[vote]
        UC3[executeProposal]
        UC4[delegate]
        UC5[updateQuorum]
        UC6[cancelProposal]
        UC7[queueProposal]
        UC8[getCurrentVotes]
        UC9[getPriorVotes]
    end
    
    TokenHolder --> UC4
    TokenHolder --> UC8
    Proposer --> UC1
    Proposer --> UC6
    Voter --> UC2
    Voter --> UC9
    Delegate --> UC2
    Executor --> UC3
    Executor --> UC5
    Executor --> UC7
    
    style TokenHolder fill:#e8f5e8
    style Proposer fill:#e3f2fd
    style Voter fill:#fff3e0
    style Delegate fill:#f3e5f5
    style Executor fill:#ffebee
```

#### GameFi Oracle Use Cases

```mermaid
graph LR
    subgraph "Actors"
        OracleOperator[Oracle Operator]
        PriceFeedProvider[Price Feed Provider]
        UtilityAnalyst[Utility Analyst]
        DataValidator[Data Validator]
        Consumer[Oracle Consumer]
    end
    
    subgraph "Oracle Functions"
        UC1[updatePrice]
        UC2[updateUtilityScore]
        UC3[getCollectionMetrics]
        UC4[validatePrice]
        UC5[addPriceFeed]
        UC6[removePriceFeed]
        UC7[setValidationThreshold]
        UC8[emergencyPause]
        UC9[getLatestPrice]
    end
    
    OracleOperator --> UC5
    OracleOperator --> UC6
    OracleOperator --> UC7
    OracleOperator --> UC8
    PriceFeedProvider --> UC1
    UtilityAnalyst --> UC2
    DataValidator --> UC4
    Consumer --> UC3
    Consumer --> UC9
    
    style OracleOperator fill:#e8f5e8
    style PriceFeedProvider fill:#e3f2fd
    style UtilityAnalyst fill:#fff3e0
    style DataValidator fill:#f3e5f5
    style Consumer fill:#ffebee
```

#### Bridge System Use Cases

```mermaid
graph LR
    subgraph "Actors"
        User[Bridge User]
        Validator[Bridge Validator]
        Relayer[Cross-chain Relayer]
        BridgeOperator[Bridge Operator]
        SecurityCouncil[Security Council]
    end
    
    subgraph "Bridge Functions"
        UC1[bridgeToChain]
        UC2[receiveFromChain]
        UC3[validateBridge]
        UC4[claimBridgedAsset]
        UC5[pauseBridge]
        UC6[updateValidator]
        UC7[setMinimumConfirmations]
        UC8[emergencyWithdraw]
        UC9[getBridgeStatus]
    end
    
    User --> UC1
    User --> UC4
    User --> UC9
    Validator --> UC3
    Relayer --> UC2
    BridgeOperator --> UC5
    BridgeOperator --> UC6
    BridgeOperator --> UC7
    SecurityCouncil --> UC8
    
    style User fill:#e8f5e8
    style Validator fill:#e3f2fd
    style Relayer fill:#fff3e0
    style BridgeOperator fill:#f3e5f5
    style SecurityCouncil fill:#ffebee
```

## 🏗️ Class Diagram

```mermaid
classDiagram
    class NFTVaultV3 {
        +mapping nftDeposits
        +mapping collateralValues
        +mapping riskTiers
        +depositNFT(address, uint256)
        +withdrawNFT(address, uint256)
        +calculateCollateralValue(address, uint256)
        +liquidatePosition(address, uint256)
        +updateRiskTier(address, uint8)
    }
    
    class DPOTokenV3 {
        +mapping tokenHoldings
        +mapping claimableInterest
        +mint(address, uint256)
        +burn(uint256)
        +distributeInterest(address, uint256, address, uint256)
        +claimInterest(address, uint256)
        +placeBuyOrder(address, uint256, uint256, uint256)
        +placeSellOrder(address, uint256, uint256, uint256)
    }
    
    class LoanManagerV3 {
        +mapping loans
        +mapping healthFactors
        +createLoan(address, uint256, uint256)
        +repayLoan(uint256)
        +calculateInterest(uint256)
        +liquidate(uint256)
        +updateHealthFactor(uint256)
    }
    
    class GameFiOracleV3 {
        +mapping prices
        +mapping utilityScores
        +mapping collectionMetrics
        +updatePrice(address, uint256)
        +updateUtilityScore(address, uint256)
        +getCollectionMetrics(address)
        +validatePrice(address, uint256)
    }
    
    class MosaicalGovernance {
        +mapping proposals
        +mapping votes
        +uint256 quorum
        +createProposal(string, bytes)
        +vote(uint256, bool)
        +executeProposal(uint256)
        +delegate(address)
    }
    
    class GovernanceToken {
        +mapping delegates
        +mint(address, uint256)
        +burn(uint256)
        +delegate(address)
        +getCurrentVotes(address)
    }
    
    class MosaicalSagaBridge {
        +mapping bridgedAssets
        +bridgeToChain(address, uint256, uint256)
        +receiveFromChain(bytes)
        +validateBridge(bytes32)
    }
    
    NFTVaultV3 --> DPOTokenV3 : mints
    NFTVaultV3 --> GameFiOracleV3 : queries
    LoanManagerV3 --> NFTVaultV3 : manages
    LoanManagerV3 --> DPOTokenV3 : borrows
    MosaicalGovernance --> GovernanceToken : uses
    MosaicalSagaBridge --> NFTVaultV3 : deposits
```

## 🗄️ Entity Relationship Diagram

```mermaid
erDiagram
    USER {
        address wallet_address PK
        uint256 governance_tokens
        uint256 dpo_balance
        bool is_authorized_minter
    }
    
    NFT {
        address collection_address PK
        uint256 token_id PK
        address owner
        uint8 risk_tier
        uint256 collateral_value
        uint256 utility_score
        bool is_deposited
    }
    
    LOAN {
        uint256 loan_id PK
        address borrower FK
        address nft_collection FK
        uint256 nft_token_id FK
        uint256 principal_amount
        uint256 interest_rate
        uint256 start_time
        uint256 last_update
        uint256 health_factor
        bool is_active
    }
    
    DPO_TOKEN {
        address collection FK
        uint256 token_id FK
        address holder FK
        uint256 amount
        uint256 claimable_interest
    }
    
    GOVERNANCE_PROPOSAL {
        uint256 proposal_id PK
        address proposer FK
        string description
        bytes execution_data
        uint256 start_block
        uint256 end_block
        uint256 for_votes
        uint256 against_votes
        bool executed
    }
    
    PRICE_FEED {
        address collection FK
        uint256 floor_price
        uint256 last_update
        uint256 volume_24h
        uint256 holder_count
        bool is_active
    }
    
    BRIDGE_TRANSACTION {
        bytes32 transaction_hash PK
        address sender FK
        address nft_collection FK
        uint256 nft_token_id FK
        uint256 source_chain
        uint256 destination_chain
        bool is_completed
    }
    
    USER ||--o{ LOAN : creates
    USER ||--o{ DPO_TOKEN : holds
    USER ||--o{ GOVERNANCE_PROPOSAL : proposes
    NFT ||--|| LOAN : secures
    NFT ||--o{ DPO_TOKEN : fractionalized_into
    NFT ||--|| PRICE_FEED : priced_by
    NFT ||--o{ BRIDGE_TRANSACTION : bridges
    LOAN ||--o{ DPO_TOKEN : generates
```

## 🌐 Network Information

### Saga Chainlet (devpros)
- **Network Name**: devpros
- **Chain ID**: 2749656616387000
- **RPC URL**: `https://devpros-2749656616387000-1.jsonrpc.sagarpc.io`
- **WebSocket**: `https://devpros-2749656616387000-1.ws.sagarpc.io`
- **Block Explorer**: `https://devpros-2749656616387000-1.sagaexplorer.io`

## 📋 Contract Addresses (Latest Deployment)

```json
{
  "MockGameNFT": "0xf92cd1A59e682a9Fb66f0145e5a8834cF79DA3Ea",
  "GovernanceToken": "0x035F76ef9Ca49fabCA7d6828018aAF491Ae52508",
  "GameFiOracleV3": "0x85dBc00b8F20A827820263aBC1Db8e8E48366FA2",
  "NFTVaultV3": "0x9B48478e076458E33Cef1aE2F07CF4E90723b7aa",
  "MosaicalGovernance": "0xE88278b409E72Da42C3E7b761a5fca9483303A53",
  "DPOTokenV3": "0x6Dc8eA402977576153d0Fabbc7C496765540bc7d",
  "LoanManagerV3": "0x9c1378C1993367cD5641bf2813AE14B95B581C73",
  "MosaicalSagaBridge": "0x050523005E61BD90780b545d65789d68DA86727f"
}
```

All contracts have been successfully verified on the Saga Explorer and are ready for interaction.

## 🏗️ Project Structure

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
│   ├── deploy.js           # Main deployment script
│   ├── deploy-with-json.js # Deployment with JSON output
│   ├── verify.js           # Contract verification
│   ├── flatten.js          # Contract flattening
│   └── compile.js          # Contract compilation
├── test/                   # Test files
├── deployments/            # Deployment records
├── flattened/              # Flattened contracts for verification
└── .env.example           # Environment template
```

## 🚀 Quick Start

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your private key and network settings
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Compile Contracts
```bash
# Using the Compile Contracts workflow
# or manually:
node scripts/compile.js
```

### 4. Deploy Contracts
```bash
# Deploy to Saga chainlet
npx hardhat run scripts/deploy.js --network devpros

# Deploy with JSON output
npx hardhat run scripts/deploy-with-json.js --network devpros
```

### 5. Verify Contracts
```bash
# Flatten contracts first
node scripts/flatten.js

# Run verification script
npx hardhat run scripts/verify.js --network devpros
```

### 6. Run Tests
```bash
npx hardhat test
```

## 🔧 Available Workflows

| Workflow | Description |
|----------|-------------|
| **Deploy Contracts** | Deploy all contracts to Saga chainlet |
| **Compile Contracts** | Compile smart contracts |
| **Verify Contracts** | Verify contracts on block explorer |
| **Deploy with JSON** | Deploy with JSON output for integration |
| **Run Tests** | Execute test suite |
| **Flatten Contracts** | Generate flattened contracts |

## 💼 Core Functionality

### NFT Vault Operations
- **Deposit NFT**: Lock NFTs to receive borrowing capacity
- **Withdraw NFT**: Reclaim NFTs after loan repayment
- **Risk Assessment**: Multi-tier risk models based on collection type

### Lending Protocol
- **Borrow**: Use NFTs as collateral to borrow DPSV tokens
- **Repay**: Repay loans with accrued interest
- **Liquidation**: Automated liquidation for underwater positions
- **Dynamic Interest**: Interest rates based on utilization and risk

### DPO Token Features
- **Fractionalization**: Represent fractional ownership of NFT portfolios
- **Interest Distribution**: Earn yield from protocol fees
- **Trading**: Buy/sell orders for secondary market liquidity
- **Governance Rights**: Participate in protocol decisions

### Governance System
- **Proposals**: Create proposals for protocol changes
- **Voting**: Token-weighted voting system
- **Execution**: Automated execution of passed proposals
- **Delegation**: Delegate voting power to other addresses

## 🛡️ Security Features

- **Multi-signature** requirements for critical operations
- **Emergency pause** mechanisms
- **Oracle price manipulation** protection
- **Reentrancy guards** on financial functions
- **Liquidation protection** with health factors
- **Risk-based LTV** ratios

## 📈 Risk Management

The protocol implements a 5-tier risk model:

| Tier | Max LTV | Liquidation Threshold | Target Collections |
|------|---------|----------------------|-------------------|
| 1    | 70%     | 80%                  | Blue-chip NFTs    |
| 2    | 65%     | 75%                  | Established GameFi |
| 3    | 60%     | 70%                  | Mid-tier collections |
| 4    | 55%     | 65%                  | New/experimental |
| 5    | 50%     | 60%                  | High-risk assets |

## 🎮 GameFi Integration

- **Utility Scoring**: On-chain utility scoring for GameFi NFTs
- **Collection Metrics**: Volume, holder count, and activity tracking
- **Dynamic Pricing**: Real-time floor price updates
- **Activity Monitoring**: Track in-game utility and engagement

## 🌉 Cross-chain Capabilities

- **Asset Bridging**: Transfer NFTs between supported chains
- **Unified Liquidity**: Cross-chain liquidity pools
- **Multi-chain Support**: Expandable to other blockchain networks
- **LayerZero Integration**: Secure cross-chain messaging

## 🧪 Testing

The project includes comprehensive tests covering:
- Contract deployment and initialization
- NFT deposit and withdrawal flows
- Lending and borrowing operations
- Governance proposal and voting
- Oracle price updates
- Bridge functionality

## 📝 Environment Variables

Required environment variables (see `.env.example`):

```bash
# Network Configuration
NETWORK=devpros
RPC_URL=https://devpros-2749656616387000-1.jsonrpc.sagarpc.io
PRIVATE_KEY=your_private_key_here

# Chainlet Information
CHAINLET_ID=devpros_2749656616387000-1
BLOCK_EXPLORER=https://devpros-2749656616387000-1.sagaexplorer.io
```

## 🔗 Links

- **Block Explorer**: [Saga Explorer](https://devpros-2749656616387000-1.sagaexplorer.io)
- **Deployment Records**: [saga-deployment.json](./deployments/saga-deployment.json)
- **Contract Source**: [Verified Contracts](https://devpros-2749656616387000-1.sagaexplorer.io)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the deployment logs in `/deployments`
- Review contract interactions on Saga Explorer

---

*Built with ❤️ on Saga Chainlet - Powering the future of decentralized NFT finance*