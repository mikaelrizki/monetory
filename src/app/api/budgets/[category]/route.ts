import { NextResponse } from 'next/server';
import { sql, initDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ category: string }> }
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

    const { category } = await params;
    const decodedCategory = decodeURIComponent(category);

    await sql`
      DELETE FROM budgets
      WHERE category = ${decodedCategory} AND user_id = ${user.id}
    `;

    return NextResponse.json({ success: true, category: decodedCategory });
  } catch (error: any) {
    console.error('API Error (DELETE /api/budgets/[category]):', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
