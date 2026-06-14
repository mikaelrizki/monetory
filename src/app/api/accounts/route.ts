import { NextResponse } from 'next/server';
import { sql, initDb } from '@/lib/db';

export async function GET() {
  if (!sql) {
    return NextResponse.json({ error: 'Database connection not configured.' }, { status: 500 });
  }

  try {
    await initDb();
    
    const rows = await sql`
      SELECT id, name, type, balance
      FROM accounts
      ORDER BY name ASC, created_at DESC
    `;

    const accounts = rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type as any,
      balance: parseFloat(row.balance as string)
    }));

    return NextResponse.json(accounts);
  } catch (error: any) {
    console.error('API Error (GET /api/accounts):', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!sql) {
    return NextResponse.json({ error: 'Database connection not configured.' }, { status: 500 });
  }

  try {
    await initDb();
    const body = await request.json();
    const { id, name, type, balance } = body;

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

    const accountId = id || crypto.randomUUID();

    await sql`
      INSERT INTO accounts (id, name, type, balance)
      VALUES (${accountId}, ${name}, ${type}, ${parsedBalance})
    `;

    return NextResponse.json({
      id: accountId,
      name,
      type,
      balance: parsedBalance
    }, { status: 201 });
  } catch (error: any) {
    console.error('API Error (POST /api/accounts):', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
