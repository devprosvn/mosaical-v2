# Mosaical Contracts

Dự án triển khai các hợp đồng thông minh của Mosaical trên blockchain Saga.

## Các hợp đồng đã triển khai

Các hợp đồng đã được triển khai thành công trên mạng Saga Devpros:

| Hợp đồng | Địa chỉ |
|----------|---------|
| MockGameNFT | 0xA8fc1f266681D7CD36A1E52ED8ab748FA6ec6Cd4 |
| GovernanceToken | 0xf5FCc34d39AE6DfD64AbB2f233661EeC537F0A5a |
| GameFiOracleV3 | 0xC3909e244d760A2A28f1628ed0DEFBB0E8531548 |
| NFTVaultV3 | 0x164509509cB2cE921eBD997F487A0f7746BF3545 |
| MosaicalGovernance | 0x6243d21F1b3b8d54C842A7a12e1777A4D31000D3 |
| DPOTokenV3 | 0x6eFF34790FF79EEc0A219397A0FA27A3282CEea0 |

## Thông tin mạng

- **Mạng**: Saga Devpros
- **Chainlet ID**: devpros_2749656616387000-1
- **RPC URL**: https://devpros-2749656616387000-1.jsonrpc.sagarpc.io
- **Trình khám phá khối**: https://devpros-2749656616387000-1.sagaexplorer.io

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