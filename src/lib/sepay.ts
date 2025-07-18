/**
 * SePay integration service
 * Handles automatic bank transfer monitoring and QR code generation
 */

interface SeBankAccount {
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
}

interface SePayQRData {
  accountNumber: string;
  accountName: string;
  amount: number;
  description: string;
  bankCode?: string;
}

/**
 * Default bank account for receiving payments
 * Replace with actual SePay registered account details
 */
export const DEFAULT_BANK_ACCOUNT: SeBankAccount = {
  accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || "0123456789",
  accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "FLEUR FLOWER SHOP",
  bankName: process.env.NEXT_PUBLIC_BANK_NAME || "Vietcombank",
  bankCode: process.env.NEXT_PUBLIC_BANK_CODE || "VCB"
};

/**
 * Generate QR code content for bank transfer
 */
export function generateBankQRContent(data: SePayQRData): string {
  const { accountNumber, accountName, amount, description, bankCode } = data;
  
  // VietQR format for Vietnamese banks
  // Format: bankCode|accountNumber|accountName|amount|description
  return `${bankCode || DEFAULT_BANK_ACCOUNT.bankCode}|${accountNumber}|${accountName}|${amount}|${description}`;
}

/**
 * Generate payment description with order ID for tracking
 */
export function generatePaymentDescription(orderId: string, customerName?: string): string {
  const shortOrderId = orderId.substring(0, 8);
  if (customerName) {
    return `CK don hang ${shortOrderId} ${customerName}`;
  }
  return `Thanh toan don hang ${shortOrderId}`;
}

/**
 * Register webhook with SePay service
 * This should be called once during setup
 */
export async function registerSePayWebhook(webhookUrl: string): Promise<boolean> {
  try {
    if (!process.env.SEPAY_API_KEY || !process.env.SEPAY_SECRET_KEY) {
      console.error('SePay credentials not configured');
      return false;
    }

    // SePay API endpoint for webhook registration
    const response = await fetch(`${process.env.SEPAY_API_URL}/webhook/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SEPAY_API_KEY}`,
      },
      body: JSON.stringify({
        webhook_url: webhookUrl,
        account_number: DEFAULT_BANK_ACCOUNT.accountNumber,
        events: ['transfer_in'] // Only listen for incoming transfers
      })
    });

    if (response.ok) {
      console.log('✅ SePay webhook registered successfully');
      return true;
    } else {
      console.error('❌ Failed to register SePay webhook:', await response.text());
      return false;
    }
  } catch (error) {
    console.error('❌ Error registering SePay webhook:', error);
    return false;
  }
}

/**
 * Get SePay account balance (for monitoring)
 */
export async function getSePayBalance(): Promise<number | null> {
  try {
    if (!process.env.SEPAY_API_KEY) return null;

    const response = await fetch(`${process.env.SEPAY_API_URL}/account/balance`, {
      headers: {
        'Authorization': `Bearer ${process.env.SEPAY_API_KEY}`,
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data.balance || 0;
    }
    return null;
  } catch (error) {
    console.error('Error fetching SePay balance:', error);
    return null;
  }
}

/**
 * Check transaction history from SePay
 */
export async function getSePayTransactions(
  limit: number = 10, 
  fromDate?: string, 
  toDate?: string
): Promise<any[]> {
  try {
    if (!process.env.SEPAY_API_KEY) return [];

    const params = new URLSearchParams({
      limit: limit.toString(),
      account_number: DEFAULT_BANK_ACCOUNT.accountNumber
    });

    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);

    const response = await fetch(`${process.env.SEPAY_API_URL}/transactions?${params}`, {
      headers: {
        'Authorization': `Bearer ${process.env.SEPAY_API_KEY}`,
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data.transactions || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching SePay transactions:', error);
    return [];
  }
}

/**
 * Validate SePay webhook signature
 */
export function validateSePaySignature(
  payload: string, 
  signature: string, 
  secret: string
): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return signature === expectedSignature;
}
