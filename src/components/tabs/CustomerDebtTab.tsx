'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { ref, query, orderByChild, equalTo, onValue } from 'firebase/database'
import { db } from '@/lib/firebase'
import type { DebtHistoryEntry } from '@/lib/debt-history'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Debt, Invoice, Customer, AuthUser } from '@/types'
import { formatCompactCurrency } from '@/lib/utils'
import { CalendarDays, CreditCard, Receipt, Wallet, Calendar, DollarSign, FileText, History } from 'lucide-react'

interface CustomerDebtTabProps {
  debts: Debt[]
  invoices: Invoice[]
  currentUser: AuthUser | null
  currentUserCustomerData: Customer | null
}

interface DebtHistoryItem {
  id: string
  type: 'debt' | 'payment'
  date: string
  amount: number
  description: string
  remainingAmount?: number
  invoiceId?: string
}

export default function CustomerDebtTab({ 
  debts, 
  invoices, 
  currentUser,
  currentUserCustomerData
}: CustomerDebtTabProps) {
  console.log('🎯 CustomerDebtTab Component Rendered!', {
    timestamp: new Date().toISOString(),
    propsReceived: {
      debtsLength: debts?.length || 0,
      invoicesLength: invoices?.length || 0,
      hasCurrentUser: !!currentUser,
      hasCurrentUserCustomerData: !!currentUserCustomerData
    }
  })

  const [selectedDebtHistory, setSelectedDebtHistory] = useState<DebtHistoryEntry[] | null>(null)
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [qrPaymentDebt, setQrPaymentDebt] = useState<Debt | null>(null)
  const [isQrPaymentOpen, setIsQrPaymentOpen] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // Filter debts for current customer
  const customerDebts = useMemo(() => {
    if (!currentUser) {
      console.log('🔍 CustomerDebtTab Debug - ALWAYS RUNS:', {
        hasCurrentUser: false,
        reason: 'No currentUser provided'
      })
      return []
    }

    console.log('🔍 CustomerDebtTab Debug - ALWAYS RUNS:', {
      hasCurrentUser: !!currentUser,
      currentUserUid: currentUser.uid,
      currentUserEmail: currentUser.email,
      currentUserDisplayName: currentUser.displayName,
      currentUserCustomerId: currentUser.uid,
      totalDebtsInSystem: debts?.length || 0,
      totalInvoicesInSystem: invoices?.length || 0,
      timestamp: new Date().toISOString()
    })

    console.log('🚀 ABOUT TO FILTER - Checking invoices first...')

    // Enhanced invoice analysis
    const customerInvoices = invoices.filter(invoice => invoice.customerId === currentUser.uid)
    const invoicesWithDebt = customerInvoices.filter(invoice => {
      const debtAmount = invoice.total - (invoice.amountPaid || 0)
      return debtAmount > 0
    })
    
    console.log('💰 Invoice Debt Analysis - BEFORE DEBT FILTER:', {
      customerUid: currentUser.uid,
      totalInvoices: invoices.length,
      customerInvoices: customerInvoices.length,
      invoicesWithDebt: invoicesWithDebt.length,
      invoiceDebtDetails: invoicesWithDebt.map(invoice => ({
        invoiceId: invoice.id,
        total: invoice.total,
        amountPaid: invoice.amountPaid || 0,
        debtAmount: invoice.total - (invoice.amountPaid || 0),
        paymentDifference: invoice.total - (invoice.amountPaid || 0)
      }))
    })

    // Check for mismatch between invoices with debt and actual debt records
    if (invoicesWithDebt.length > 0 && debts.length === 0) {
      console.log('🚨 CRITICAL: Found invoices with debt but no debt records!')
      console.log('🔍 Detailed Invoice Analysis:')
      invoicesWithDebt.forEach((invoice, index) => {
        const debtAmount = invoice.total - (invoice.amountPaid || 0)
        console.log(`📋 Invoice ${index + 1}:`, {
          fullInvoiceObject: invoice,
          shouldHaveCreatedDebt: debtAmount > 0,
          debtAmount: debtAmount,
          paymentDifference: invoice.total - (invoice.amountPaid || 0)
        })
      })
    }

    const filteredDebts = debts.filter(debt => 
      debt.customerId === currentUser.uid && debt.remainingAmount > 0
    )
    
    console.log('📊 Filter Results:', {
      searchingForCustomerId: currentUser.uid,
      totalDebtsInSystem: debts.length,
      filteredDebtsCount: filteredDebts.length,
      matchedDebts: filteredDebts
    })

    return filteredDebts
  }, [debts, currentUser, invoices])

  const totalDebt = useMemo(() => {
    return customerDebts.reduce((sum, debt) => sum + debt.remainingAmount, 0)
  }, [customerDebts])

  const totalPaidDebts = useMemo(() => {
    return debts.filter(debt => 
      debt.customerId === currentUser?.uid && debt.remainingAmount === 0
    ).length
  }, [debts, currentUser])

  const totalDebtsCount = useMemo(() => {
    return debts.filter(debt => debt.customerId === currentUser?.uid).length
  }, [debts, currentUser])

  const handleViewAllHistory = () => {
    if (!currentUser) return;
    
    setSelectedDebtId("Tất cả")
    setSelectedCustomerId(currentUser.uid)
    setIsLoadingHistory(true)
    
    // Query debt history from Firebase for all debts of current customer
    const historyQuery = query(
      ref(db, 'debtHistory'),
      orderByChild('customerId'),
      equalTo(currentUser.uid)
    );

    onValue(historyQuery, (snapshot) => {
      const data = snapshot.val();
      const historyArray: DebtHistoryEntry[] = data 
        ? Object.keys(data).map(key => ({ id: key, ...data[key] }))
        : [];
      
      // Sắp xếp theo thời gian giảm dần (mới nhất trước)
      historyArray.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setSelectedDebtHistory(historyArray);
      setIsLoadingHistory(false);
    }, (error) => {
      console.error("Error fetching debt history:", error);
      setIsLoadingHistory(false);
    });
  }

  const handleQRPayment = (debt: Debt) => {
    setQrPaymentDebt(debt)
    setIsQrPaymentOpen(true)
  }

  const getActionBadge = (action: DebtHistoryEntry['action']) => {
    switch (action) {
      case 'CREATE_DEBT':
        return <Badge variant="destructive"><FileText className="w-3 h-3 mr-1" />Tạo nợ</Badge>;
      case 'PAYMENT':
        return <Badge className="bg-green-600 text-white"><DollarSign className="w-3 h-3 mr-1" />Thanh toán</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getAmountDisplay = (entry: DebtHistoryEntry) => {
    const isNegative = entry.action === 'PAYMENT';
    const backgroundClass = isNegative ? 'bg-green-600' : 'bg-red-600';

    return (
      <span className={`font-medium text-white px-2 py-1 rounded ${backgroundClass}`}>
        {isNegative ? '-' : '+'}{entry.amount.toLocaleString('vi-VN')} VNĐ
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!currentUser) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Vui lòng đăng nhập để xem thông tin công nợ
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Debt List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Danh sách công nợ
              </CardTitle>
              <CardDescription>
                Chi tiết từng khoản nợ và thanh toán
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewAllHistory}
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              Lịch sử
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {customerDebts.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Bạn không có công nợ nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {customerDebts.map((debt) => (
                <Card key={debt.id} className="border bg-red-50 border-red-200">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            Mã nợ: {debt.id.slice(-8)}
                          </h3>
                          <Badge variant="destructive">
                            Chưa thanh toán
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <CalendarDays className="h-4 w-4" />
                          {formatDate(debt.date)}
                        </div>
                        {debt.invoiceId && (
                          <div className="text-sm text-muted-foreground">
                            HĐ: <span 
                              className="text-blue-500 cursor-pointer hover:underline" 
                              onClick={() => {
                                if (typeof window !== 'undefined' && navigator.clipboard) {
                                  navigator.clipboard.writeText(debt.invoiceId!);
                                }
                              }}
                              title="Click để copy ID hóa đơn"
                            >
                              {debt.invoiceId}
                            </span>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Số tiền gốc:</span>
                            <div className="font-semibold">{formatCompactCurrency(debt.originalAmount)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Còn lại:</span>
                            <div className="font-semibold text-red-600">
                              {formatCompactCurrency(debt.remainingAmount)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          onClick={() => handleQRPayment(debt)}
                          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                        >
                          💳 Thanh toán
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debt History Dialog */}
      <Dialog open={selectedDebtHistory !== null} onOpenChange={() => setSelectedDebtHistory(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDebtId === "Tất cả" ? "Tất cả lịch sử công nợ" : `Lịch sử công nợ ${selectedDebtId}`}
            </DialogTitle>
            <DialogDescription asChild>
              <div>
                {selectedDebtId === "Tất cả" ? (
                  "Chi tiết quá trình tạo nợ và thanh toán"
                ) : (
                  "Chi tiết quá trình tạo nợ và thanh toán"
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-40">
                <p>Đang tải lịch sử...</p>
              </div>
            ) : selectedDebtHistory && selectedDebtHistory.length > 0 ? (
              selectedDebtHistory.map((entry, index) => {
                const entryDate = new Date(entry.date);
                const isFirstEntry = index === 0; // Dòng mới nhất
                const displayDebt = isFirstEntry ? totalDebt : entry.remainingDebt;
                return (
                  <Card key={entry.id} className={`border ${entry.action === 'CREATE_DEBT' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getActionBadge(entry.action)}
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {entryDate.toLocaleDateString('vi-VN')} {entryDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="text-sm">
                            {entry.invoiceId && (
                              <div className="text-xs text-muted-foreground mt-1">
                                HĐ: <span 
                                  className="text-blue-500 cursor-pointer hover:underline" 
                                  onClick={() => {
                                    if (typeof window !== 'undefined' && navigator.clipboard) {
                                      navigator.clipboard.writeText(entry.invoiceId!);
                                    }
                                  }}
                                  title="Click để copy ID hóa đơn"
                                >
                                  {entry.invoiceId}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Tổng còn nợ: </span>
                            <span className={`font-semibold ${displayDebt === 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {displayDebt.toLocaleString('vi-VN')} VNĐ
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Nhân viên: {entry.employeeName}
                          </div>
                        </div>
                        <div className="text-right">
                          {getAmountDisplay(entry)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Không có lịch sử công nợ.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Payment Dialog */}
      <Dialog open={isQrPaymentOpen} onOpenChange={setIsQrPaymentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              💳 Thanh toán qua QR Code
            </DialogTitle>
            <DialogDescription>
              Quét mã QR để thanh toán công nợ {qrPaymentDebt?.id}
            </DialogDescription>
          </DialogHeader>
          
          {qrPaymentDebt && (
            <div className="space-y-4">
              {/* Debt Info */}
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Số tiền cần thanh toán:</span>
                      <span className="text-lg font-bold text-blue-600">
                        {formatCompactCurrency(qrPaymentDebt.remainingAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Mã công nợ:</span>
                      <span className="text-sm font-mono">
                        {qrPaymentDebt.id}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* QR Code Placeholder */}
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="p-8 text-center">
                  <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <div className="text-center">
                      <div className="text-6xl mb-2">📱</div>
                      <div className="text-sm text-muted-foreground">QR Code sẽ hiển thị ở đây</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sử dụng app ngân hàng để quét mã QR và thanh toán
                  </p>
                </CardContent>
              </Card>

              {/* Payment Instructions */}
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2 text-yellow-800">📋 Hướng dẫn thanh toán:</h4>
                  <ol className="text-sm text-yellow-700 space-y-1">
                    <li>1. Mở app ngân hàng của bạn</li>
                    <li>2. Chọn chức năng "Quét QR" hoặc "Chuyển khoản QR"</li>
                    <li>3. Quét mã QR phía trên</li>
                    <li>4. Kiểm tra thông tin và xác nhận thanh toán</li>
                    <li>5. Chờ nhân viên xác nhận đã nhận được tiền</li>
                  </ol>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsQrPaymentOpen(false)}
                  className="flex-1"
                >
                  Hủy
                </Button>
                <Button 
                  onClick={() => {
                    // TODO: Implement payment confirmation logic
                    alert('Tính năng xác nhận thanh toán sẽ được bổ sung sau!')
                    setIsQrPaymentOpen(false)
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  ✅ Đã thanh toán
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
