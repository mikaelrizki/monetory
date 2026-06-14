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
    const { name, password } = body;

    if (!name && !password) {
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

    // Generate updated token
    const token = signToken({
      id: currentUser.id,
      username: currentUser.username,
      name: updatedName
    });

    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    });

    return NextResponse.json({
      id: currentUser.id,
      username: currentUser.username,
      name: updatedName
    });
  } catch (error: any) {
    console.error('API Error (PUT /api/auth/update-profile):', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
