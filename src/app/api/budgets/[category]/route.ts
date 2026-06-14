import { NextResponse } from 'next/server';
import { sql, initDb } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  if (!sql) {
    return NextResponse.json({ error: 'Database connection not configured.' }, { status: 500 });
  }

  try {
    await initDb();
    const { category } = await params;
    const decodedCategory = decodeURIComponent(category);

    await sql`
      DELETE FROM budgets
      WHERE category = ${decodedCategory}
    `;

    return NextResponse.json({ success: true, category: decodedCategory });
  } catch (error: any) {
    console.error('API Error (DELETE /api/budgets/[category]):', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
