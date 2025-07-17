export interface Product {
  id: string;
  name: string;
  quality?: string;
  quantity: number;
  price: number;
  costPrice?: number;
  images: string[];
  thumbnailImage?: string; // Hình đại diện được chọn cho sản phẩm này
  color: string;
  size: string;
  unit: string;
  dateAdded?: string;
  description?: string;
  sku?: string;
  lowStockThreshold?: number;
  batchNumber?: number; // Số lô hàng nhập
}

export interface CartItem extends Product {
  quality: string; // Override to make required
  quantityInCart: number;
  itemDiscount?: number;
  notes?: string;
}

export interface PointLog {
  id: string;
  points: number;
  date: string; // ISO string
  reason: 'earn' | 'redeem' | 'expire';
  invoiceId?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  email?: string;
  zaloName?: string; // Added Zalo Name
  tier?: 'Vàng' | 'Bạc' | 'Đồng' | string;
  points?: number;
  pointsHistory?: PointLog[];
}

export interface Supplier {
  id: number;
  name: string;
}


export interface InvoiceCartItem {
  id: string;
  name: string;
  quality: string; // Changed from optional to required with empty string as default
  quantityInCart: number;
  price: number; 
  costPrice?: number;
  images: string[];
  color: string;
  size: string;
  unit: string;
  itemDiscount?: number;
  notes?: string;
  batchNumber?: number; // Số lô hàng nhập
}

export interface Invoice {
  id: string;
  customerId: string;
  customerName: string;
  items: InvoiceCartItem[];
  total: number;
  date: string; 
  paymentMethod: string;
  discount?: number; 
  pointsEarned?: number;
  amountPaid?: number; 
  debtAmount?: number; 
  employeeId: string; 
  employeeName?: string; 
  orderSource?: 'store' | 'store-debt' | 'online'; // Nguồn đơn hàng: tại cửa hàng, tại cửa hàng-nợ, hoặc online
}

export interface OrderItem extends InvoiceCartItem { // Similar to InvoiceCartItem but for orders
  // Any order-specific item properties can be added here
}

export type OrderStatus = 'Chờ xác nhận' | 'Hoàn thành' | 'Đã hủy' | 'Yêu cầu hủy';


export interface Order {
  id: string; // Firebase key
  orderNumber: string; // Human-readable order number
  customerId: string; // UID of the customer from Firebase Auth
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerZaloName?: string;
  items: OrderItem[];
  subTotal: number; // Sum of (item.price * item.quantityInCart - item.itemDiscount)
  shippingFee: number;
  totalAmount: number; // subTotal + shippingFee - overallDiscount
  overallDiscount?: number; // Discount on the entire order
  paymentMethod: string; // e.g., 'COD', 'Bank Transfer', 'Online'
  orderStatus: OrderStatus;
  internalNotes?: string; // Shop notes
  orderDate: string; // ISO string
  shipDate?: string; // ISO string
  completionDate?: string; // ISO string
  updatedBy?: string; // UID of employee who last updated
  updatedAt?: string; // ISO string of last update
  redeemedPoints?: { // Thông tin điểm đã đổi (để xử lý sau khi hoàn thành)
    points: number;
    value: number;
  };
}


export type DebtStatus = 'Còn nợ' | 'Đã thanh toán' | 'Quá hạn';

export interface DebtPayment {
  id: string;
  paymentDate: string; // ISO string
  amountPaid: number;
  employeeId: string;
  employeeName: string;
  notes?: string;
}

export interface Debt {
  id: string;
  customerId: string;
  customerName: string;
  originalAmount: number;
  amountPaid: number;
  remainingAmount: number;
  date: string; // ISO string of debt creation
  dueDate?: string; // Optional ISO string for due date
  status: DebtStatus;
  invoiceId?: string;
  payments: DebtPayment[];
  createdEmployeeId?: string;
  createdEmployeeName?: string;
  lastUpdatedEmployeeId?: string;
  lastUpdatedEmployeeName?: string;
}

export interface ItemToImport {
  name: string;
  color: string;
  quality: string; 
  size: string;
  unit: string;
  quantity: number;
  cost: number; 
}

export type ProductOptionType = 'productNames' | 'colors' | 'qualities' | 'sizes' | 'units'; 

export type EmployeePosition = 'Nhân viên' | 'ADMIN' | 'Quản lý';

export interface Employee {
  id: string;
  name: string;
  email: string;
  position: EmployeePosition;
  phone?: string;
  address?: string;
  zaloName?: string; // Added Zalo Name
}

export interface ShopInfo {
  name: string;
  address: string;
  phone: string;
  logoUrl: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  showShopLogoOnInvoice: boolean;
  showShopAddressOnInvoice: boolean;
  showShopPhoneOnInvoice: boolean;
  showShopBankDetailsOnInvoice: boolean;
  showEmployeeNameOnInvoice: boolean;
  invoiceThankYouMessage: string;
}

export interface DisposalLogEntry {
  id: string;
  productId: string;
  productName: string;
  color: string;
  quality?: string;
  size: string;
  unit: string;
  images: string[];
  quantityDisposed: number;
  reason: string;
  disposalDate: string;
  employeeId: string;
  employeeName: string;
}

export type UserAccessRequestStatus = 'pending' | 'approved' | 'rejected';

export interface UserAccessRequest {
  id: string;
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  zaloName: string; // Added Zalo Name
  requestedRole: 'employee' | 'customer';
  status: UserAccessRequestStatus;
  requestDate: string;
  reviewedBy?: string;
  reviewDate?: string;
  rejectionReason?: string;
}

export type ProductFormData = Omit<Product, 'id' | 'quantity' | 'price' | 'costPrice' | 'images'> & {
  quantity: string;
  price: string;
  costPrice: string;
  images: string[];
};

export interface ProductAttributeSelection {
  color: boolean;
  quality: boolean;
  size: boolean;
  unit: boolean;
}

export const initialProductFormData: ProductFormData = {
  name: '',
  color: '',
  quality: '',
  size: '',
  unit: '',
  quantity: '',
  price: '',
  costPrice: '',
  images: [],
};

export interface GroupedDisposalLogEntry {
    productKey: string;
    productName: string;
    color: string;
    quality?: string;
    size: string;
    unit: string;
    images: string[];
    totalQuantityDisposed: number;
    latestDisposalDate: string;
    reasons: string[];
    employeeNames: string[];
}

export interface ProductSalesDetail {
    productId: string;
    name: string;
    color: string;
    quality?: string;
    size: string;
    unit: string;
    images: string[];
    currentStock: number;
    totalQuantitySold: number;
    lastSaleDate?: string; // ISO string
    salesInLast30Days: number;
    salesInLast60Days: number;
    salesInLast90Days: number;
}

export type ProductSalesSummary = Record<string, Pick<ProductSalesDetail, 'productId' | 'totalQuantitySold' | 'lastSaleDate'>>;

export interface IdentifiedSlowMovingProduct extends Product {
  totalQuantitySoldLast90Days: number;
  lastSaleDate?: string; // ISO string, from ProductSalesDetail
  daysSinceLastSale?: number; // Calculated from lastSaleDate
}
export interface ProductPerformance {
  id: string;
  key: string; // Combined key like name-color-quality-size-unit
  name: string;
  color: string;
  quality?: string;
  size: string;
  unit: string;
  images: string[];
  currentStock: number;
  soldInPeriod: number;
  revenueInPeriod: number;
  profitInPeriod: number;
  profitMarginRatio: number;
  contributionToRevenueRatio: number;
  contributionToProfitRatio: number;
}

export interface SlowMovingProductAnalysis {
  productId: string;
  name: string;
  color: string;
  quality?: string;
  size: string;
  unit: string;
  images: string[];
  currentStock: number;
  stockValue: number;
  lastSaleDate: string | null;
  daysSinceLastSale: number | null;
  salesInLast30Days: number;
  salesInLast60Days: number;
  salesInLast90Days: number;
  statusSuggestion?: string;
}

export interface ProcessedSlowMovingLogEntry {
  id: string;
  productId: string;
  productName: string;
  color: string;
  quality?: string;
  size: string;
  unit: string;
  images: string[];
  quantityProcessed: number;
  processingDetails: string;
  processingDate: string;
  employeeId: string;
  employeeName: string;
}

export interface GroupedProcessedSlowMovingLogEntry {
  productKey: string;
  productName: string;
  color: string;
  quality?: string;
  size: string;
  unit: string;
  images: string[];
  totalQuantityProcessed: number;
  latestProcessingDate: string;
  processingActions: string[];
  employeeNames: string[];
}


export type Banner = {
  id: string;
  url: string;
  order: number;
};


import type { User } from 'firebase/auth';

export type UserRole = 'admin' | 'manager' | 'employee' | 'customer' | null;

export interface AuthUser extends User {
  role: UserRole;
}
