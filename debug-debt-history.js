// Test script để console.log('✅ Debt creation logged');
console.log('🔍 Expected display: HĐ: ' + testInvoiceId); // Hiển thị toàn bộ IDbug vấn đề lịch sử công nợ
// Chạy trong console của trình duyệt

console.log('🔧 DEBUG: Testing debt history issues...');

// Test 1: Kiểm tra debt creation với invoice ID thực tế
const testInvoiceId = 'invoice-' + Date.now(); // Tạo ID thực tế thay vì #JPUUK7
console.log('📋 Test Invoice ID:', testInvoiceId);

logDebtCreation(
  'test-customer-debug',
  'Khách hàng Debug Test', 
  500000, 
  'emp-test-123', 
  'Nhân viên Debug',
  testInvoiceId,
  'Tiền mặt'
).then(() => {
  console.log('✅ Debt creation logged');
  console.log('🔍 Expected display: #' + testInvoiceId.slice(-6).toUpperCase());
})
.catch(err => console.error('❌ Error in debt creation:', err));

// Test 2: Kiểm tra debt payment
setTimeout(() => {
  logDebtPayment(
    'test-customer-debug',
    'Khách hàng Debug Test',
    200000,
    300000, // Còn lại 300k
    'emp-test-123',
    'Nhân viên Debug',
    'Thanh toán test từ console',
    'debt-test-123'
  ).then(() => {
    console.log('✅ Debt payment logged');
    console.log('🔍 Check if this appears in debt history dialog');
  })
  .catch(err => console.error('❌ Error in debt payment:', err));
}, 2000);

// Test 3: Query debt history để xem dữ liệu
setTimeout(() => {
  console.log('🔍 Querying debt history for customer: test-customer-debug');
  
  // Mô phỏng query tương tự như trong CustomerDebtHistoryDialog
  const { ref, query, orderByChild, equalTo, onValue } = window;
  if (ref && query && orderByChild && equalTo && onValue) {
    const historyQuery = query(
      ref(db, 'debtHistory'),
      orderByChild('customerId'),
      equalTo('test-customer-debug')
    );
    
    onValue(historyQuery, (snapshot) => {
      const data = snapshot.val();
      console.log('📊 Raw debt history data:', data);
      
      if (data) {
        const historyArray = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        console.log('📋 Processed history array:', historyArray);
        
        // Kiểm tra từng entry
        historyArray.forEach((entry, index) => {
          console.log(`📝 Entry ${index + 1}:`, {
            action: entry.action,
            amount: entry.amount,
            remainingDebt: entry.remainingDebt,
            notes: entry.notes,
            invoiceId: entry.invoiceId,
            date: entry.date
          });
        });
      } else {
        console.log('⚠️ No debt history found for this customer');
      }
    });
  } else {
    console.log('❌ Firebase functions not available in this context');
  }
}, 4000);

// Hướng dẫn kiểm tra
console.log(`
🧪 HƯỚNG DẪN KIỂM TRA:

1. Chạy script này
2. Mở dialog "Lịch sử công nợ" cho khách hàng "Khách hàng Debug Test"
3. Kiểm tra:
   - Có hiển thị cả "Tạo nợ" và "Thanh toán" không?
   - Mã hóa đơn có hiển thị đúng format #XXXXXX không?
   - Số tiền còn lại có chính xác không?

4. Nếu không thấy dữ liệu:
   - Kiểm tra console xem có log "🔥 LOGGING DEBT PAYMENT" không
   - Kiểm tra Firebase Database trong tab "debtHistory"
   - Xem log debug từ CustomerDebtHistoryDialog
`);
