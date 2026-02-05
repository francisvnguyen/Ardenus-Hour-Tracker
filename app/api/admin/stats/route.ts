import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb, userQueries } from '@/lib/db';

interface StatsRow {
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  category_id: string;
  category_name: string;
  category_color: string;
  entry_count: number;
  total_seconds: number;
}

function getStartOfWeek(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = 0
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

function getStartOfMonth(): string {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  first.setHours(0, 0, 0, 0);
  return first.toISOString();
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'week';

  let startDate: string;
  switch (period) {
    case 'month':
      startDate = getStartOfMonth();
      break;
    case 'all':
      startDate = '1970-01-01T00:00:00.000Z';
      break;
    case 'week':
    default:
      startDate = getStartOfWeek();
      break;
  }

  const db = getDb();

  const rows = db.prepare<[string], StatsRow>(`
    SELECT
      te.user_id,
      u.name as user_name,
      u.email as user_email,
      u.role as user_role,
      te.category_id,
      c.name as category_name,
      c.color as category_color,
      COUNT(*) as entry_count,
      SUM(te.duration) as total_seconds
    FROM time_entries te
    JOIN users u ON te.user_id = u.id
    JOIN categories c ON te.category_id = c.id
    WHERE te.start_time >= ?
    GROUP BY te.user_id, te.category_id
    ORDER BY u.name ASC, total_seconds DESC
  `).all(startDate);

  // Get all users so users with zero entries still appear
  const allUsers = userQueries.findAll.all();

  // Group rows by user
  const userMap = new Map<string, {
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
    totalSeconds: number;
    entryCount: number;
    categories: {
      categoryId: string;
      categoryName: string;
      categoryColor: string;
      totalSeconds: number;
      entryCount: number;
    }[];
  }>();

  // Initialize all users with empty stats
  for (const user of allUsers) {
    userMap.set(user.id, {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      totalSeconds: 0,
      entryCount: 0,
      categories: [],
    });
  }

  // Fill in aggregation data
  for (const row of rows) {
    const user = userMap.get(row.user_id);
    if (!user) continue;
    user.totalSeconds += row.total_seconds;
    user.entryCount += row.entry_count;
    user.categories.push({
      categoryId: row.category_id,
      categoryName: row.category_name,
      categoryColor: row.category_color,
      totalSeconds: row.total_seconds,
      entryCount: row.entry_count,
    });
  }

  // Sort: most hours first, zero-entry users at bottom
  const stats = Array.from(userMap.values()).sort((a, b) => b.totalSeconds - a.totalSeconds);

  return NextResponse.json(stats);
}
