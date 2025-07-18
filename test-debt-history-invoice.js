// Test script để kiểm tra việc hiển thị thông tin hóa đơn trong lịch sử công nợ
// Chạy trong console của trình duyệt

console.log('🧪 Testing debt history invoice information...');

// Test 1: Tạo debt creation với invoice ID
logDebtCreation(
  'test-customer-invoice',
  'Nguyễn Văn Test Invoice', 
  750000, 
  'emp-123', 
  'Nhân viên Test',
  'invoice-abcd1234efgh', // ID hóa đơn cụ thể
  'Tiền mặt'
).then(() => {
  console.log('✅ Test debt creation with invoice logged successfully');
  console.log('📝 Expected note: "Tạo công nợ từ hóa đơn 1234efgh"');
  console.log('📋 Expected invoiceId display: "HĐ: 1234efgh"');
})
.catch(err => console.error('❌ Error logging debt creation with invoice:', err));

// Test 2: Tạo debt creation không có invoice ID (nhập hàng)
logDebtCreation(
  'test-supplier-import',
  'Nhà cung cấp Test', 
  500000, 
  'emp-123', 
  'Nhân viên Test'
  // Không có invoiceId và paymentMethod
).then(() => {
  console.log('✅ Test debt creation without invoice logged successfully');
  console.log('📝 Expected note: "Tạo công nợ từ nhập hàng"');
  console.log('📋 Expected no invoiceId display');
})
.catch(err => console.error('❌ Error logging debt creation without invoice:', err));

// Test 3: Tạo debt payment có invoice ID
logDebtPayment(
  'test-customer-invoice',
  'Nguyễn Văn Test Invoice',
  300000,
  450000, // Còn lại 450k
  'emp-123',
  'Nhân viên Test',
  'Thanh toán một phần cho hóa đơn',
  'debt-xyz789'
).then(() => {
  console.log('✅ Test debt payment logged successfully');
  console.log('📝 Expected note: "Thanh toán một phần cho hóa đơn"');
})
.catch(err => console.error('❌ Error logging debt payment:', err));

console.log('🔍 Sau khi chạy test, kiểm tra dialog "Lịch sử công nợ" cho khách hàng để xem:');
console.log('1. Mục "Tạo nợ" có hiển thị đầy đủ thông tin hóa đơn không');
console.log('2. Có hiển thị mã hóa đơn (HĐ: xxxxxx) cho cả CREATE_DEBT và PAYMENT không');
console.log('3. Ghi chú có chi tiết và dễ hiểu không');
