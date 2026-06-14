import { NextResponse } from 'next/server';
import { sql, initDb } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  if (!sql) {
    return NextResponse.json({ error: 'Database connection not configured.' }, { status: 500 });
  }

  try {
    await initDb();
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
    }

    const trimmedUsername = username.trim().toLowerCase();
    const hashedPassword = hashPassword(password);

    // Verify user in db
    const users = await sql`
      SELECT id, username, password, name FROM users 
      WHERE username = ${trimmedUsername}
    `;

    if (users.length === 0 || users[0].password !== hashedPassword) {
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
    }

    const user = users[0];
    const token = signToken({ id: user.id, username: user.username, name: user.name || user.username });

    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    });

    return NextResponse.json({
      id: user.id,
      username: user.username,
      name: user.name || user.username
    });
  } catch (error: any) {
    console.error('API Error (POST /api/auth/login):', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
