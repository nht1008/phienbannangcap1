// Test script để kiểm tra hệ thống lịch sử công nợ
// Chạy trong console của trình duyệt

// Test 1: Log debt creation
logDebtCreation(
  'test-customer-id',
  'Nguyễn Văn Test', 
  500000, 
  'test-employee-id', 
  'Nhân viên Test',
  'test-invoice-id',
  'Tiền mặt'
).then(() => console.log('✅ Test debt creation logged successfully'))
.catch(err => console.error('❌ Error logging debt creation:', err));

// Test 2: Log debt payment  
logDebtPayment(
  'test-customer-id',
  'Nguyễn Văn Test',
  200000,
  300000, 
  'test-employee-id',
  'Nhân viên Test',
  'Thanh toán một phần',
  'test-debt-id'
).then(() => console.log('✅ Test debt payment logged successfully'))
.catch(err => console.error('❌ Error logging debt payment:', err));

// Test 3: Log debt cancellation
logDebtCancellation(
  'test-customer-id',
  'Nguyễn Văn Test',
  300000,
  'test-employee-id', 
  'Nhân viên Test',
  'Hủy do trả hàng',
  'test-debt-id',
  'test-invoice-id'
).then(() => console.log('✅ Test debt cancellation logged successfully'))
.catch(err => console.error('❌ Error logging debt cancellation:', err));
