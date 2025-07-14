import React from 'react';
import { PaymentDialog } from './PaymentDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle as AlertDialogTitleComponent } from "@/components/ui/alert-dialog";
import type { Debt } from '@/types';
import type { User } from 'firebase/auth';

interface DebtDialogsProps {
  isPaymentDialogOpen: boolean;
  setIsPaymentDialogOpen: (isOpen: boolean) => void;
  selectedDebt: Debt | null;
  currentUser: User | null;
  handleAddPayment: (customerId: string, amount: number, notes: string, employeeId: string, employeeName: string) => Promise<void>;
  isConfirmingDebtDelete: boolean;
  setIsConfirmingDebtDelete: (isOpen: boolean) => void;
  debtToDelete: Debt | null;
  handleConfirmDeleteDebt: () => void;
}

export const DebtDialogs: React.FC<DebtDialogsProps> = ({
  isPaymentDialogOpen,
  setIsPaymentDialogOpen,
  selectedDebt,
  currentUser,
  handleAddPayment,
  isConfirmingDebtDelete,
  setIsConfirmingDebtDelete,
  debtToDelete,
  handleConfirmDeleteDebt,
}) => {
  return (
    <>
      <PaymentDialog
        isOpen={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        debt={selectedDebt}
        currentUser={currentUser}
        onAddPayment={handleAddPayment}
      />
      {debtToDelete && (
        <AlertDialog open={isConfirmingDebtDelete} onOpenChange={setIsConfirmingDebtDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitleComponent>Xác nhận xóa công nợ?</AlertDialogTitleComponent>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa công nợ cho "{(debtToDelete.customerName || (debtToDelete as any).supplier)}" trị giá {((debtToDelete as any).originalAmount || (debtToDelete as any).amount || 0).toLocaleString('vi-VN')} VNĐ không?
                {debtToDelete.invoiceId && " Nếu công nợ này được tạo từ hóa đơn, nó cũng sẽ được cập nhật trên hóa đơn đó."}
                Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsConfirmingDebtDelete(false)}>Hủy</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmDeleteDebt}
                className="bg-red-600 hover:bg-red-700"
              >
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};
