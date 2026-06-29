import { NextResponse } from 'next/server';
import { sql, initDb } from '@/lib/db';
import { getSessionUser, hashPassword, signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function PUT(request: Request) {
  if (!sql) {
    return NextResponse.json({ error: 'Database connection not configured.' }, { status: 500 });
  }

  try {
    await initDb();
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, password, summary_start_day } = body;

    if (!name && !password && summary_start_day === undefined) {
      return NextResponse.json({ error: 'No fields to update provided.' }, { status: 400 });
    }

    let updatedName = currentUser.name;

    if (name) {
      const trimmedName = name.trim();
      if (trimmedName.length < 2) {
        return NextResponse.json({ error: 'Nama Lengkap minimal 2 karakter.' }, { status: 400 });
      }
      await sql`
        UPDATE users 
        SET name = ${trimmedName} 
        WHERE id = ${currentUser.id}
      `;
      updatedName = trimmedName;
    }

    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Kata sandi baru minimal 6 karakter.' }, { status: 400 });
      }
      const hashedPassword = hashPassword(password);
      await sql`
        UPDATE users 
        SET password = ${hashedPassword} 
        WHERE id = ${currentUser.id}
      `;
    }

    if (summary_start_day !== undefined) {
      const startDay = parseInt(summary_start_day, 10);
      if (isNaN(startDay) || startDay < 1 || startDay > 31) {
        return NextResponse.json({ error: 'Tanggal awal harus antara 1 dan 31.' }, { status: 400 });
      }
      await sql`
        UPDATE users 
        SET summary_start_day = ${startDay} 
        WHERE id = ${currentUser.id}
      `;
    }

    // Fetch updated user from DB
    const users = await sql`
      SELECT id, username, name, summary_start_day FROM users 
      WHERE id = ${currentUser.id}
    `;
    const updatedUser = users[0];

    // Generate updated token
    const token = signToken({
      id: updatedUser.id,
      username: updatedUser.username,
      name: updatedUser.name || updatedUser.username
    });

    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error('API Error (PUT /api/auth/update-profile):', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
