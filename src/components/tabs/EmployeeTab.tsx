
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import type { Employee, Invoice, Debt, DebtPayment, EmployeePosition, UserAccessRequest } from '@/types';
import type { User } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPhoneNumber, cn, normalizeStringForSearch } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle as AlertDialogTitleComponent } from "@/components/ui/alert-dialog";
import { Calendar as CalendarIcon, Trash2, UserCog, UserX, Pencil, CheckCircle, XCircle, DollarSign, TrendingUp, Tag, ArrowRightLeft } from 'lucide-react';
import { EmployeeIcon } from '@/components/icons/EmployeeIcon';
import { Calendar } from "@/components/ui/calendar";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { NumericDisplaySize } from '@/components/settings/SettingsDialog';
import { TimeRangeSlider } from '@/components/ui/time-range-slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { NoEmployeesIllustration } from '@/components/illustrations/NoEmployeesIllustration';
import { KpiCard } from '@/components/analysis/KpiCard';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, onValue, update, set } from "firebase/database";
import { useAuthorization } from '@/hooks/use-authorization';
import { useIsMobile } from '@/hooks/use-mobile';


interface ActivityDateTimeFilter {
  startDate: Date | null;
  endDate: Date | null;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
}

const getCombinedDateTime = (dateInput: Date | null, hourStr: string, minuteStr: string): Date | null => {
    if (!dateInput) return null;
    const newDate = new Date(dateInput);
    const hours = parseInt(hourStr, 10);
    const minutes = parseInt(minuteStr, 10);
    if (!isNaN(hours) && !isNaN(minutes)) {
      const seconds = (minuteStr === '59') ? 59 : 0;
      const milliseconds = (minuteStr === '59') ? 999 : 0;
      newDate.setHours(hours, minutes, seconds, milliseconds);
    }
    return newDate;
};


const filterActivityByDateTimeRange = <T extends { date: string }>(
  data: T[],
  filter: ActivityDateTimeFilter
): T[] => {
  if (!data) return [];

  const { startDate, endDate, startHour, startMinute, endHour, endMinute } = filter;

  if (!startDate || !endDate) {
    return data;
  }

  const effectiveStartDate = getCombinedDateTime(startDate, startHour, startMinute);
  const effectiveEndDate = getCombinedDateTime(endDate, endHour, endMinute);

  if (!effectiveStartDate || !effectiveEndDate) return data;

  let finalEffectiveEndDate = effectiveEndDate;
  if (effectiveEndDate < effectiveStartDate && startDate.toDateString() === endDate.toDateString()) {
     const tempEnd = new Date(endDate);
     tempEnd.setHours(23, 59, 59, 999);
     finalEffectiveEndDate = tempEnd;
  }


  return data.filter(item => {
    const itemDateTime = new Date(item.date);
    return itemDateTime >= effectiveStartDate && itemDateTime <= finalEffectiveEndDate;
  });
};


interface EmployeeTabProps {
  employees: Employee[];
  currentUser: User | null;
  invoices: Invoice[];
  debts: Debt[];
  numericDisplaySize: NumericDisplaySize;
  onDeleteDebt: (debtId: string) => void;
  onToggleEmployeeRole: (employeeId: string, currentPosition: EmployeePosition) => Promise<void>;
  onUpdateEmployeeInfo: (employeeId: string, data: { name: string; phone?: string }) => Promise<void>;
  adminEmail: string;
  onDeleteEmployee: (employeeId: string) => Promise<void>;
}

const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minuteOptionsStart = ['00', '15', '30', '45'];
const minuteOptionsEnd = ['00', '15', '30', '45', '59'];


export function EmployeeTab({
    employees,
    currentUser,
    invoices,
    debts,
    numericDisplaySize,
    onDeleteDebt,
    onToggleEmployeeRole,
    onUpdateEmployeeInfo,
    adminEmail,
    onDeleteEmployee,
}: EmployeeTabProps) {
  const { can_manage, is_admin } = useAuthorization();
  const isMobile = useIsMobile();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activityFilter, setActivityFilter] = useState<ActivityDateTimeFilter>({
    startDate: null,
    endDate: null,
    startHour: '00',
    startMinute: '00',
    endHour: '23',
    endMinute: '59',
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editFormData, setEditFormData] = useState<{ name: string; phone: string }>({ name: '', phone: '' });
  const { toast } = useToast();

  const [employeeAccessRequests, setEmployeeAccessRequests] = useState<UserAccessRequest[]>([]);
  const [isLoadingEmployeeRequests, setIsLoadingEmployeeRequests] = useState(false);
  const [isReviewEmployeeRequestsDialogOpen, setIsReviewEmployeeRequestsDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [requestToReject, setRequestToReject] = useState<UserAccessRequest | null>(null);
  const [isConfirmDeleteEmployeeOpen, setIsConfirmDeleteEmployeeOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);


  useEffect(() => {
    if (can_manage) {
      setIsLoadingEmployeeRequests(true);
      const requestsRef = ref(db, 'userAccessRequests');
      const unsubscribe = onValue(requestsRef, (snapshot) => {
        const data = snapshot.val();
        const loadedRequests: UserAccessRequest[] = [];
        if (data) {
          Object.keys(data).forEach(key => {
            // Only load pending employee requests for this specific dialog
            if (data[key].status === 'pending' && data[key].requestedRole === 'employee') {
              loadedRequests.push({ id: key, ...data[key] });
            }
          });
        }
        setEmployeeAccessRequests(loadedRequests.sort((a, b) => new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime()));
        setIsLoadingEmployeeRequests(false);
      }, (error) => {
        console.error("Error fetching employee access requests:", error);
        toast({ title: "Lỗi tải yêu cầu", description: "Không thể tải danh sách yêu cầu nhân viên.", variant: "destructive" });
        setIsLoadingEmployeeRequests(false);
      });
      return () => unsubscribe();
    }
  }, [can_manage, toast]);

  const handleApproveEmployeeRequest = async (request: UserAccessRequest) => {
    if (!can_manage || !currentUser || request.requestedRole !== 'employee') return;

    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch('/api/enable-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ uid: request.uid, role: 'employee' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Lỗi không xác định từ máy chủ');
      }

      toast({ title: "Thành công", description: `Đã duyệt và kích hoạt tài khoản cho ${request.fullName}.` });
    } catch (error: any) {
      console.error("Error approving employee request:", error);
      toast({ title: "Lỗi", description: error.message || "Không thể duyệt yêu cầu nhân viên.", variant: "destructive" });
    }
  };

  const openRejectEmployeeDialog = (request: UserAccessRequest) => {
    setRequestToReject(request);
    setRejectionReason("");
  };

  const handleConfirmRejectEmployeeRequest = async () => {
    if (!can_manage || !currentUser || !requestToReject) return;
    try {
      await update(ref(db, `userAccessRequests/${requestToReject.id}`), {
        status: 'rejected',
        reviewedBy: currentUser.uid,
        reviewDate: new Date().toISOString(),
        rejectionReason: rejectionReason.trim() || "Không có lý do cụ thể.",
      });
      toast({ title: "Thành công", description: `Đã từ chối yêu cầu của ${requestToReject.fullName}.`, variant: "default" });
      setRequestToReject(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast({ title: "Lỗi", description: "Không thể từ chối yêu cầu.", variant: "destructive" });
    }
  };


  const displayEmployees = useMemo(() => {
    if (can_manage) {
        const adminEmp = employees.find(emp => emp.email === adminEmail);
        // `employees` is already sorted by name from page.tsx
        const otherEmps = employees.filter(emp => emp.email !== adminEmail); 
        if (adminEmp) {
            return [adminEmp, ...otherEmps];
        }
        return otherEmps; 
    } else {
        // Non-admin view: show admin and self, admin first.
        const adminEmployeeRecord = employees.find(emp => emp.email === adminEmail);
        const selfEmployeeRecord = employees.find(emp => emp.id === currentUser?.uid);
        const result = [];
        if (adminEmployeeRecord) result.push(adminEmployeeRecord);
        if (selfEmployeeRecord && (!adminEmployeeRecord || selfEmployeeRecord.id !== adminEmployeeRecord.id)) {
            result.push(selfEmployeeRecord);
        }
        return result;
    }
  }, [employees, currentUser, can_manage, adminEmail]);

  const employeeBaseInvoices = useMemo(() => {
    if (!selectedEmployee) return [];
    return invoices.filter(inv => inv.employeeId === selectedEmployee.id);
  }, [invoices, selectedEmployee]);

  const employeeBaseDebts = useMemo(() => {
    if (!selectedEmployee) return [];
    return debts.filter(debt =>
                        debt.createdEmployeeId === selectedEmployee.id ||
                        debt.lastUpdatedEmployeeId === selectedEmployee.id ||
                        (debt.payments && Object.values(debt.payments).some(p => (p as DebtPayment).employeeId === selectedEmployee.id))
                      );
  }, [debts, selectedEmployee]);

  const filteredEmployeeInvoices = useMemo(() => {
    return filterActivityByDateTimeRange(employeeBaseInvoices, activityFilter);
  }, [employeeBaseInvoices, activityFilter]);

  const employeeActivityLog = useMemo(() => {
    if (!selectedEmployee) return [];

    type ActivityLogItem = {
      type: 'Tạo nợ' | 'Thu nợ';
      date: string;
      customerName: string;
      amount: number;
      notes?: string;
      key: string;
    };

    const activities: ActivityLogItem[] = [];

    for (const debt of employeeBaseDebts) {
      // Event 1: Debt Creation
      if (debt.createdEmployeeId === selectedEmployee.id) {
        activities.push({
          type: 'Tạo nợ',
          date: debt.date,
          customerName: debt.customerName,
          amount: debt.originalAmount,
          key: `debt-${debt.id}`,
        });
      }

      // Event 2: Payments
      const paymentsArray = (debt.payments && !Array.isArray(debt.payments))
        ? Object.values(debt.payments)
        : (debt.payments || []);
      
      for (const payment of paymentsArray as DebtPayment[]) {
        if (payment.employeeId === selectedEmployee.id) {
          activities.push({
            type: 'Thu nợ',
            date: payment.paymentDate,
            customerName: debt.customerName,
            amount: payment.amountPaid,
            notes: payment.notes,
            key: `payment-${payment.id}`,
          });
        }
      }
    }

    // Filter the combined activities by the date filter
    return activities.filter(activity => {
        const activityDate = new Date(activity.date);
        const { startDate, endDate, startHour, startMinute, endHour, endMinute } = activityFilter;
        const effectiveStartDate = getCombinedDateTime(startDate, startHour, startMinute);
        const effectiveEndDate = getCombinedDateTime(endDate, endHour, endMinute);
        const isAfterStartDate = !effectiveStartDate || activityDate >= effectiveStartDate;
        const isBeforeEndDate = !effectiveEndDate || activityDate <= effectiveEndDate;
        return isAfterStartDate && isBeforeEndDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  }, [employeeBaseDebts, selectedEmployee, activityFilter]);

  const totalSalesByEmployee = useMemo(() => {
    return filteredEmployeeInvoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
  }, [filteredEmployeeInvoices]);

  const totalDebtCollectedByEmployee = useMemo(() => {
    // This now simply sums up the 'Thu nợ' activities from the unified log.
    return employeeActivityLog.reduce((sum, activity) => {
      if (activity.type === 'Thu nợ') {
        return sum + activity.amount;
      }
      return sum;
    }, 0);
  }, [employeeActivityLog]);

  const totalDiscountsByEmployee = useMemo(() => {
    return filteredEmployeeInvoices.reduce((sum, inv) => {
      const overallDiscount = inv.discount || 0;
      const itemDiscountsTotal = inv.items.reduce((itemSum, currentItem) => itemSum + (currentItem.itemDiscount || 0), 0);
      return sum + overallDiscount + itemDiscountsTotal;
    }, 0);
  }, [filteredEmployeeInvoices]);

  const totalTransactions = useMemo(() => {
    return totalSalesByEmployee + totalDebtCollectedByEmployee;
  }, [totalSalesByEmployee, totalDebtCollectedByEmployee]);

  const handleSelectEmployee = (employee: Employee) => {
    if (can_manage || employee.email === adminEmail || employee.id === currentUser?.uid) {
        setSelectedEmployee(employee);
        setDateRangePreset('today'); // Mặc định hiển thị thông tin hôm nay
    } else {
        setSelectedEmployee(null);
    }
  };

  const setDateRangePreset = (preset: 'today' | 'this_month' | 'last_month' | 'all_time') => {
    const now = new Date();
    let from: Date | null = null;
    let to: Date | null = null;

    switch (preset) {
      case 'today':
        from = startOfDay(now);
        to = endOfDay(now);
        break;
      case 'this_month':
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        from = startOfMonth(lastMonth);
        to = endOfMonth(lastMonth);
        break;
      case 'all_time':
        from = null;
        to = null;
        break;
    }
    setActivityFilter({
      ...activityFilter,
      startDate: from,
      endDate: to,
      startHour: '00',
      startMinute: '00',
      endHour: '23',
      endMinute: '59',
    });
  };

  const handleOpenEditModal = (employee: Employee) => {
    if (employee.email === adminEmail) {
      toast({ title: "Không thể sửa", description: "Không thể chỉnh sửa thông tin của tài khoản Quản trị viên.", variant: "destructive"});
      return;
    }
    setEditingEmployee(employee);
    setEditFormData({ name: employee.name, phone: employee.phone || '' });
    setIsEditModalOpen(true);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEmployeeInfo = async () => {
    if (!editingEmployee || !editFormData.name.trim()) {
      toast({ title: "Lỗi", description: "Tên nhân viên không được để trống.", variant: "destructive" });
      return;
    }
    try {
      await onUpdateEmployeeInfo(editingEmployee.id, {
        name: editFormData.name.trim(),
        phone: editFormData.phone.trim() || undefined
      });
      toast({ title: "Thành công", description: "Đã cập nhật thông tin nhân viên." });
      setIsEditModalOpen(false);
      setEditingEmployee(null);
    } catch (error) {
      console.error("Error updating employee info:", error);
      toast({ title: "Lỗi", description: "Không thể cập nhật thông tin nhân viên.", variant: "destructive" });
    }
  };

  const handleOpenDeleteEmployeeDialog = (employee: Employee) => {
    if (employee.email === adminEmail) {
      toast({ title: "Không thể xóa", description: "Không thể xóa tài khoản Quản trị viên.", variant: "destructive" });
      return;
    }
    setEmployeeToDelete(employee);
    setIsConfirmDeleteEmployeeOpen(true);
  };

  const handleConfirmDeleteEmployee = async () => {
    if (employeeToDelete && employeeToDelete.email !== adminEmail) {
      try {
        await onDeleteEmployee(employeeToDelete.id);
        toast({ title: "Thành công", description: `Đã xóa nhân viên "${employeeToDelete.name}".` });
        if (selectedEmployee?.id === employeeToDelete?.id) {
          setSelectedEmployee(null);
        }
      } catch (error) {
        console.error("Error deleting employee:", error);
        toast({ title: "Lỗi", description: "Không thể xóa nhân viên.", variant: "destructive" });
      }
    }
    setIsConfirmDeleteEmployeeOpen(false);
    setEmployeeToDelete(null);
  };

  const handleToggleRole = async (employee: Employee) => {
    try {
      await onToggleEmployeeRole(employee.id, employee.position);
      toast({ title: "Thành công", description: `Đã thay đổi vai trò của ${employee.name}.` });
    } catch (error) {
      console.error("Error toggling employee role:", error);
      toast({ title: "Lỗi", description: "Không thể thay đổi vai trò.", variant: "destructive" });
    }
  };


  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">Danh sách Nhân sự</CardTitle>
            {can_manage && (
              <Button
                onClick={() => setIsReviewEmployeeRequestsDialogOpen(true)}
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
              >
                <EmployeeIcon className="mr-2 h-4 w-4" /> Xét duyệt nhân viên ({employeeAccessRequests.length})
              </Button>
            )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col space-y-6">
        <div>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>STT</TableHead>
                  <TableHead>Họ và tên</TableHead>
                  <TableHead>Chức vụ</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead className="text-center">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16">
                      <div className="flex flex-col items-center gap-4">
                        <NoEmployeesIllustration />
                        <h3 className="text-xl font-semibold">Chưa có nhân viên</h3>
                        <p className="text-muted-foreground">Bạn chưa có nhân viên nào. Hãy bắt đầu xây dựng đội ngũ.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayEmployees.map((emp, index) => (
                    <TableRow
                      key={emp.id}
                      onClick={() => handleSelectEmployee(emp)}
                      className={`cursor-pointer hover:bg-muted/50 ${selectedEmployee?.id === emp.id ? 'bg-primary/10' : ''}`}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{emp.name}</TableCell>
                      <TableCell>
                        {emp.position === 'ADMIN' ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-destructive text-destructive-foreground">
                            {emp.position}
                          </span>
                        ) : emp.position === 'Quản lý' ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-sky-500 text-white dark:bg-sky-600 dark:text-sky-100">
                            {emp.position}
                          </span>
                        ) : emp.position === 'Nhân viên' ? (
                           <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-500 text-white dark:bg-gray-600 dark:text-gray-100">
                            {emp.position}
                          </span>
                        ) : (
                          emp.position
                        )}
                      </TableCell>
                      <TableCell>{emp.email}</TableCell>
                      <TableCell>{formatPhoneNumber(emp.phone) || 'Chưa cập nhật'}</TableCell>
                      <TableCell className="text-center space-x-1">
                        {can_manage && emp.email !== adminEmail && (
                           <TooltipProvider delayDuration={0}>
                                 <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenEditModal(emp);
                                    }}
                                    >
                                    <Pencil className="h-4 w-4 text-yellow-600" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                    <p>Sửa thông tin nhân viên</p>
                                </TooltipContent>
                                </Tooltip>
                           </TooltipProvider>
                       )}
                       {is_admin && emp.email !== adminEmail && (emp.position === 'Nhân viên' || emp.position === 'Quản lý') && (
                         <TooltipProvider delayDuration={0}>
                           <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleRole(emp);
                                  }}
                                >
                                  {emp.position === 'Nhân viên' ? (
                                    <UserCog className="h-4 w-4 text-blue-600" />
                                  ) : (
                                    <UserX className="h-4 w-4 text-orange-600" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>
                                  {emp.position === 'Nhân viên'
                                    ? 'Nâng cấp thành Quản lý'
                                    : 'Hạ cấp thành Nhân viên'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {is_admin && emp.email !== adminEmail && (
                            <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenDeleteEmployeeDialog(emp);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="bg-destructive text-destructive-foreground">
                                        <p>Xóa nhân viên</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            {displayEmployees.length === 0 ? (
              <div className="text-center py-16">
                <div className="flex flex-col items-center gap-4">
                  <NoEmployeesIllustration />
                  <h3 className="text-xl font-semibold">Chưa có nhân viên</h3>
                  <p className="text-muted-foreground">Bạn chưa có nhân viên nào. Hãy bắt đầu xây dựng đội ngũ.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {displayEmployees.map((emp, index) => (
                  <Card 
                    key={emp.id}
                    className={`cursor-pointer transition-colors border-l-4 ${selectedEmployee?.id === emp.id ? 'bg-primary/10 border-l-primary' : 'border-l-transparent hover:border-l-primary/50'}`}
                    onClick={() => handleSelectEmployee(emp)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">#{index + 1}</span>
                            <div>
                              <h3 className="font-medium">{emp.name}</h3>
                              <p className="text-sm text-muted-foreground">{emp.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {emp.position === 'ADMIN' ? (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-destructive text-destructive-foreground">
                                {emp.position}
                              </span>
                            ) : emp.position === 'Quản lý' ? (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-sky-500 text-white">
                                {emp.position}
                              </span>
                            ) : emp.position === 'Nhân viên' ? (
                               <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-500 text-white">
                                {emp.position}
                              </span>
                            ) : (
                              emp.position
                            )}
                          </div>
                        </div>
                        
                        <div className="text-sm">
                          <p><span className="text-muted-foreground">SĐT:</span> {formatPhoneNumber(emp.phone) || 'Chưa cập nhật'}</p>
                        </div>

                        {can_manage && emp.email !== adminEmail && (
                          <div className="flex gap-2 pt-2 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(emp);
                              }}
                            >
                              <Pencil className="h-4 w-4 mr-1 text-yellow-600" />
                              Sửa
                            </Button>
                            
                            {is_admin && (emp.position === 'Nhân viên' || emp.position === 'Quản lý') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleRole(emp);
                                }}
                              >
                                {emp.position === 'Nhân viên' ? (
                                  <>
                                    <UserCog className="h-4 w-4 mr-1 text-blue-600" />
                                    Nâng cấp
                                  </>
                                ) : (
                                  <>
                                    <UserX className="h-4 w-4 mr-1 text-orange-600" />
                                    Hạ cấp
                                  </>
                                )}
                              </Button>
                            )}
                            
                            {is_admin && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDeleteEmployeeDialog(emp);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Xóa
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedEmployee && (
          <Card className="shadow-md mt-6">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Nhật ký hoạt động của: {selectedEmployee.name}</CardTitle>
              <CardDescription>Tổng hợp các hóa đơn và công nợ liên quan đến nhân viên này.</CardDescription>

              <div className="mt-4 pt-4 border-t space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Khoảng thời gian</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal bg-card h-9",
                              !activityFilter.startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {activityFilter.startDate && activityFilter.endDate ? (
                              <>
                                {format(activityFilter.startDate, "dd/MM/y", { locale: vi })} - {format(activityFilter.endDate, "dd/MM/y", { locale: vi })}
                              </>
                            ) : (
                              <span>Chọn khoảng ngày</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={activityFilter.startDate || new Date()}
                            selected={{ from: activityFilter.startDate || undefined, to: activityFilter.endDate || undefined }}
                            onSelect={(range) => setActivityFilter(prev => ({ ...prev, startDate: range?.from || null, endDate: range?.to || null }))}
                            numberOfMonths={isMobile ? 1 : 2}
                            locale={vi}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Khung giờ</Label>
                      <TimeRangeSlider
                        value={[
                          parseInt(activityFilter.startHour) * 60 + parseInt(activityFilter.startMinute),
                          Math.min(1425, parseInt(activityFilter.endHour) * 60 + parseInt(activityFilter.endMinute))
                        ]}
                        onValueChange={([start, end]) => {
                          const startHour = Math.floor(start / 60).toString().padStart(2, '0');
                          const startMinute = (start % 60).toString().padStart(2, '0');
                          const endHour = Math.floor(end / 60).toString().padStart(2, '0');
                          const endMinute = end >= 1425 ? '59' : (end % 60).toString().padStart(2, '0');
                          setActivityFilter(prev => ({ ...prev, startHour, startMinute, endHour, endMinute }));
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:flex gap-2 mt-2">
                    <Button onClick={() => setDateRangePreset('today')} variant="outline" className="h-9 text-xs md:text-sm">Hôm nay</Button>
                    <Button onClick={() => setDateRangePreset('this_month')} variant="outline" className="h-9 text-xs md:text-sm">Tháng này</Button>
                    <Button onClick={() => setDateRangePreset('last_month')} variant="outline" className="h-9 text-xs md:text-sm">Tháng trước</Button>
                    <Button onClick={() => setDateRangePreset('all_time')} variant="secondary" className="h-9 text-xs md:text-sm col-span-2 md:col-span-1">Xem tất cả</Button>
                  </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <KpiCard
                    title="Tổng tiền bán hàng"
                    value={`${(totalSalesByEmployee || 0).toLocaleString('vi-VN')} VNĐ`}
                    icon={<DollarSign className="h-6 w-6" />}
                    colorClassName="bg-green-600 text-white"
                    description="(Tổng tiền THỰC THU từ các HĐ do NV này tạo, theo bộ lọc)"
                  />
                  <KpiCard
                    title="Tổng thu nợ"
                    value={`${(totalDebtCollectedByEmployee || 0).toLocaleString('vi-VN')} VNĐ`}
                    icon={<TrendingUp className="h-6 w-6" />}
                    colorClassName="bg-sky-600 text-white"
                    description="(Tổng tiền các khoản thanh toán do NV này thực hiện, theo bộ lọc ngày thanh toán)"
                  />
                  <KpiCard
                    title="Tổng giảm giá"
                    value={`${(totalDiscountsByEmployee || 0).toLocaleString('vi-VN')} VNĐ`}
                    icon={<Tag className="h-6 w-6" />}
                    colorClassName="bg-amber-600 text-white"
                    description="(Tổng GG chung & GG sản phẩm trên các HĐ do NV này tạo, theo bộ lọc)"
                  />
              </div>
              <div className="mb-6">
                  <KpiCard
                    title="Tổng giao dịch"
                    value={`${(totalTransactions || 0).toLocaleString('vi-VN')} VNĐ`}
                    icon={<ArrowRightLeft className="h-6 w-6" />}
                    colorClassName="bg-slate-700 text-white"
                    description="(Đây là tổng số tiền mà nhân viên đang cầm (không tính số tiền gốc đã đưa cho))"
                  />
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg text-foreground">Hóa đơn đã tạo ({filteredEmployeeInvoices.length})</h3>
                {filteredEmployeeInvoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Không có hóa đơn nào phù hợp với bộ lọc.</p>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block">
                      <ScrollArea className="h-60 border rounded-md p-2 no-scrollbar">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">STT</TableHead>
                              <TableHead>ID HĐ</TableHead>
                              <TableHead>Khách hàng</TableHead>
                              <TableHead>Thời gian</TableHead>
                              <TableHead className="text-right">Tổng tiền</TableHead>
                              <TableHead className="text-right">Giảm giá</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredEmployeeInvoices.map((invoice, index) => {
                              const invoiceDate = new Date(invoice.date);
                              return (
                                <TableRow key={invoice.id}>
                                  <TableCell>{index + 1}</TableCell>
                                  <TableCell>{invoice.id.substring(0, 8)}...</TableCell>
                                  <TableCell>{invoice.customerName}</TableCell>
                                  <TableCell>
                                    <div className="text-sm">
                                      <div>{invoiceDate.toLocaleDateString('vi-VN')}</div>
                                      <div className="text-muted-foreground">{invoiceDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className="bg-green-600 text-white px-2 py-1 rounded">
                                      {(invoice.total || 0).toLocaleString('vi-VN')} VNĐ
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className="bg-red-600 text-white px-2 py-1 rounded">
                                      {(invoice.discount ?? 0).toLocaleString('vi-VN')} VNĐ
                                    </span>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden">
                      <ScrollArea className="h-60 border rounded-md p-2">
                        <div className="space-y-3">
                          {filteredEmployeeInvoices.map((invoice, index) => {
                            const invoiceDate = new Date(invoice.date);
                            return (
                              <Card key={invoice.id} className="border-l-4 border-l-green-500">
                                <CardContent className="p-3">
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-start">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">#{index + 1}</span>
                                        <div>
                                          <p className="font-medium text-sm">ID: {invoice.id.substring(0, 8)}...</p>
                                          <p className="text-xs text-muted-foreground">{invoice.customerName}</p>
                                        </div>
                                      </div>
                                      <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                                        {(invoice.total || 0).toLocaleString('vi-VN')} VNĐ
                                      </span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center text-xs">
                                      <div>
                                        <span className="text-muted-foreground">Thời gian: </span>
                                        <span>{invoiceDate.toLocaleDateString('vi-VN')} {invoiceDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                      </div>
                                      <span className="bg-red-600 text-white px-2 py-1 rounded">
                                        GG: {(invoice.discount ?? 0).toLocaleString('vi-VN')} VNĐ
                                      </span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                  </>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2 text-lg text-foreground">Nhật ký Công nợ ({employeeActivityLog.length})</h3>
                 {employeeActivityLog.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Không có hoạt động nào phù hợp với bộ lọc.</p>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block">
                      <ScrollArea className="h-60 border rounded-md p-2 no-scrollbar">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">STT</TableHead>
                              <TableHead>Thời gian</TableHead>
                              <TableHead className="w-40">Hành động</TableHead>
                              <TableHead>Khách hàng</TableHead>
                              <TableHead className="text-right w-48">Số tiền</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {employeeActivityLog.map((activity, index) => {
                              const activityDate = new Date(activity.date);
                              return (
                                <TableRow key={activity.key}>
                                  <TableCell>{index + 1}</TableCell>
                                  <TableCell>
                                    <div className="text-sm">
                                      <div>{activityDate.toLocaleDateString('vi-VN')}</div>
                                      <div className="text-muted-foreground">{activityDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <span className={cn(
                                      "px-2 py-1 rounded-full text-xs font-semibold",
                                      activity.type === 'Tạo nợ' ? 'bg-destructive text-destructive-foreground' : 'bg-success text-success-foreground'
                                    )}>
                                      {activity.type}
                                    </span>
                                  </TableCell>
                                  <TableCell>{activity.customerName}</TableCell>
                                  <TableCell className="text-right">
                                    <span className="bg-red-600 text-white px-2 py-1 rounded font-semibold">
                                      {(activity.amount || 0).toLocaleString('vi-VN')} VNĐ
                                    </span>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden">
                      <ScrollArea className="h-60 border rounded-md p-2">
                        <div className="space-y-3">
                          {employeeActivityLog.map((activity, index) => {
                            const activityDate = new Date(activity.date);
                            return (
                              <Card key={activity.key} className={`border-l-4 ${activity.type === 'Tạo nợ' ? 'border-l-red-500' : 'border-l-green-500'}`}>
                                <CardContent className="p-3">
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-start">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">#{index + 1}</span>
                                        <span className={cn(
                                          "px-2 py-1 rounded-full text-xs font-semibold",
                                          activity.type === 'Tạo nợ' ? 'bg-destructive text-destructive-foreground' : 'bg-success text-success-foreground'
                                        )}>
                                          {activity.type}
                                        </span>
                                      </div>
                                      <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
                                        {(activity.amount || 0).toLocaleString('vi-VN')} VNĐ
                                      </span>
                                    </div>
                                    
                                    <div className="text-sm">
                                      <p className="font-medium">{activity.customerName}</p>
                                      <p className="text-muted-foreground text-xs">
                                        {activityDate.toLocaleDateString('vi-VN')} {activityDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>

    {isEditModalOpen && editingEmployee && (
        <Dialog open={isEditModalOpen} onOpenChange={() => { setIsEditModalOpen(false); setEditingEmployee(null); }}>
          <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa thông tin nhân viên</DialogTitle>
              <DialogDescription>
                Cập nhật tên và số điện thoại cho {editingEmployee.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
                <Label htmlFor="edit-name" className="md:text-right">
                  Tên
                </Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditFormChange}
                  className="md:col-span-3 bg-card"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
                <Label htmlFor="edit-phone" className="md:text-right">
                  Số điện thoại
                </Label>
                <Input
                  id="edit-phone"
                  name="phone"
                  value={editFormData.phone}
                  onChange={handleEditFormChange}
                  className="md:col-span-3 bg-card"
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => { setIsEditModalOpen(false); setEditingEmployee(null); }} className="w-full sm:w-auto">
                Hủy
              </Button>
              <Button onClick={handleSaveEmployeeInfo} className="bg-primary text-primary-foreground w-full sm:w-auto">Lưu thay đổi</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    {employeeToDelete && can_manage && (
        <AlertDialog open={isConfirmDeleteEmployeeOpen} onOpenChange={setIsConfirmDeleteEmployeeOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitleComponent>Xác nhận xóa nhân viên?</AlertDialogTitleComponent>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa nhân viên "{employeeToDelete.name}" (Email: {employeeToDelete.email})?
                Hành động này không thể hoàn tác và sẽ xóa cả yêu cầu truy cập liên quan (nếu có).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setIsConfirmDeleteEmployeeOpen(false); setEmployeeToDelete(null); }}>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDeleteEmployee} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                Xóa nhân viên
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    )}

      {can_manage && (
        <Dialog open={isReviewEmployeeRequestsDialogOpen} onOpenChange={setIsReviewEmployeeRequestsDialogOpen}>
            <DialogContent className="sm:max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Xét duyệt yêu cầu nhân viên ({employeeAccessRequests.length})</DialogTitle>
                    <DialogDescription>
                        Duyệt hoặc từ chối các yêu cầu truy cập với vai trò nhân viên.
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                    {isLoadingEmployeeRequests ? (
                        <p className="text-center text-muted-foreground">Đang tải danh sách yêu cầu...</p>
                    ) : employeeAccessRequests.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">Không có yêu cầu nhân viên nào đang chờ xử lý.</p>
                    ) : (
                        <>
                          {/* Desktop Table View */}
                          <div className="hidden md:block">
                            <ScrollArea className="max-h-[60vh] no-scrollbar">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tên</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>SĐT</TableHead>
                                            <TableHead>Địa chỉ</TableHead>
                                            <TableHead>Ngày YC</TableHead>
                                            <TableHead className="text-center">Hành động</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {employeeAccessRequests.map(req => (
                                            <TableRow key={req.id}>
                                                <TableCell>{req.fullName}</TableCell>
                                                <TableCell>{req.email}</TableCell>
                                                <TableCell>{formatPhoneNumber(req.phone)}</TableCell>
                                                <TableCell className="text-xs max-w-[150px] truncate" title={req.address || 'N/A'}>{req.address || 'N/A'}</TableCell>
                                                <TableCell>{new Date(req.requestDate).toLocaleDateString('vi-VN')}</TableCell>
                                                <TableCell className="text-center space-x-1">
                                                    <Button size="sm" className="bg-success hover:bg-success/90 h-7 px-2" onClick={() => handleApproveEmployeeRequest(req)}>
                                                        <CheckCircle className="h-4 w-4 mr-1"/>Kích hoạt
                                                    </Button>
                                                    <Button size="sm" variant="destructive" className="h-7 px-2" onClick={() => openRejectEmployeeDialog(req)}>
                                                        <XCircle className="h-4 w-4 mr-1"/>Từ chối
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                          </div>

                          {/* Mobile Card View */}
                          <div className="md:hidden">
                            <ScrollArea className="max-h-[60vh]">
                              <div className="space-y-3">
                                {employeeAccessRequests.map(req => (
                                  <Card key={req.id} className="border-l-4 border-l-orange-500">
                                    <CardContent className="p-4">
                                      <div className="space-y-3">
                                        <div>
                                          <h3 className="font-medium">{req.fullName}</h3>
                                          <p className="text-sm text-muted-foreground">{req.email}</p>
                                        </div>
                                        
                                        <div className="text-sm space-y-1">
                                          <p><span className="text-muted-foreground">SĐT:</span> {formatPhoneNumber(req.phone)}</p>
                                          <p><span className="text-muted-foreground">Địa chỉ:</span> {req.address || 'N/A'}</p>
                                          <p><span className="text-muted-foreground">Ngày YC:</span> {new Date(req.requestDate).toLocaleDateString('vi-VN')}</p>
                                        </div>

                                        <div className="flex gap-2 pt-2 border-t">
                                          <Button size="sm" className="bg-success hover:bg-success/90 flex-1" onClick={() => handleApproveEmployeeRequest(req)}>
                                            <CheckCircle className="h-4 w-4 mr-1"/>
                                            Kích hoạt
                                          </Button>
                                          <Button size="sm" variant="destructive" className="flex-1" onClick={() => openRejectEmployeeDialog(req)}>
                                            <XCircle className="h-4 w-4 mr-1"/>
                                            Từ chối
                                          </Button>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        </>
                    )}
                </div>
                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setIsReviewEmployeeRequestsDialogOpen(false)} className="w-full sm:w-auto">Đóng</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}

      {requestToReject && (
        <Dialog open={!!requestToReject} onOpenChange={() => setRequestToReject(null)}>
          <DialogContent className="w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Từ chối yêu cầu của {requestToReject.fullName}?</DialogTitle>
              <DialogDescription>
                Nhập lý do từ chối (nếu có). Lý do này sẽ được hiển thị cho người dùng.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Nhập lý do từ chối (tùy chọn)..."
              className="min-h-[100px]"
            />
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setRequestToReject(null)} className="w-full sm:w-auto">Hủy</Button>
              <Button variant="destructive" onClick={handleConfirmRejectEmployeeRequest} className="w-full sm:w-auto">Xác nhận từ chối</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
