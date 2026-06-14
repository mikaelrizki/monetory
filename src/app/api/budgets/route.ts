import { NextResponse } from 'next/server';
import { sql, initDb } from '@/lib/db';

export async function GET() {
  if (!sql) {
    return NextResponse.json({ error: 'Database connection not configured.' }, { status: 500 });
  }

  try {
    await initDb();
    
    const rows = await sql`
      SELECT category, limit_amount 
      FROM budgets
    `;

    // Map database fields to standard camelCase/format
    const budgets = rows.map(row => ({
      category: row.category,
      limit: parseFloat(row.limit_amount as string)
    }));

    return NextResponse.json(budgets);
  } catch (error: any) {
    console.error('API Error (GET /api/budgets):', error);
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
    const { category, limit } = body;

    // Validation
    if (!category || limit === undefined) {
      return NextResponse.json({ error: 'Missing required fields (category, limit).' }, { status: 400 });
    }

    const parsedLimit = parseFloat(limit);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      return NextResponse.json({ error: 'Limit must be a positive number.' }, { status: 400 });
    }

    // Upsert budget limit
    await sql`
      INSERT INTO budgets (category, limit_amount)
      VALUES (${category}, ${parsedLimit})
      ON CONFLICT (category) 
      DO UPDATE SET limit_amount = ${parsedLimit}
    `;

    return NextResponse.json({
      category,
      limit: parsedLimit
    });
  } catch (error: any) {
    console.error('API Error (POST /api/budgets):', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
