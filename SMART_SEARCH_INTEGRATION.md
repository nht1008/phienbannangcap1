# Hướng dẫn tích hợp Tìm kiếm Thông minh

Tôi đã tạo thành công hệ thống tìm kiếm thông minh cho các tab Công nợ, Khách hàng và Hóa đơn. Dưới đây là hướng dẫn chi tiết:

## Files đã tạo:

1. **`src/hooks/use-smart-search.ts`** - Hook tìm kiếm thông minh chính
2. **`src/components/shared/SmartSearchBar.tsx`** - Component thanh tìm kiếm
3. **`src/components/shared/TabSearchComponents.tsx`** - Components tìm kiếm riêng cho từng tab
4. **`src/components/tabs/DebtTab.tsx`** - Đã cập nhật với tìm kiếm thông minh

## Tính năng chính:

### 🔍 Tìm kiếm thông minh

- **Tìm kiếm mờ (Fuzzy Search)**: Tìm thấy kết quả ngay cả khi gõ sai chính tả
- **Tìm kiếm theo trọng số**: Các trường quan trọng hơn được ưu tiên
- **Tìm kiếm đa trường**: Tìm kiếm trên nhiều trường cùng lúc
- **Highlight kết quả**: Làm nổi bật từ khóa tìm kiếm trong kết quả

### 🎯 Tính năng nâng cao

- **Gợi ý tìm kiếm**: Hiển thị gợi ý dựa trên dữ liệu có sẵn
- **Lịch sử tìm kiếm**: Lưu và hiển thị các tìm kiếm gần đây
- **Bộ lọc nâng cao**: Lọc theo nhiều tiêu chí khác nhau
- **Thống kê kết quả**: Hiển thị số lượng kết quả tìm được

## Cách tích hợp vào các tab:

### 1. Cho tab Công nợ (DebtTab):

```tsx
// Đã hoàn thành - file DebtTab.tsx đã được cập nhật
```

### 2. Cho tab Khách hàng (CustomerTab):

```tsx
// Thêm import
import { SmartSearchBar, SearchHighlight } from '@/components/shared/SmartSearchBar';
import { useCustomerSearch } from '@/hooks/use-smart-search';

// Trong component, thêm:
const [tierFilter, setTierFilter] = useState<string>('all');

const {
  searchQuery,
  setSearchQuery,
  clearSearch,
  filteredResults,
  isSearching,
  totalResults
} = useCustomerSearch(customers);

// Apply tier filter
const filteredCustomers = useMemo(() => {
  let results = filteredResults.map(result => result.item);
  if (tierFilter !== 'all') {
    results = results.filter(customer => customer.tier === tierFilter || (!customer.tier && tierFilter === 'none'));
  }
  return results;
}, [filteredResults, tierFilter]);

// Suggestions
const suggestions = useMemo(() => {
  const names = [...new Set(customers.map(customer => customer.name))];
  const tiers = [...new Set(customers.map(customer => customer.tier).filter(Boolean))];
  return [...names.slice(0, 3), ...tiers];
}, [customers]);

// Filter content
const filterContent = (
  <div className="space-y-3">
    <div>
      <Label className="text-sm font-medium">Hạng khách hàng</Label>
      <Select value={tierFilter} onValueChange={setTierFilter}>
        <SelectTrigger className="mt-1">
          <SelectValue placeholder="Chọn hạng" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả</SelectItem>
          <SelectItem value="Vàng">Vàng</SelectItem>
          <SelectItem value="Bạc">Bạc</SelectItem>
          <SelectItem value="Đồng">Đồng</SelectItem>
          <SelectItem value="none">Chưa phân hạng</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);

// Trong render, thêm thanh tìm kiếm trước bảng:
<div className="mb-4">
  <SmartSearchBar
    placeholder="Tìm kiếm khách hàng theo tên, SĐT, email, địa chỉ..."
    searchQuery={searchQuery}
    onSearchChange={setSearchQuery}
    onClearSearch={clearSearch}
    isSearching={isSearching}
    totalResults={totalResults}
    suggestions={suggestions}
    showFilters={true}
    filters={filterContent}
  />
</div>

// Thay đổi customers.map thành filteredCustomers.map
// Thêm SearchHighlight cho các trường cần highlight:
<TableCell>
  <SearchHighlight
    text={customer.name}
    searchQuery={searchQuery}
  />
</TableCell>
```

### 3. Cho tab Hóa đơn (InvoiceTab):

```tsx
// Thêm import
import {
  SmartSearchBar,
  SearchHighlight,
} from "@/components/shared/SmartSearchBar";
import { useInvoiceSearch } from "@/hooks/use-smart-search";

// Trong component:
const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");

const {
  searchQuery,
  setSearchQuery,
  clearSearch,
  filteredResults,
  isSearching,
  totalResults,
} = useInvoiceSearch(invoices);

// Apply filters
const filteredInvoices = useMemo(() => {
  let results = filteredResults.map((result) => result.item);

  if (paymentMethodFilter !== "all") {
    results = results.filter(
      (invoice) => invoice.paymentMethod === paymentMethodFilter
    );
  }

  // Apply existing date filters...

  return results;
}, [filteredResults, paymentMethodFilter]);

// Suggestions
const suggestions = useMemo(() => {
  const customerNames = [
    ...new Set(invoices.map((invoice) => invoice.customerName)),
  ];
  const paymentMethods = [
    ...new Set(invoices.map((invoice) => invoice.paymentMethod)),
  ];
  const employees = [
    ...new Set(invoices.map((invoice) => invoice.employeeName).filter(Boolean)),
  ];
  return [
    ...customerNames.slice(0, 2),
    ...paymentMethods,
    ...employees.slice(0, 2),
  ];
}, [invoices]);

// Filter content
const filterContent = (
  <div className="space-y-3">
    <div>
      <Label className="text-sm font-medium">Phương thức thanh toán</Label>
      <Select
        value={paymentMethodFilter}
        onValueChange={setPaymentMethodFilter}
      >
        <SelectTrigger className="mt-1">
          <SelectValue placeholder="Chọn phương thức" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả</SelectItem>
          <SelectItem value="Tiền mặt">Tiền mặt</SelectItem>
          <SelectItem value="Chuyển khoản">Chuyển khoản</SelectItem>
          <SelectItem value="Thẻ">Thẻ</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);

// Thêm thanh tìm kiếm và highlight tương tự như CustomerTab
```

## Cách sử dụng:

1. **Tìm kiếm cơ bản**: Gõ từ khóa vào thanh tìm kiếm
2. **Tìm kiếm nâng cao**: Sử dụng bộ lọc để thu hẹp kết quả
3. **Xem gợi ý**: Click vào thanh tìm kiếm để xem gợi ý
4. **Xóa tìm kiếm**: Click nút X hoặc sử dụng nút "Xóa"

## Lưu ý quan trọng:

- Đã hoàn thành tích hợp cho **DebtTab**
- **CustomerTab** và **InvoiceTab** cần áp dụng theo hướng dẫn trên
- Tất cả các file cần thiết đã được tạo
- Hệ thống hỗ trợ tiếng Việt và tìm kiếm không dấu

## Kiểm tra hoạt động:

Sau khi tích hợp xong, bạn có thể test bằng cách:

1. Mở tab Công nợ và thử tìm kiếm tên khách hàng
2. Thử tìm kiếm với từ khóa có dấu và không dấu
3. Sử dụng bộ lọc để lọc theo trạng thái
4. Kiểm tra highlight kết quả tìm kiếm
