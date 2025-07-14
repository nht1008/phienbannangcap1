import { NextResponse, type NextRequest } from 'next/server';
import { getAdminAuth, getAdminRealtimeDB } from '@/lib/firebase-admin';
import type { UserAccessRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminRealtimeDB();

    const { email, password, fullName, phone, address, role, zaloName } = await request.json();

    if (!email || !password || !fullName || !role || !phone || !address) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Create user in Firebase Auth, but disabled by default
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: fullName,
      disabled: true, // The key change is here
    });

    // Now, create an access request in the Realtime Database using the new UID
    const basePath = role === 'customer' ? 'khach_hang_cho_duyet' : 'userAccessRequests';
    const requestRef = adminDb.ref(`${basePath}/${userRecord.uid}`);

    const requestData: Omit<UserAccessRequest, 'id'> = {
      uid: userRecord.uid,
      fullName,
      email,
      phone,
      address,
      zaloName: role === 'customer' ? zaloName || '' : '',
      requestedRole: role,
      status: 'pending',
      requestDate: new Date().toISOString(),
    };

    await requestRef.set(requestData);

    return NextResponse.json({ message: 'Registration request sent successfully. Your account is pending approval.', uid: userRecord.uid }, { status: 201 });

  } catch (error: any) {
    console.error('Error during registration request:', error);

    if (error.message.includes('Firebase Admin SDK initialization failed')) {
        return NextResponse.json({ message: 'Lỗi cấu hình máy chủ: Khóa dịch vụ Firebase không được thiết lập.' }, { status: 503 });
    }
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({ message: 'Địa chỉ email này đã được sử dụng.' }, { status: 409 });
    }
    if (error.code === 'auth/invalid-password') {
      return NextResponse.json({ message: 'Mật khẩu phải có ít nhất 6 ký tự.' }, { status: 400 });
    }

    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}