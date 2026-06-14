import { NextResponse } from 'next/server';
import { sql, initDb } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!sql) {
    return NextResponse.json({ error: 'Database connection not configured.' }, { status: 500 });
  }

  try {
    await initDb();
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

    await sql`
      UPDATE accounts
      SET name = ${name}, type = ${type}, balance = ${parsedBalance}
      WHERE id = ${id}
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
    const { id } = await params;

    // Optional: when deleting an account, set account_id to NULL in transactions 
    // to preserve transaction history instead of cascade deletion.
    await sql`
      UPDATE transactions
      SET account_id = NULL
      WHERE account_id = ${id}
    `;

    await sql`
      DELETE FROM accounts
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('API Error (DELETE /api/accounts/[id]):', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
