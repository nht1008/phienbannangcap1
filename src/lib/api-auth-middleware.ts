import { NextResponse, type NextRequest } from 'next/server';
import admin from 'firebase-admin';
import { getAdminAuth, getAdminRealtimeDB } from '@/lib/firebase-admin';
import type { UserRole } from '@/types';

type ApiHandler = (request: NextRequest, context: { params: any; decodedToken: admin.auth.DecodedIdToken }) => Promise<NextResponse>;

type Role = 'admin' | 'manager' | 'employee' | 'customer';

export function withRoleAuthorization(requiredRoles: Role[], handler: ApiHandler) {
  return async (request: NextRequest, context: { params: any }) => {
    try {
      const adminAuth = getAdminAuth();
      const adminDb = getAdminRealtimeDB();
      const authorization = request.headers.get('Authorization');

      if (!authorization?.startsWith('Bearer ')) {
        return NextResponse.json({ message: 'Unauthorized: No token provided' }, { status: 401 });
      }

      const idToken = authorization.split('Bearer ')[1];
      const decodedToken = await adminAuth.verifyIdToken(idToken);

      const userRoleRef = adminDb.ref(`userRoles/${decodedToken.uid}`);
      const snapshot = await userRoleRef.once('value');
      const userRole = snapshot.val() as UserRole;

      if (!userRole || !requiredRoles.some(role => userRole.includes(role))) {
         return NextResponse.json({ message: `Forbidden: You do not have the required permission. Required one of: ${requiredRoles.join(', ')}` }, { status: 403 });
      }
      
      // Add the decoded token to the context for the handler to use
      const newContext = { ...context, decodedToken };

      return handler(request, newContext);

    } catch (error: any) {
      console.error('Authentication or Authorization Error:', error);
      if (error.code === 'auth/id-token-expired') {
        return NextResponse.json({ message: 'Phiên làm việc đã hết hạn, vui lòng đăng nhập lại.' }, { status: 401 });
      }
      if (error.code === 'auth/argument-error') {
        return NextResponse.json({ message: 'Unauthorized: Invalid token' }, { status: 401 });
      }
      return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
    }
  };
}

export async function apiAuthMiddleware(request: NextRequest) {
  try {
    const adminAuth = getAdminAuth();
    const authorization = request.headers.get('Authorization');

    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    return { decodedToken };

  } catch (error: any) {
    console.error('Authentication Error:', error);
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json({ message: 'Phiên làm việc đã hết hạn, vui lòng đăng nhập lại.' }, { status: 401 });
    }
    if (error.code === 'auth/argument-error') {
      return NextResponse.json({ message: 'Unauthorized: Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}