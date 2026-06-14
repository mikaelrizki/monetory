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
    const { username, password, name } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
    }

    const trimmedUsername = username.trim().toLowerCase();
    if (trimmedUsername.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const displayName = name && name.trim() ? name.trim() : trimmedUsername;

    // Check if user already exists
    const existingUsers = await sql`
      SELECT id FROM users WHERE username = ${trimmedUsername}
    `;

    if (existingUsers.length > 0) {
      return NextResponse.json({ error: 'Username is already taken.' }, { status: 409 });
    }

    const userId = crypto.randomUUID();
    const hashedPassword = hashPassword(password);

    await sql`
      INSERT INTO users (id, username, password, name)
      VALUES (${userId}, ${trimmedUsername}, ${hashedPassword}, ${displayName})
    `;

    const token = signToken({ id: userId, username: trimmedUsername, name: displayName });

    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    });

    return NextResponse.json({
      id: userId,
      username: trimmedUsername,
      name: displayName
    }, { status: 201 });
  } catch (error: any) {
    console.error('API Error (POST /api/auth/register):', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
