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
    const { type, amount, category, date, note, account_id } = body;

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

    // 1. Fetch old transaction to calculate balance differences
    const oldTxRows = await sql`
      SELECT type, amount, account_id 
      FROM transactions 
      WHERE id = ${id}
    `;

    if (oldTxRows.length > 0) {
      const oldTx = oldTxRows[0];
      const oldType = oldTx.type;
      const oldAmount = parseFloat(oldTx.amount as string);
      const oldAccountId = oldTx.account_id;

      // 2. Reverse old transaction balance change on old account
      if (oldAccountId) {
        if (oldType === 'expense') {
          await sql`
            UPDATE accounts 
            SET balance = balance + ${oldAmount}
            WHERE id = ${oldAccountId}
          `;
        } else {
          await sql`
            UPDATE accounts 
            SET balance = balance - ${oldAmount}
            WHERE id = ${oldAccountId}
          `;
        }
      }
    }

    // 3. Update the transaction details
    await sql`
      UPDATE transactions
      SET type = ${type}, amount = ${parsedAmount}, category = ${category}, date = ${date}, note = ${note || ''}, account_id = ${account_id || null}
      WHERE id = ${id}
    `;

    // 4. Apply new transaction balance change on new account
    if (account_id) {
      if (type === 'expense') {
        await sql`
          UPDATE accounts 
          SET balance = balance - ${parsedAmount}
          WHERE id = ${account_id}
        `;
      } else {
        await sql`
          UPDATE accounts 
          SET balance = balance + ${parsedAmount}
          WHERE id = ${account_id}
        `;
      }
    }

    return NextResponse.json({
      id,
      type,
      amount: parsedAmount,
      category,
      date,
      note: note || '',
      account_id: account_id || undefined
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

    // 1. Fetch old transaction to reverse balance
    const oldTxRows = await sql`
      SELECT type, amount, account_id 
      FROM transactions 
      WHERE id = ${id}
    `;

    if (oldTxRows.length > 0) {
      const oldTx = oldTxRows[0];
      const oldType = oldTx.type;
      const oldAmount = parseFloat(oldTx.amount as string);
      const oldAccountId = oldTx.account_id;

      // 2. Reverse old transaction balance change on old account
      if (oldAccountId) {
        if (oldType === 'expense') {
          await sql`
            UPDATE accounts 
            SET balance = balance + ${oldAmount}
            WHERE id = ${oldAccountId}
          `;
        } else {
          await sql`
            UPDATE accounts 
            SET balance = balance - ${oldAmount}
            WHERE id = ${oldAccountId}
          `;
        }
      }
    }

    // 3. Delete the transaction
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
