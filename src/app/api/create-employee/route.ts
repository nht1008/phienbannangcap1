
import { NextResponse, type NextRequest } from 'next/server';
import { getAdminAuth, getAdminRealtimeDB } from '@/lib/firebase-admin';
import type { Employee, EmployeePosition } from '@/types';
import { withRoleAuthorization } from '@/lib/api-auth-middleware';

const handler = async (request: NextRequest) => {
  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminRealtimeDB();
    
    const { email, password, name, position, phone, address } = await request.json();

    if (!email || !password || !name || !position) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    let userRecord;
    try {
      // Create user in Firebase Auth
      userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: name,
      });
    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') {
        // If email exists, fetch the user record instead of failing.
        // This handles cases where the Auth user was created but the DB entry failed.
        userRecord = await adminAuth.getUserByEmail(email);
      } else {
        // Re-throw other errors
        throw error;
      }
    }

    if (!userRecord) {
        return NextResponse.json({ message: 'Could not create or find user account.' }, { status: 500 });
    }
    
    // Create or update employee record in Realtime Database
    const employeeData: Omit<Employee, 'id'> = {
      name,
      email,
      position,
      phone: phone || '',
      address: address || '',
    };

    // This now becomes an "upsert" operation, creating or overwriting the employee data.
    await adminDb.ref(`employees/${userRecord.uid}`).set(employeeData);

    return NextResponse.json({ message: 'Employee created or updated successfully', uid: userRecord.uid }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating employee:', error);
    
    if (error.code === 'auth/email-already-exists') {
        return NextResponse.json({ message: 'Địa chỉ email này đã được sử dụng.' }, { status: 409 });
    }
     if (error.code === 'auth/invalid-password') {
        return NextResponse.json({ message: 'Mật khẩu phải có ít nhất 6 ký tự.' }, { status: 400 });
    }
    
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
};

export const POST = withRoleAuthorization(['admin'], handler);
