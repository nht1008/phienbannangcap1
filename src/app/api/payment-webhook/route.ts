import { NextRequest, NextResponse } from 'next/server';
import { ref, get, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import crypto from 'crypto';

/**
 * SePay webhook endpoint for automatic payment confirmation
 * Handles bank transfer notifications from SePay service
 */
export async function POST(req: NextRequest) {
  try {
    // SePay signature verification
    const signature = req.headers.get('X-SePay-Signature');
    const rawBody = await req.text();
    
    // Verify SePay signature (if provided)
    if (signature && process.env.SEPAY_WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.SEPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');
      
      if (signature !== expectedSignature) {
        console.error('Invalid SePay signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);

    console.log('📦 SePay webhook received:', payload);

    // SePay typically sends data in this format:
    // {
    //   "transferType": "in", 
    //   "transferAmount": 50000,
    //   "accountNumber": "0123456789",
    //   "subAccount": "",
    //   "transferContent": "CK don hang ORDER123456",
    //   "referenceCode": "FT21234567890",
    //   "description": "Customer payment",
    //   "transferTime": "2025-01-18 10:30:45"
    // }
    
    const { 
      transferContent, 
      transferAmount, 
      referenceCode, 
      transferTime,
      transferType = "in"
    } = payload;

    // Only process incoming transfers
    if (transferType !== "in") {
      console.log('Ignoring outgoing transfer');
      return NextResponse.json({ received: true, message: 'Outgoing transfer ignored.' });
    }

    if (!transferContent || !transferAmount) {
      console.warn('Missing required fields in SePay webhook:', payload);
      return NextResponse.json({ error: 'Missing transfer content or amount' }, { status: 400 });
    }

    // Extract order ID from transfer content
    // Expected format: "CK don hang ORDER123456" or "Thanh toan don hang ORDER123456"
    const orderIdMatch = transferContent.match(/ORDER[A-Za-z0-9-_]+|[A-Za-z0-9-_]{20,}/);
    if (!orderIdMatch) {
      console.warn('Could not extract order ID from transfer content:', transferContent);
      return NextResponse.json({ error: 'Order ID not found in transfer content' }, { status: 400 });
    }

    const orderId = orderIdMatch[0];
    console.log('📝 Processing payment for order:', orderId);

    // Check if this is an Order (pending) or already an Invoice
    const orderRef = ref(db, `orders/${orderId}`);
    const invoiceRef = ref(db, `invoices/${orderId}`);
    
    const [orderSnapshot, invoiceSnapshot] = await Promise.all([
      get(orderRef),
      get(invoiceRef)
    ]);

    if (orderSnapshot.exists()) {
      // Update order status to completed
      const orderData = orderSnapshot.val();
      
      // Verify amount matches (with some tolerance for bank fees)
      const expectedAmount = orderData.totalAmount;
      const tolerance = expectedAmount * 0.05; // 5% tolerance
      
      if (Math.abs(transferAmount - expectedAmount) > tolerance) {
        console.warn(`Amount mismatch: expected ${expectedAmount}, received ${transferAmount}`);
        // Still process but log the discrepancy
      }

      const updates = {
        [`orders/${orderId}/orderStatus`]: 'Hoàn thành',
        [`orders/${orderId}/paymentStatus`]: 'Đã thanh toán',
        [`orders/${orderId}/paymentDetails`]: {
          method: 'Chuyển khoản',
          amount: transferAmount,
          referenceCode: referenceCode,
          paidAt: transferTime || new Date().toISOString(),
          autoConfirmed: true
        },
        [`orders/${orderId}/completionDate`]: new Date().toISOString()
      };

      await update(ref(db), updates);
      console.log(`✅ Order ${orderId} automatically confirmed via SePay`);
      
    } else if (invoiceSnapshot.exists()) {
      // This is already an invoice, update payment status
      const invoiceData = invoiceSnapshot.val();
      
      const updates = {
        [`invoices/${orderId}/paymentStatus`]: 'Đã thanh toán',
        [`invoices/${orderId}/paymentDetails`]: {
          method: 'Chuyển khoản',
          amount: transferAmount,
          referenceCode: referenceCode,
          paidAt: transferTime || new Date().toISOString(),
          autoConfirmed: true
        }
      };

      await update(ref(db), updates);
      console.log(`✅ Invoice ${orderId} payment confirmed via SePay`);
      
    } else {
      console.warn(`Order/Invoice ${orderId} not found in database`);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      received: true, 
      message: 'Payment confirmed successfully via SePay',
      orderId: orderId,
      amount: transferAmount
    });
  } catch (error) {
    console.error('Error processing payment webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to process webhook.', details: errorMessage }, { status: 500 });
  }
}