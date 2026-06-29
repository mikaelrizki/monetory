import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ user: null });
    }

    if (sql) {
      const users = await sql`
        SELECT id, username, name, summary_start_day FROM users 
        WHERE id = ${sessionUser.id}
      `;
      if (users.length > 0) {
        return NextResponse.json({ user: users[0] });
      }
    }

    return NextResponse.json({ user: sessionUser });
  } catch (error: any) {
    console.error('API Error (GET /api/auth/me):', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
