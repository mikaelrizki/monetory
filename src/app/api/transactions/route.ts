import { NextResponse } from 'next/server';
import { sql, initDb } from '@/lib/db';

export async function GET() {
  if (!sql) {
    return NextResponse.json({ error: 'Database connection not configured.' }, { status: 500 });
  }

  try {
    await initDb();
    
    const rows = await sql`
      SELECT id, type, amount, category, date, note 
      FROM transactions 
      ORDER BY date DESC, created_at DESC
    `;
    
    // Parse numeric types from pg driver to js numbers
    const transactions = rows.map(row => ({
      ...row,
      amount: parseFloat(row.amount as string)
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
    const body = await request.json();
    const { id, type, amount, category, date, note } = body;

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

    const txId = id || crypto.randomUUID();

    await sql`
      INSERT INTO transactions (id, type, amount, category, date, note)
      VALUES (${txId}, ${type}, ${parsedAmount}, ${category}, ${date}, ${note || ''})
    `;

    return NextResponse.json({
      id: txId,
      type,
      amount: parsedAmount,
      category,
      date,
      note: note || ''
    }, { status: 201 });
  } catch (error: any) {
    console.error('API Error (POST /api/transactions):', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
