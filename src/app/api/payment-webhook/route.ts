import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';
import { firebaseApp as app } from '@/lib/firebase'; // Assuming firebase app is initialized here

const firestore = getFirestore(app);

/**
 * This is a webhook endpoint to handle incoming payment notifications.
 * It should be called by your payment provider whenever a successful transaction occurs.
 */
export async function POST(req: NextRequest) {
  try {
    // SECURITY WARNING: It is crucial to verify that the request is coming from your trusted payment provider.
    // Most providers sign their webhook requests (e.g., using a secret key). You MUST verify this signature
    // before trusting the payload. Failing to do so will expose your application to security risks.
    // The verification logic depends on the provider (e.g., checking an 'Authorization' header or a signature in the payload).
    //
    // Example (conceptual):
    // const signature = req.headers.get('X-Payment-Signature');
    // const isValid = verifySignature(await req.text(), signature); // You'd need to implement verifySignature
    // if (!isValid) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    const payload = await req.json();

    // The structure of the payload depends entirely on your payment provider.
    // You will need to adapt this code to match the data they send.
    // For example, a service monitoring bank transfers might send something like:
    // {
    //   "transactionId": "FT123456789",
    //   "amount": 50000,
    //   "description": "CK don hang ABCXYZ", // You might need to parse the order ID from here
    //   "timestamp": "2025-07-01T10:00:00Z"
    // }
    const { orderId, amount, transactionId } = payload; // This is a simplified, ideal structure.

    if (!orderId) {
      console.warn('Webhook received without an orderId:', payload);
      return NextResponse.json({ error: 'Order ID is missing in payload' }, { status: 400 });
    }

    // TODO: It's good practice to fetch the order from your database first.
    // 1. Check if the order exists.
    // 2. Verify that the order is not already marked as 'paid'.
    // 3. Check if the `amount` from the webhook matches the order's total amount.

    const orderRef = doc(firestore, 'orders', orderId);

    // Update the order status to 'paid' and store payment details.
    await updateDoc(orderRef, {
      status: 'paid',
      paymentMethod: 'webhook',
      paymentDetails: {
        transactionId,
        amount,
        paidAt: new Date(),
      },
    });

    console.log(`Payment confirmed for order ${orderId} via webhook.`);

    // When this update happens, your client-side application (if it's listening
    // to Firestore real-time updates for this order) will see the change
    // and can then display a "Payment Successful" notification to the user.

    return NextResponse.json({ received: true, message: 'Payment confirmed successfully.' });
  } catch (error) {
    console.error('Error processing payment webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to process webhook.', details: errorMessage }, { status: 500 });
  }
}