import { NextResponse } from 'next/server';
import { getAdminRealtimeDB } from '@/lib/firebase-admin';
import { apiAuthMiddleware } from '@/lib/api-auth-middleware';

export async function POST(request: Request) {
  const authResult = await apiAuthMiddleware(request);
  if (authResult instanceof NextResponse) {
    return authResult; // Return error response if authentication fails
  }

  const { employeeId, employeeName, action, details } = await request.json();

  if (!employeeId || !employeeName || !action) {
    return NextResponse.json({ error: 'Thiếu thông tin cần thiết' }, { status: 400 });
  }

  try {
    const logEntry = {
      employeeId,
      employeeName,
      action,
      details,
      timestamp: new Date().toISOString(),
    };

    const db = getAdminRealtimeDB();
    await db.ref('activityLog').push(logEntry);

    return NextResponse.json({ message: 'Hoạt động đã được ghi lại' }, { status: 201 });
  } catch (error) {
    console.error('Lỗi khi ghi lại hoạt động:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 });
  }
}