# Phát Triển và Testing Mosaical DeFi trên devpros chainlet

Tài liệu này giải thích quy trình phát triển và kiểm thử Mosaical DeFi trên devpros chainlet, một môi trường blockchain bền vững (persistent).

## Sự khác biệt: localhost vs. devpros Chainlet

| Môi trường | Đặc tính | Ưu điểm | Nhược điểm |
|------------|----------|---------|------------|
| **localhost** | Tạm thời (Ephemeral) | - Cực nhanh <br>- Reset về trạng thái sạch sau mỗi lần chạy <br>- Hoàn hảo cho unit test tự động | - Mất toàn bộ dữ liệu khi tắt <br>- Gây ra lỗi "mất NFT", "mất giá oracle" khi khởi động lại |
| **devpros Chainlet** | Bền vững (Persistent) | - Dữ liệu được lưu trữ vĩnh viễn <br>- Phản ánh chính xác môi trường sản phẩm thật <br>- Hoàn hảo để test frontend và tích hợp | - Giao dịch chậm hơn localhost |

## Quy Trình Làm Việc Mới trên Chainlet devpros

Quy trình làm việc được chia làm hai giai đoạn: **"Thiết lập một lần"** và **"Phát triển hàng ngày"**.

### Giai Đoạn 1: Thiết Lập Ban Đầu (Làm một lần duy nhất)

Đây là giai đoạn bạn chuẩn bị môi trường trên chainlet. Bạn chỉ cần thực hiện các bước này một lần duy nhất.

1. **Chạy script thiết lập tổng hợp**:

```bash
# Sử dụng Hardhat (khuyến nghị)
npx hardhat run src/scripts/full_setup.js --network devpros

# Hoặc sử dụng phiên bản direct
node src/scripts/direct_full_setup.js
```

Script này sẽ:
- Triển khai tất cả smart contract
- Khởi tạo các tham số (giá oracle, risk tier...)
- Thêm thanh khoản vào NFTVault
- Mint 5 NFT thử nghiệm vào ví của bạn
- Lưu thông tin triển khai vào `src/deployments/devpros-deployment.json`

2. **Cập nhật địa chỉ contract trong frontend**:

```javascript
// frontend/src/constants/contracts.js
export const CONTRACT_ADDRESSES = {
  //  Addresses inserted automatically by deployment script (file is git-ignored)
  NFTVault: "<redacted>",
  DPOToken: "<redacted>",
  GameFiOracle: "<redacted>",
  MosaicalGovernance: "<redacted>",
  MockGameNFT: "<redacted>"
}
```

Sau khi hoàn thành giai đoạn này, chainlet devpros của bạn đã có:
- Các smart contract đã được triển khai
- Các tham số đã được khởi tạo
- Vault có thanh khoản 1 ETH
- 5 NFT thử nghiệm trong ví admin của bạn
- **Và quan trọng nhất: tất cả dữ liệu này sẽ được lưu lại vĩnh viễn**

### Giai Đoạn 2: Phát Triển Hàng Ngày

Đây là quy trình bạn sẽ lặp lại mỗi ngày:

1. **Khởi động Frontend**:
```bash
cd frontend && npm run dev
```

2. **Kết nối MetaMask**:
   - Mở DApp trên trình duyệt
   - Kết nối ví MetaMask của bạn (đảm bảo đã chọn mạng devpros)
   - **NFT sẽ có sẵn trong ví để bạn deposit**
   - **Vault đã có thanh khoản và Oracle đã có giá, nên nút "Borrow" sẽ hoạt động**

3. **Khi cần thêm NFT**:
```bash
# Sử dụng script mint riêng
node src/scripts/direct_mint_nft_simple_raw.js

# Hoặc sử dụng giao diện Admin trên frontend
```

## Xử lý vấn đề "Please connect your wallet"

Vấn đề "Please connect your wallet" không liên quan đến việc sử dụng localhost hay devpros, đây là vấn đề trong code React của frontend:

1. **Sử dụng React Context**: Đảm bảo `Web3Provider` đã bọc toàn bộ ứng dụng:
```jsx
// frontend/src/App.jsx
import { Web3Provider } from './contexts/Web3Context';

function App() {
  return (
    <Web3Provider>
      {/* App components */}
    </Web3Provider>
  );
}
```

2. **Sử dụng hook useWeb3**: Các trang con cần truy cập trạng thái kết nối ví:
```jsx
// frontend/src/pages/SomePage.jsx
import { useWeb3 } from '../hooks/useWeb3';

function SomePage() {
  const { account, isConnected } = useWeb3();
  
  return (
    <>
      {!isConnected ? (
        <p>Please connect your wallet</p>
      ) : (
        <p>Connected: {account}</p>
      )}
    </>
  );
}
```

## Các lệnh hữu ích cho devpros

### Khi cần thêm NFT để test:
```bash
node src/scripts/direct_mint_nft_simple_raw.js
```

### Nếu cần cập nhật giá oracle:
```bash
node src/scripts/direct_update_oracle_raw.js
```

### Nếu cần thêm thanh khoản:
```bash
node src/scripts/direct_add_liquidity_raw.js
```

### Kiểm tra NFTs bạn sở hữu:
```bash
node src/scripts/direct_check_nfts_raw.js
```

## Kết luận

Chuyển từ localhost sang devpros chainlet là một quyết định đúng đắn để khắc phục các vấn đề về dữ liệu bị mất khi khởi động lại. Bạn chỉ cần chạy script thiết lập một lần duy nhất, sau đó dữ liệu sẽ được lưu trữ vĩnh viễn trên chainlet.

Các script "direct" không phụ thuộc vào Hardhat runtime, cho phép bạn tương tác trực tiếp với blockchain mà không cần môi trường Hardhat đầy đủ. Điều này đặc biệt hữu ích trong trường hợp bạn cần chạy script từ môi trường không có Hardhat. 