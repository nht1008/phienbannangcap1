// Test formatCompactCurrency function
// Demo các case sử dụng

import { formatCompactCurrency } from '@/lib/utils';

// Test cases
const testCases = [
  0,
  500,
  999,
  1000,
  1500,
  2000,
  15000,
  100000,
  500000,
  999999,
  1000000,
  1500000,
  2500000,
  10000000,
  50000000
];

console.log('=== FORMAT COMPACT CURRENCY TEST ===');
testCases.forEach(amount => {
  console.log(`${amount.toLocaleString('vi-VN')} VNĐ → ${formatCompactCurrency(amount)}`);
});

/*
Expected Output:
0 VNĐ → 0
500 VNĐ → 500
999 VNĐ → 999
1,000 VNĐ → 1K
1,500 VNĐ → 1.5K
2,000 VNĐ → 2K
15,000 VNĐ → 15K
100,000 VNĐ → 100K
500,000 VNĐ → 500K
999,999 VNĐ → 999.999K (nearly 1000K)
1,000,000 VNĐ → 1000K
1,500,000 VNĐ → 1500K
2,500,000 VNĐ → 2500K
10,000,000 VNĐ → 10000K
50,000,000 VNĐ → 50000K
*/
