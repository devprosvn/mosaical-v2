
# Solidity Smart Contract Project

Dự án smart contract được tổ chức với cấu trúc thư mục chuẩn và scripts JavaScript để deploy.

## Cấu trúc thư mục

```
├── contracts/          # Smart contracts (.sol files)
├── scripts/            # JavaScript scripts for compilation, deployment, interaction
├── build/              # Compiled contract artifacts
├── deployments/        # Deployment information
├── .env.example        # Environment variables template
└── README.md
```

## Cài đặt

Dependencies đã được cài đặt tự động. Tạo file environment:

```bash
cp .env.example .env
```

## Sử dụng

### 1. Compile contracts
```bash
node scripts/compile.js
```

### 2. Deploy contracts
```bash
node scripts/deploy.js
```

### 3. Interact with deployed contract
```bash
node scripts/interact.js
```

## Scripts

- `scripts/compile.js` - Biên dịch smart contracts
- `scripts/deploy.js` - Deploy contracts lên blockchain
- `scripts/interact.js` - Tương tác với deployed contracts

## Contract Features

Contract mẫu `MyContract` bao gồm:
- Message storage với owner-only update
- Counter có thể increment bởi bất kỳ ai
- Events cho các actions
- OpenZeppelin Ownable integration

## Environment Variables

- `NETWORK` - Tên network (localhost, sepolia, mainnet, etc.)
- `RPC_URL` - URL của blockchain node
- `PRIVATE_KEY` - Private key của deployer wallet

**Lưu ý**: Không bao giờ commit private key thật vào git!
