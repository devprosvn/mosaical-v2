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
  subgraph Browser
    A[React + Vite UI] --Ethers.js--> RPC((JSON-RPC))
  end

  subgraph Chainlet
    RPC --> NFTVault[NFTVaultV3]
    RPC --> DPO[DPOTokenV3]
    RPC --> Oracle[GameFiOracleV3]
    RPC --> Gov[GovernanceToken]\nMosaicalGovernance
  end

  A --REST--> Alchemy((NFT Metadata API))
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
  User --1. deposit--> Vault
  Vault --2. verify & hold--> NFT[NFT custody]
  User --3. borrow DPSV--> Vault
  Vault --4. mint--> DPO
  User --5. repay--> Vault
  Vault --6. burn DPO & return NFT--> User
```

---
## 5. Use-case diagrams
### 5.1 Overall actors
```mermaid
actor User
actor Admin
actor Liquidator
usecase UC1 as "Deposit NFT"
usecase UC2 as "Borrow"
usecase UC3 as "Repay"
usecase UC4 as "Trade DPO"
usecase UC5 as "Liquidate"
User -- UC1
User -- UC2
User -- UC3
User -- UC4
Liquidator -- UC5
Admin -- UC5
```

### 5.2 User-centric
```mermaid
... (omitted for brevity)
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