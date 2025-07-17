'use client'

import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Debt, Invoice, Customer, AuthUser } from '@/types'
import { formatCompactCurrency } from '@/lib/utils'
import { CalendarDays, CreditCard, Receipt, Wallet } from 'lucide-react'

interface CustomerDebtTabProps {
  debts: Debt[]
  invoices: Invoice[]
  currentUser: AuthUser | null
  currentUserCustomerData: Customer | null
}
import { Debt, Invoice, Customer, AuthUser } from '@/types'
import { formatCompactCurrency } from '@/lib/utils'
import { CalendarDays, CreditCard, Receipt, Wallet } from 'lucide-react'

interface CustomerDebtTabProps {
  debts: Debt[]
  invoices: Invoice[]
  currentUser: AuthUser | null
  currentUserCustomerData?: Customer | null
  onOpenPaymentDialog?: (debt: Debt) => void
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
  currentUserCustomerData,
  onOpenPaymentDialog 
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

  const [selectedDebtHistory, setSelectedDebtHistory] = useState<DebtHistoryItem[] | null>(null)
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null)
  const [qrPaymentDebt, setQrPaymentDebt] = useState<Debt | null>(null)
  const [isQrPaymentOpen, setIsQrPaymentOpen] = useState(false)

  // Filter debts for current customer
  const customerDebts = useMemo(() => {
    console.log('🔍 CustomerDebtTab Debug - ALWAYS RUNS:', {
      hasCurrentUser: !!currentUser,
      currentUserUid: currentUser?.uid,
      currentUserEmail: currentUser?.email,
      currentUserDisplayName: currentUser?.displayName,
      currentUserCustomerId: currentUserCustomerData?.id,
      currentUserCustomerName: currentUserCustomerData?.name,
      totalDebts: debts.length,
      debtsArray: debts.length > 0 ? debts.map(d => ({
        id: d.id,
        customerId: d.customerId,
        customerName: d.customerName,
        amount: d.remainingAmount
      })) : 'NO DEBTS FOUND',
      allCustomerIds: debts.length > 0 ? [...new Set(debts.map(d => d.customerId))] : 'NO CUSTOMER IDS'
    })
    
    if (!currentUser?.uid) {
      console.log('❌ No currentUser.uid - cannot filter debts')
      return []
    }
    
    // 🔍 IMMEDIATE: Check for invoices with debt amounts for this customer BEFORE filtering debts
    console.log('🚀 ABOUT TO FILTER - Checking invoices first...')
    const customerInvoicesWithDebtPreFilter = invoices.filter(invoice => 
      invoice.customerId === currentUser.uid && 
      invoice.debtAmount && 
      invoice.debtAmount > 0
    );
    
    console.log('💰 Invoice Debt Analysis - BEFORE DEBT FILTER:', {
      customerUid: currentUser.uid,
      totalInvoices: invoices.length,
      customerInvoices: invoices.filter(inv => inv.customerId === currentUser.uid).length,
      invoicesWithDebt: customerInvoicesWithDebtPreFilter.length,
      invoiceDebtDetails: customerInvoicesWithDebtPreFilter.map(inv => ({
        id: inv.id,
        date: inv.date,
        total: inv.total,
        amountPaid: inv.amountPaid,
        debtAmount: inv.debtAmount,
        customerId: inv.customerId,
        orderSource: inv.orderSource
      }))
    })

    // 🚨 CRITICAL DEBUG: Show detailed invoice data
    if (customerInvoicesWithDebtPreFilter.length > 0) {
      console.log('🚨 CRITICAL: Found invoices with debt but no debt records!')
      console.log('🔍 Detailed Invoice Analysis:')
      customerInvoicesWithDebtPreFilter.forEach((invoice, index) => {
        console.log(`📋 Invoice ${index + 1}:`, {
          fullInvoiceObject: invoice,
          shouldHaveCreatedDebt: (invoice.debtAmount || 0) > 0,
          debtAmount: invoice.debtAmount,
          paymentDifference: invoice.total - (invoice.amountPaid || 0)
        })
      })
    }

    // Filter by currentUser.uid (which should match customer.id)
    const filtered = debts.filter(debt => debt.customerId === currentUser.uid)
    
    console.log('📊 Filter Results:', {
      searchingForCustomerId: currentUser.uid,
      totalDebtsInSystem: debts.length,
      filteredDebtsCount: filtered.length,
      matchedDebts: filtered.map(d => ({
        id: d.id,
        customerId: d.customerId,
        customerName: d.customerName,
        remainingAmount: d.remainingAmount
      }))
    })
    
    if (filtered.length === 0 && debts.length > 0) {
      console.log('❌ MISMATCH DETECTED!')
      console.log('Current User UID:', currentUser.uid)
      console.log('Available Customer IDs in debts:', [...new Set(debts.map(d => d.customerId))])
      console.log('Debt Customer Names:', [...new Set(debts.map(d => d.customerName))])
    }
    
    return filtered
  }, [debts, currentUser?.uid, currentUserCustomerData])

  // Filter invoices for current customer that created debt
  const customerDebtInvoices = useMemo(() => {
    if (!currentUser?.uid) return []
    return invoices.filter(invoice => 
      invoice.customerId === currentUser.uid && 
      invoice.orderSource === 'store-debt'
    )
  }, [invoices, currentUser?.uid])

  // Calculate total debt
  const totalDebt = useMemo(() => {
    return customerDebts.reduce((sum, debt) => sum + debt.remainingAmount, 0)
  }, [customerDebts])

  // Create debt history for a specific debt
  const createDebtHistory = (debt: Debt): DebtHistoryItem[] => {
    const history: DebtHistoryItem[] = []
    
    // Find the invoice that created this debt
    const relatedInvoice = customerDebtInvoices.find(invoice => 
      Math.abs(invoice.total - debt.originalAmount) < 0.01 &&
      new Date(invoice.date).getTime() <= new Date(debt.date).getTime() + 86400000 // within 24 hours
    )

    // Add debt creation
    history.push({
      id: `debt-${debt.id}`,
      type: 'debt',
      date: debt.date,
      amount: debt.originalAmount,
      description: relatedInvoice 
        ? `Tạo nợ từ hóa đơn #${relatedInvoice.id.slice(-6).toUpperCase()}`
        : 'Tạo công nợ',
      remainingAmount: debt.originalAmount,
      invoiceId: relatedInvoice?.id
    })

    // Add payments
    const payments = Array.isArray(debt.payments) ? debt.payments : [];
    payments.forEach((payment, index) => {
      const remainingAfterPayment = debt.originalAmount - payments.slice(0, index + 1).reduce((sum, p) => sum + p.amountPaid, 0)
      history.push({
        id: `payment-${debt.id}-${index}`,
        type: 'payment',
        date: payment.paymentDate,
        amount: payment.amountPaid,
        description: payment.notes || 'Thanh toán công nợ',
        remainingAmount: remainingAfterPayment
      })
    })

    return history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const handleViewHistory = (debt: Debt) => {
    const history = createDebtHistory(debt)
    setSelectedDebtHistory(history)
    setSelectedDebtId(debt.id)
  }

  const handleQRPayment = (debt: Debt) => {
    setQrPaymentDebt(debt)
    setIsQrPaymentOpen(true)
  }

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
      {/* Summary Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Tổng quan công nợ
          </CardTitle>
          <CardDescription>
            Thông tin tổng hợp về công nợ hiện tại của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {customerDebts.length}
              </div>
              <div className="text-sm text-blue-600">Khoản nợ</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {formatCompactCurrency(totalDebt)}
              </div>
              <div className="text-sm text-red-600">Tổng nợ</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {customerDebts.filter(debt => debt.remainingAmount === 0).length}
              </div>
              <div className="text-sm text-green-600">Đã thanh toán</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debt List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Danh sách công nợ
          </CardTitle>
          <CardDescription>
            Chi tiết từng khoản nợ và lịch sử thanh toán
          </CardDescription>
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
                <Card key={debt.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            Mã nợ: #{debt.id.slice(-6).toUpperCase()}
                          </h3>
                          <Badge variant={debt.remainingAmount === 0 ? "secondary" : "destructive"}>
                            {debt.remainingAmount === 0 ? "Đã thanh toán" : "Chưa thanh toán"}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <CalendarDays className="h-4 w-4" />
                          {formatDate(debt.date)}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Số tiền gốc:</span>
                            <div className="font-semibold">{formatCompactCurrency(debt.originalAmount)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Còn lại:</span>
                            <div className={`font-semibold ${debt.remainingAmount === 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCompactCurrency(debt.remainingAmount)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewHistory(debt)}
                          className="w-full sm:w-auto"
                        >
                          Xem lịch sử
                        </Button>
                        {debt.remainingAmount > 0 && (
                          <Button
                            size="sm"
                            onClick={() => handleQRPayment(debt)}
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                          >
                            💳 Thanh toán qua QR
                          </Button>
                        )}
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Lịch sử công nợ #{selectedDebtId?.slice(-6).toUpperCase()}
            </DialogTitle>
            <DialogDescription asChild>
              <div>Chi tiết quá trình tạo nợ và thanh toán</div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDebtHistory?.map((item, index) => (
              <Card key={item.id} className={`border ${item.type === 'debt' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {item.type === 'debt' ? (
                          <CreditCard className="h-4 w-4 text-red-600" />
                        ) : (
                          <Wallet className="h-4 w-4 text-green-600" />
                        )}
                        <span className={`font-semibold ${item.type === 'debt' ? 'text-red-700' : 'text-green-700'}`}>
                          {item.type === 'debt' ? 'Tạo nợ' : 'Thanh toán'}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(item.date)}
                      </div>
                      <div className="text-sm">
                        {item.description}
                      </div>
                      {item.remainingAmount !== undefined && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Còn lại sau giao dịch: </span>
                          <span className={`font-semibold ${item.remainingAmount === 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCompactCurrency(item.remainingAmount)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={`text-right font-semibold ${item.type === 'debt' ? 'text-red-600' : 'text-green-600'}`}>
                      {item.type === 'debt' ? '+' : '-'}{formatCompactCurrency(item.amount)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
              Quét mã QR để thanh toán công nợ #{qrPaymentDebt?.id.slice(-6).toUpperCase()}
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
                        #{qrPaymentDebt.id.slice(-6).toUpperCase()}
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
