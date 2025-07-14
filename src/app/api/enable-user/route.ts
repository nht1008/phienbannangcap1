import { NextResponse, type NextRequest } from 'next/server';
import { getAdminAuth, getAdminRealtimeDB } from '@/lib/firebase-admin';
import type { Employee } from '@/types';
import { withRoleAuthorization } from '@/lib/api-auth-middleware';

const handler = async (request: NextRequest) => {
  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminRealtimeDB();

    const { uid, role } = await request.json();
    
    if (!uid || !role) {
      return NextResponse.json({ message: 'Missing user ID or role' }, { status: 400 });
    }

    // Enable the user in Firebase Auth
    await adminAuth.updateUser(uid, { disabled: false });

    // Get the user access request data to create the employee record
    const isCustomer = role === 'customer';
    const requestPath = isCustomer ? `khach_hang_cho_duyet/${uid}` : `userAccessRequests/${uid}`;
    const finalDataPath = isCustomer ? `customers/${uid}` : `employees/${uid}`;

    const accessRequestRef = adminDb.ref(requestPath);
    const accessRequestSnapshot = await accessRequestRef.once('value');
    const accessRequestData = accessRequestSnapshot.val();

    if (!accessRequestData) {
        return NextResponse.json({ message: `Access request for user ${uid} not found at path ${requestPath}.` }, { status: 404 });
    }

    // Create the final user record in the correct location
    const finalUserData = {
      name: accessRequestData.fullName,
      email: accessRequestData.email,
      phone: accessRequestData.phone || '',
      address: accessRequestData.address || '',
      ...(isCustomer ? { zaloName: accessRequestData.zaloName || '' } : { position: 'Nhân viên' as Employee['position'] })
    };

    const updates: { [key: string]: any } = {};
    updates[finalDataPath] = finalUserData;
    updates[`userRoles/${uid}`] = role;
    updates[requestPath] = null; // Remove the original access request

    await adminDb.ref().update(updates);

    return NextResponse.json({ message: 'User enabled and record created successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error('Error enabling user:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
};

export const POST = withRoleAuthorization(['admin'], handler);