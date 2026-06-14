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

    // Verify transaction ownership
    const txRows = await sql`
      SELECT id, type, amount, account_id FROM transactions
      WHERE id = ${id} AND user_id = ${user.id}
    `;
    if (txRows.length === 0) {
      return NextResponse.json({ error: 'Transaction not found or access denied.' }, { status: 404 });
    }

    const oldTx = txRows[0];
    const oldType = oldTx.type;
    const oldAmount = parseFloat(oldTx.amount as string);
    const oldAccountId = oldTx.account_id;

    // Verify new account ownership if account_id is provided
    if (account_id) {
      const existingAccount = await sql`
        SELECT id FROM accounts WHERE id = ${account_id} AND user_id = ${user.id}
      `;
      if (existingAccount.length === 0) {
        return NextResponse.json({ error: 'Selected account not found or access denied.' }, { status: 400 });
      }
    }

    // 2. Reverse old transaction balance change on old account
    if (oldAccountId) {
      if (oldType === 'expense') {
        await sql`
          UPDATE accounts 
          SET balance = balance + ${oldAmount}
          WHERE id = ${oldAccountId} AND user_id = ${user.id}
        `;
      } else {
        await sql`
          UPDATE accounts 
          SET balance = balance - ${oldAmount}
          WHERE id = ${oldAccountId} AND user_id = ${user.id}
        `;
      }
    }

    // 3. Update the transaction details
    await sql`
      UPDATE transactions
      SET type = ${type}, amount = ${parsedAmount}, category = ${category}, date = ${date}, note = ${note || ''}, account_id = ${account_id || null}
      WHERE id = ${id} AND user_id = ${user.id}
    `;

    // 4. Apply new transaction balance change on new account
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
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify transaction ownership
    const txRows = await sql`
      SELECT id, type, amount, account_id FROM transactions
      WHERE id = ${id} AND user_id = ${user.id}
    `;
    if (txRows.length === 0) {
      return NextResponse.json({ error: 'Transaction not found or access denied.' }, { status: 404 });
    }

    const oldTx = txRows[0];
    const oldType = oldTx.type;
    const oldAmount = parseFloat(oldTx.amount as string);
    const oldAccountId = oldTx.account_id;

    // 2. Reverse old transaction balance change on old account
    if (oldAccountId) {
      if (oldType === 'expense') {
        await sql`
          UPDATE accounts 
          SET balance = balance + ${oldAmount}
          WHERE id = ${oldAccountId} AND user_id = ${user.id}
        `;
      } else {
        await sql`
          UPDATE accounts 
          SET balance = balance - ${oldAmount}
          WHERE id = ${oldAccountId} AND user_id = ${user.id}
        `;
      }
    }

    // 3. Delete the transaction
    await sql`
      DELETE FROM transactions
      WHERE id = ${id} AND user_id = ${user.id}
    `;

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('API Error (DELETE /api/transactions/[id]):', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
