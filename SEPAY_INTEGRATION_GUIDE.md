# Hướng dẫn tích hợp SePay Auto Payment

## Tổng quan

SePay là dịch vụ theo dõi chuyển khoản ngân hàng tự động, giúp xác nhận thanh toán ngay lập tức khi khách hàng chuyển khoản.

## Cách hoạt động

1. **Tạo đơn hàng**: Khách hàng tạo đơn hàng và nhận QR code thanh toán
2. **Chuyển khoản**: Khách hàng quét QR hoặc chuyển khoản thủ công
3. **SePay monitoring**: SePay theo dõi giao dịch ngân hàng real-time
4. **Webhook notification**: SePay gửi thông báo đến API webhook của bạn
5. **Auto confirmation**: Hệ thống tự động xác nhận đơn hàng

## Thiết lập

### 1. Đăng ký SePay

1. Truy cập [https://sepay.vn](https://sepay.vn)
2. Đăng ký tài khoản doanh nghiệp
3. Xác thực thông tin ngân hàng
4. Lấy API credentials:
   - API Key
   - Secret Key
   - Webhook Secret

### 2. Cấu hình Environment Variables

Tạo file `.env.local` dựa trên `.env.local.example`:

```bash
# SePay API Configuration
SEPAY_API_URL=https://api.sepay.vn/v1
SEPAY_API_KEY=your_actual_api_key
SEPAY_SECRET_KEY=your_actual_secret_key
SEPAY_WEBHOOK_SECRET=your_actual_webhook_secret

# Bank Account Information
NEXT_PUBLIC_BANK_ACCOUNT_NUMBER=your_bank_account_number
NEXT_PUBLIC_BANK_ACCOUNT_NAME=YOUR_SHOP_NAME
NEXT_PUBLIC_BANK_NAME=Your_Bank_Name
NEXT_PUBLIC_BANK_CODE=BANK_CODE

# Webhook URL
NEXT_PUBLIC_WEBHOOK_URL=https://your-domain.com/api/payment-webhook
```

### 3. Cấu hình Webhook

Sau khi deploy ứng dụng:

1. Cập nhật `NEXT_PUBLIC_WEBHOOK_URL` với domain thật
2. Đăng ký webhook với SePay:

```javascript
import { registerSePayWebhook } from "@/lib/sepay";

// Chạy một lần để đăng ký webhook
await registerSePayWebhook("https://your-domain.com/api/payment-webhook");
```

### 4. Test thanh toán

1. Tạo đơn hàng test
2. Chuyển khoản với nội dung chính xác
3. Kiểm tra webhook logs
4. Xác nhận đơn hàng được cập nhật tự động

## Cấu trúc API

### Webhook Endpoint: `/api/payment-webhook`

**Input từ SePay:**

```json
{
  "transferType": "in",
  "transferAmount": 50000,
  "accountNumber": "0123456789",
  "transferContent": "CK don hang ORDER123456",
  "referenceCode": "FT21234567890",
  "transferTime": "2025-01-18 10:30:45"
}
```

**Xử lý:**

1. Verify signature SePay
2. Extract order ID từ transfer content
3. Validate amount và order
4. Update order status thành "Hoàn thành"
5. Trigger real-time notification

### QR Code Generation

```javascript
import { generateBankQRContent, generatePaymentDescription } from "@/lib/sepay";

const qrContent = generateBankQRContent({
  accountNumber: "0123456789",
  accountName: "SHOP_NAME",
  amount: 50000,
  description: "CK don hang ORDER123456",
  bankCode: "VCB",
});
```

## Luồng Payment

```
[Customer Cart]
    ↓ Place Order
[Create Order] → [Generate QR] → [Show Payment Dialog]
    ↓ Customer pays
[Bank Transfer] → [SePay Detects] → [Webhook Call]
    ↓ Auto confirm
[Update Order Status] → [Notify Customer] → [Complete]
```

## Security

1. **Signature Verification**: Luôn verify webhook signature
2. **Amount Validation**: So sánh amount với order total
3. **Duplicate Prevention**: Check order chưa được thanh toán
4. **Rate Limiting**: Limit webhook calls
5. **Environment Variables**: Không hardcode credentials

## Monitoring

1. **Webhook Logs**: Log tất cả webhook calls
2. **Failed Payments**: Alert khi có lỗi
3. **Transaction History**: Sync với SePay API
4. **Balance Monitoring**: Check account balance

## Troubleshooting

### Webhook không hoạt động

- Check webhook URL accessible
- Verify SePay registration
- Check signature verification
- Review server logs

### Thanh toán không được xác nhận

- Check transfer content format
- Verify order ID extraction
- Check amount matching
- Review Firebase permissions

### QR Code không quét được

- Check bank QR format
- Verify account information
- Test with different banking apps
- Check QR content encoding

## Support

- SePay Documentation: [https://docs.sepay.vn](https://docs.sepay.vn)
- Support Email: support@sepay.vn
- Developer Community: SePay Discord/Telegram groups

## Pricing

SePay thường charge theo:

- Setup fee: One-time
- Monthly subscription: Based on transaction volume
- Transaction fee: Per successful payment

Liên hệ SePay để có pricing chính xác cho business của bạn.
