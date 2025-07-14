// Instructions to add Smart Search to CustomerTab and InvoiceTab

// 1. For CustomerTab.tsx - Add these imports at the top:
import { SmartSearchBar, SearchHighlight } from '@/components/shared/SmartSearchBar_new';
import { useCustomerSearch } from '@/hooks/use-smart-search';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// 2. Add this code after the existing useState declarations in CustomerTab:

const [tierFilter, setTierFilter] = useState<string>('all');

const {
searchQuery,
setSearchQuery,
clearSearch,
filteredResults,
isSearching,
totalResults
} = useCustomerSearch(customers);

// Apply tier filter to search results
const filteredCustomers = useMemo(() => {
let results = filteredResults.map(result => result.item);

if (tierFilter !== 'all') {
results = results.filter(customer => customer.tier === tierFilter || (!customer.tier && tierFilter === 'none'));
}

return results;
}, [filteredResults, tierFilter]);

// Generate suggestions based on existing data
const suggestions = useMemo(() => {
const names = [...new Set(customers.map(customer => customer.name))];
const tiers = [...new Set(customers.map(customer => customer.tier).filter(Boolean))];
return [...names.slice(0, 3), ...tiers];
}, [customers]);

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

// 3. Add this JSX right after <CardContent> and before the table:

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

// 4. Replace "customers.map" with "filteredCustomers.map" in the table

// 5. Add SearchHighlight to customer name and other fields:
<TableCell>
<SearchHighlight 
    text={customer.name} 
    searchQuery={searchQuery}
  />
</TableCell>

// Similarly for phone, email, etc.

// ==================================================

// For InvoiceTab.tsx - Add these imports:
import { SmartSearchBar, SearchHighlight } from '@/components/shared/SmartSearchBar_new';
import { useInvoiceSearch } from '@/hooks/use-smart-search';

// Add this code after existing useState declarations:

const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');

const {
searchQuery,
setSearchQuery,
clearSearch,
filteredResults,
isSearching,
totalResults
} = useInvoiceSearch(invoices);

// Apply payment method filter to search results
const filteredInvoices = useMemo(() => {
let results = filteredResults.map(result => result.item);

if (paymentMethodFilter !== 'all') {
results = results.filter(invoice => invoice.paymentMethod === paymentMethodFilter);
}

// Apply existing date filters if any...

return results;
}, [filteredResults, paymentMethodFilter]);

// Generate suggestions
const suggestions = useMemo(() => {
const customerNames = [...new Set(invoices.map(invoice => invoice.customerName))];
const paymentMethods = [...new Set(invoices.map(invoice => invoice.paymentMethod))];
const employees = [...new Set(invoices.map(invoice => invoice.employeeName).filter(Boolean))];
return [...customerNames.slice(0, 2), ...paymentMethods, ...employees.slice(0, 2)];
}, [invoices]);

const filterContent = (

  <div className="space-y-3">
    <div>
      <Label className="text-sm font-medium">Phương thức thanh toán</Label>
      <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
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

// Add SmartSearchBar before the table:

<div className="mb-4">
  <SmartSearchBar
    placeholder="Tìm kiếm hóa đơn theo khách hàng, nhân viên, sản phẩm..."
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

// Replace table data with filteredInvoices and add SearchHighlight to customer name, payment method, etc.
