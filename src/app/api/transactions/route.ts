import { NextResponse } from 'next/server';
import { sql, initDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  if (!sql) {
    return NextResponse.json({ error: 'Database connection not configured.' }, { status: 500 });
  }

  try {
    await initDb();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const rows = await sql`
      SELECT id, type, amount, category, date, note, account_id
      FROM transactions 
      WHERE user_id = ${user.id}
      ORDER BY date DESC, created_at DESC
    `;
    
    const transactions = rows.map(row => ({
      id: row.id,
      type: row.type as any,
      amount: parseFloat(row.amount as string),
      category: row.category,
      date: row.date,
      note: row.note,
      account_id: row.account_id || undefined
    }));

    return NextResponse.json(transactions);
  } catch (error: any) {
    console.error('API Error (GET /api/transactions):', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!sql) {
    return NextResponse.json({ error: 'Database connection not configured.' }, { status: 500 });
  }

  try {
    await initDb();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, type, amount, category, date, note, account_id } = body;

    // Validation
    if (!type || !amount || !category || !date) {
      return NextResponse.json({ error: 'Missing required fields (type, amount, category, date).' }, { status: 400 });
    }

    if (type !== 'income' && type !== 'expense') {
      return NextResponse.json({ error: 'Invalid transaction type.' }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number.' }, { status: 400 });
    }

    // Verify account ownership if account_id is supplied
    if (account_id) {
      const existingAccount = await sql`
        SELECT id FROM accounts WHERE id = ${account_id} AND user_id = ${user.id}
      `;
      if (existingAccount.length === 0) {
        return NextResponse.json({ error: 'Selected account not found or access denied.' }, { status: 400 });
      }
    }

    const txId = id || crypto.randomUUID();

    // 1. Insert transaction into Postgres
    await sql`
      INSERT INTO transactions (id, type, amount, category, date, note, account_id, user_id)
      VALUES (${txId}, ${type}, ${parsedAmount}, ${category}, ${date}, ${note || ''}, ${account_id || null}, ${user.id})
    `;

    // 2. Adjust target account balance if account_id is provided
    if (account_id) {
      if (type === 'expense') {
        await sql`
          UPDATE accounts 
          SET balance = balance - ${parsedAmount}
          WHERE id = ${account_id} AND user_id = ${user.id}
        `;
      } else {
        await sql`
          UPDATE accounts 
          SET balance = balance + ${parsedAmount}
          WHERE id = ${account_id} AND user_id = ${user.id}
        `;
      }
    }

    return NextResponse.json({
      id: txId,
      type,
      amount: parsedAmount,
      category,
      date,
      note: note || '',
      account_id: account_id || undefined
    }, { status: 201 });
  } catch (error: any) {
    console.error('API Error (POST /api/transactions):', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
