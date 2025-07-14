import { ref, push, set } from 'firebase/database';
import { db } from './firebase';

export interface DebtHistoryEntry {
  id: string;
  customerId: string;
  customerName: string;
  action: 'CREATE_DEBT' | 'PAYMENT';
  amount: number; // Số tiền liên quan đến hành động
  remainingDebt: number; // Tổng nợ còn lại sau hành động này
  date: string;
  employeeId: string;
  employeeName: string;
  notes?: string;
  invoiceId?: string; // ID hóa đơn liên quan (nếu có)
  debtId?: string; // ID công nợ liên quan (nếu có)
  metadata?: {
    originalAmount?: number; // Cho CREATE_DEBT
    paymentMethod?: string; // Cho CREATE_DEBT từ hóa đơn
  };
}

/**
 * Lưu lịch sử tạo công nợ mới
 */
export const logDebtCreation = async (
  customerId: string,
  customerName: string,
  debtAmount: number,
  employeeId: string,
  employeeName: string,
  invoiceId?: string,
  paymentMethod?: string
): Promise<void> => {
  const historyEntry: Omit<DebtHistoryEntry, 'id'> = {
    customerId,
    customerName,
    action: 'CREATE_DEBT',
    amount: debtAmount,
    remainingDebt: debtAmount,
    date: new Date().toISOString(),
    employeeId,
    employeeName,
    notes: `Tạo công nợ từ ${invoiceId ? 'hóa đơn' : 'nhập hàng'}`,
    metadata: {
      originalAmount: debtAmount,
    }
  };

  // Chỉ thêm các field optional nếu chúng có giá trị
  if (invoiceId) {
    historyEntry.invoiceId = invoiceId;
  }
  
  if (paymentMethod) {
    historyEntry.metadata!.paymentMethod = paymentMethod;
  }

  const newHistoryRef = push(ref(db, 'debtHistory'));
  await set(newHistoryRef, historyEntry);
};

/**
 * Lưu lịch sử thanh toán công nợ
 */
export const logDebtPayment = async (
  customerId: string,
  customerName: string,
  paymentAmount: number,
  remainingDebt: number,
  employeeId: string,
  employeeName: string,
  notes?: string,
  debtId?: string
): Promise<void> => {
  const historyEntry: Omit<DebtHistoryEntry, 'id'> = {
    customerId,
    customerName,
    action: 'PAYMENT',
    amount: paymentAmount,
    remainingDebt,
    date: new Date().toISOString(),
    employeeId,
    employeeName,
    notes: notes || 'Thanh toán công nợ',
  };

  // Chỉ thêm debtId nếu có giá trị
  if (debtId) {
    historyEntry.debtId = debtId;
  }

  const newHistoryRef = push(ref(db, 'debtHistory'));
  await set(newHistoryRef, historyEntry);
};
