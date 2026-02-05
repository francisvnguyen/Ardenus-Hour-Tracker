import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

interface TimeseriesRow {
  day: string;
  user_id: string;
  user_name: string;
  category_id: string;
  category_name: string;
  category_color: string;
  total_seconds: number;
}

// Auto-assigned user colors when viewing "All Users"
const USER_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6',
];

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const userId = searchParams.get('userId');

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
  }

  const db = getDb();

  const params: string[] = [startDate, endDate];
  let userFilter = '';
  if (userId && userId !== 'all') {
    userFilter = 'AND te.user_id = ?';
    params.push(userId);
  }

  const rows = db.prepare<string[], TimeseriesRow>(`
    SELECT
      date(te.start_time) as day,
      te.user_id,
      u.name as user_name,
      te.category_id,
      c.name as category_name,
      c.color as category_color,
      SUM(te.duration) as total_seconds
    FROM time_entries te
    JOIN users u ON te.user_id = u.id
    JOIN categories c ON te.category_id = c.id
    WHERE te.start_time >= ? AND te.start_time < ?
    ${userFilter}
    GROUP BY day, te.user_id, te.category_id
    ORDER BY day ASC
  `).all(...params);

  // Determine series mode: by user or by category
  const byUser = !userId || userId === 'all';

  // Collect unique series
  const seriesMap = new Map<string, string>();
  for (const row of rows) {
    if (byUser) {
      if (!seriesMap.has(row.user_name)) {
        seriesMap.set(row.user_name, USER_COLORS[seriesMap.size % USER_COLORS.length]);
      }
    } else {
      if (!seriesMap.has(row.category_name)) {
        seriesMap.set(row.category_name, row.category_color);
      }
    }
  }

  // Build day map, aggregating per series
  const dayMap = new Map<string, Record<string, number>>();
  for (const row of rows) {
    const key = byUser ? row.user_name : row.category_name;
    if (!dayMap.has(row.day)) {
      dayMap.set(row.day, {});
    }
    const dayData = dayMap.get(row.day)!;
    dayData[key] = (dayData[key] || 0) + row.total_seconds;
  }

  // Fill all days in range and ensure every series key exists on every day
  const seriesKeys = Array.from(seriesMap.keys());
  const days: Record<string, string | number>[] = [];

  const start = new Date(startDate);
  const end = new Date(endDate);
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    const existing = dayMap.get(dateStr) || {};
    const point: Record<string, string | number> = { date: dateStr };
    for (const sk of seriesKeys) {
      point[sk] = existing[sk] || 0;
    }
    days.push(point);
  }

  const series = seriesKeys.map(key => ({
    key,
    color: seriesMap.get(key)!,
  }));

  return NextResponse.json({ days, series });
}
