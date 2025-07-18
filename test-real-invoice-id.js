// Test script để kiểm tra các dialog lịch sử công nợ
// Chạy trong console của trình duyệt

console.log('🔍 KIỂM TRA CÁC DIALOG LỊCH SỬ CÔNG NỢ');

// Tạo test data với ID thực tế
const testInvoiceId = '-OVOYYp-YHKpyIjPuUK7'; // ID thực như bạn đề cập
const testCustomerId = 'test-customer-real-id';

console.log('📋 Test với Invoice ID:', testInvoiceId);

// Test 1: Tạo debt creation với invoice ID thực
logDebtCreation(
  testCustomerId,
  'Khách Test ID Thực', 
  800000, 
  'emp-real-test', 
  'Nhân viên Test Thực',
  testInvoiceId,
  'Tiền mặt'
).then(() => {
  console.log('✅ Debt creation logged');
  console.log('🔍 Expected to see in debt history:');
  console.log('   - Notes: "Tạo công nợ từ hóa đơn ' + testInvoiceId + '"');
  console.log('   - Display: "HĐ: ' + testInvoiceId + '"');
})
.catch(err => console.error('❌ Error in debt creation:', err));

// Test 2: Tạo payment sau 3 giây
setTimeout(() => {
  logDebtPayment(
    testCustomerId,
    'Khách Test ID Thực',
    300000,
    500000, // Còn lại 500k
    'emp-real-test',
    'Nhân viên Test Thực',
    'Thanh toán trực tiếp tại cửa hàng',
    'debt-real-test-123'
  ).then(() => {
    console.log('✅ Debt payment logged');
    console.log('🔍 Expected to see PAYMENT entry in debt history');
  })
  .catch(err => console.error('❌ Error in debt payment:', err));
}, 3000);

// Test 3: Hướng dẫn kiểm tra
setTimeout(() => {
  console.log(`
🧪 HƯỚNG DẪN KIỂM TRA CHI TIẾT:

1. **Kiểm tra dialog đúng:**
   - Từ tab "Công nợ" 
   - Click nút "Lịch sử" (NOT "Toàn bộ LS")
   - Đảm bảo dialog title là "Lịch sử công nợ - [Tên khách hàng]"

2. **Những gì cần thấy:**
   ✅ Hành động "Tạo nợ" với invoice ID: ${testInvoiceId}
   ✅ Hành động "Thanh toán" với số tiền: 300,000 VNĐ
   ✅ Nợ còn lại: 500,000 VNĐ

3. **Nếu không thấy payment:**
   - Kiểm tra Firebase Database tab "debtHistory"
   - Tìm entries với customerId: "${testCustomerId}"
   - Xem có entry action "PAYMENT" không

4. **Nếu vẫn thấy #JPUUK7:**
   - Có thể đang xem dialog khác (CustomerDebtTab dialog)
   - Thử click nút khác hoặc refresh trang
   - Kiểm tra console có error không
  `);
}, 5000);

// Helper: Kiểm tra dialog nào đang mở
console.log(`
💡 TIPS PHÂN BIỆT DIALOG:

📋 CustomerDebtHistoryDialog (ĐÚNG - đã sửa):
   - Title: "Lịch sử công nợ - [Tên KH]"
   - Có 3 ô tổng quan: Tổng nợ đã tạo | Đã thanh toán | Còn lại
   - Hiển thị toàn bộ ID: HĐ: ${testInvoiceId}

📋 CustomerDebtTab Dialog (CŨ - chưa sửa):
   - Title: "Lịch sử công nợ #XXXXXX" 
   - Hiển thị cards màu đỏ/xanh
   - Vẫn dùng #JPUUK7 format

Đảm bảo bạn đang xem dialog ĐÚNG!
`);
