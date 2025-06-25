# Mosaical DeFi – Dynamic Yield-Backed NFT Financing

Mosaical is a GameFi–focused lending protocol that unlocks liquidity from in-game NFTs.  Depositors collateralise NFTs in the `NFTVaultV3` contract and borrow native chain currency (DPSV).  When a loan is opened the vault mints DPO (Debt Position Ownership) ERC-20 tokens that fractionalise the debt, making it tradable and enabling sophisticated secondary-market risk transfer.

---
## 0. Quick links

* 🖥 Demo front-end ‑ `frontend/`
* 🛠 Smart contracts ‑ `src/contracts/`

---
## 1. System architecture  _(design-first)_
```mermaid
flowchart TD
  %%--- Client Layer ---%%
  subgraph "Browser"
    UI["React + Vite UI"] -- "ethers.js" --> RPC["JSON-RPC"]
  end

  %%--- On-chain Layer ---%%
  subgraph "Smart-Contracts"
    RPC --> Vault[NFTVaultV3]
    RPC --> DPO[DPOTokenV3]
    RPC --> Oracle[GameFiOracleV3]
    RPC --> GovToken[GovernanceToken]
    RPC --> Gov[MosaicalGovernance]
  end

  UI -- "REST" --> Alchemy["Alchemy NFT Metadata API"]
```

---
## 2. Entity–Relationship Diagram (ERD)
```mermaid
erDiagram
  NFTDeposit ||--|| NFT : "1:1"
  NFTDeposit {
    address owner
    uint depositTime
    bool  isActive
  }
  Loan ||--|| NFT : "1:1"
  Loan {
    uint amount
    uint startTime
    uint interestRate
    bool isActive
  }
  DPO_Token_Holding ||--|{ Loan : fractionalises
  DPO_Token_Holding {
    address holder
    uint balance
  }
```

---
## 3. Class diagram
```mermaid
classDiagram
  class NFTVaultV3 {
    +depositNFT()
    +withdrawNFT()
    +borrow()
    +repayLoan()
    +liquidate()
    +getUserPosition()
  }
  class GameFiOracleV3 {
    +updateFloorPrice()
    +getFloorPrice()
    +updateUtilityScore()
  }
  class DPOTokenV3 {
    +mintOnLoan()
    +tradeDPOTokens()
    +distributeInterest()
  }
  NFTVaultV3 --> DPOTokenV3 : mints
  NFTVaultV3 --> GameFiOracleV3 : queries
```

---
## 4. Functional flow
```mermaid
flowchart LR
  User -- "deposit" --> Vault
  Vault -- "verify & hold" --> NFT[NFT custody]
  User -- "borrow DPSV" --> Vault
  Vault -- "mint" --> DPO
  User -- "repay" --> Vault
  Vault -- "burn & return" --> User
```

---
## 5. Use-case diagrams
### 5.1 Overall actors
```mermaid
flowchart LR
  %% Actors %%
  user((User))
  admin((Admin))
  liq((Liquidator))

  %% Use-cases (ellipses) %%
  ucDeposit(("Deposit NFT"))
  ucBorrow((Borrow))
  ucRepay((Repay))
  ucTrade(("Trade DPO"))
  ucLiquidate((Liquidate))

  %% Relationships %%
  user --> ucDeposit
  user --> ucBorrow
  user --> ucRepay
  user --> ucTrade
  liq  --> ucLiquidate
  admin --> ucLiquidate
```

### 5.2 User-centric
```mermaid
flowchart LR
  %% Individual actor view – Borrower %%
  subgraph Borrower
    borrower((Borrower))
    bcDeposit((Deposit NFT))
    bcBorrow((Borrow))
    bcRepay((Repay))
    borrower --> bcDeposit
    borrower --> bcBorrow
    borrower --> bcRepay
  end

  %% Individual actor view – Lender/DPO Holder %%
  subgraph Lender
    lender((DPO Holder))
    lcTrade((Trade DPO))
    lcEarn((Claim Interest))
    lender --> lcTrade
    lender --> lcEarn
  end

  %% Individual actor view – Admin %%
  subgraph Admin
    adminActor((Admin))
    acUpdateOracle((Update Oracle))
    acManageParam((Manage Parameters))
    adminActor --> acUpdateOracle
    adminActor --> acManageParam
  end

  %% Individual actor view – Liquidator %%
  subgraph Liquidator
    liquidator((Liquidator))
    lcLiquidate((Liquidate))
    liquidator --> lcLiquidate
  end
```

---
## 6. Sequence – Borrow happy-path
```mermaid
sequenceDiagram
  participant U as User
  participant UI as Front-end
  participant V as NFTVaultV3
  participant DPO as DPOTokenV3
  U->>UI: click "Borrow"
  UI->>V: borrow(collection,tokenId,amount)
  V-->>DPO: mintOnLoan(...)
  DPO-->>V: tx receipt
  V-->>UI: tx receipt
  UI-->>U: Toast success
```

---
## 7. Functional Decomposition
```mermaid
graph TD
  Lending-->Deposit
  Lending-->Borrow
  Lending-->Repay
  Risk-->Oracle
  Risk-->Liquidation
  Tokenisation-->DPO_Mint
  Tokenisation-->DPO_Trade
```

---
## 8. Checklist
| Feature | Status |
| --- | --- |
| Deposit / Withdraw NFT | ✅ done |
| Borrow & Repay native DPSV | ✅ done |
| DPO token mint on borrow | ✅ done |
| Trade DPO tokens | ✅ done (ERC-20 transfer) |
| Interest distribution | ⏳ pending |
| Liquidation engine | ⏳ pending |
| Governance voting | ❌ not yet |

---
## 9. Results
* End-to-end happy path validated on Devpros chainlet.
* Front-end race conditions fixed; gas exceptions resolved.

---
## 10. Limitations
* Oracle prices manually updated.
* Lack of on-chain order-book for DPO trading.
* Liquidation uses direct caller, no auction.

---
## 11. Road-map / Recommendations
1. Integrate off-chain price oracle (Chainlink, Pyth).
2. Implement Dutch-auction liquidation.
3. Secondary-market AMM pool for DPO tokens.
4. Governance module for protocol parameters.
5. Security audit.

## Các hợp đồng đã triển khai

<!-- Deployment addresses redacted for public repository -->

_Deployment addresses have been moved to `deployments/<env>-deployment.json` which is excluded via `.gitignore`._

## Thông tin mạng

<!-- Network details redacted -->

_Internal test-net parameters (name, RPC, chain ID, explorer) are intentionally omitted from public docs._

## Cách triển khai

Các hợp đồng đã được triển khai bằng cách sử dụng script `deploy-direct.js`. Script này:

1. Kết nối đến mạng Saga Devpros
2. Triển khai các hợp đồng theo thứ tự
3. Thiết lập mối quan hệ giữa các hợp đồng
4. Lưu thông tin triển khai vào file `deployments/devpros-deployment.json`

## Kiểm tra các hợp đồng

Để kiểm tra các hợp đồng đã triển khai, chạy:

```
node scripts/check-contracts.js
```

## Xác minh hợp đồng

Hiện tại, việc xác minh mã nguồn trên trình khám phá khối Saga gặp một số vấn đề. Để xem hướng dẫn xác minh thủ công, chạy:

```
node scripts/verify-manual.js
```

## Các chức năng chính

### MockGameNFT
- NFT trò chơi mẫu để thử nghiệm

### GovernanceToken
- Token quản trị cho hệ thống Mosaical

### GameFiOracleV3
- Oracle cung cấp dữ liệu về NFT trò chơi

### NFTVaultV3
- Kho lưu trữ và quản lý NFT

### MosaicalGovernance
- Hệ thống quản trị cho nền tảng Mosaical

### DPOTokenV3
- Token DPO (Diversified Portfolio Option) cho hệ thống 