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
    const { type, amount, category, date, note } = body;

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

    const result = await sql`
      UPDATE transactions
      SET type = ${type}, amount = ${parsedAmount}, category = ${category}, date = ${date}, note = ${note || ''}
      WHERE id = ${id}
    `;

    return NextResponse.json({
      id,
      type,
      amount: parsedAmount,
      category,
      date,
      note: note || ''
    });
  } catch (error: any) {
    console.error('API Error (PUT /api/transactions/[id]):', error);
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

    await sql`
      DELETE FROM transactions
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('API Error (DELETE /api/transactions/[id]):', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
