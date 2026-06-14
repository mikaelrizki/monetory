import { NextResponse } from 'next/server';
import { sql, initDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!sql) {
    return NextResponse.json({ error: 'Database connection not configured.' }, { status: 500 });
  }

  try {
    await initDb();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, type, balance } = body;

    // Validation
    if (!name || !type || balance === undefined) {
      return NextResponse.json({ error: 'Missing required fields (name, type, balance).' }, { status: 400 });
    }

    if (type !== 'bank' && type !== 'ewallet' && type !== 'cash' && type !== 'other') {
      return NextResponse.json({ error: 'Invalid account type.' }, { status: 400 });
    }

    const parsedBalance = parseFloat(balance);
    if (isNaN(parsedBalance)) {
      return NextResponse.json({ error: 'Balance must be a valid number.' }, { status: 400 });
    }

    // Verify ownership
    const existing = await sql`
      SELECT id FROM accounts WHERE id = ${id} AND user_id = ${user.id}
    `;
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Account not found or access denied.' }, { status: 404 });
    }

    await sql`
      UPDATE accounts
      SET name = ${name}, type = ${type}, balance = ${parsedBalance}
      WHERE id = ${id} AND user_id = ${user.id}
    `;

    return NextResponse.json({
      id,
      name,
      type,
      balance: parsedBalance
    });
  } catch (error: any) {
    console.error('API Error (PUT /api/accounts/[id]):', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!sql) {
    return NextResponse.json({ error: 'Database connection not configured.' }, { status: 500 });
  }

  try {
    await initDb();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existing = await sql`
      SELECT id FROM accounts WHERE id = ${id} AND user_id = ${user.id}
    `;
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Account not found or access denied.' }, { status: 404 });
    }

    // Set account_id to NULL in transactions belonging to this user
    await sql`
      UPDATE transactions
      SET account_id = NULL
      WHERE account_id = ${id} AND user_id = ${user.id}
    `;

    await sql`
      DELETE FROM accounts
      WHERE id = ${id} AND user_id = ${user.id}
    `;

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('API Error (DELETE /api/accounts/[id]):', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
