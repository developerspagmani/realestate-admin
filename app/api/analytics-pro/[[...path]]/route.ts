// DEPRECATED: Routes moved to /api/admin/analytics-pro
import { NextResponse } from 'next/server';
export async function GET() { return NextResponse.json({ error: 'Moved to /api/admin/analytics-pro' }, { status: 404 }); }
