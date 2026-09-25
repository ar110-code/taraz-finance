import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const result = db.prepare('SELECT 1 as ok').get() as { ok: number };

    return NextResponse.json({
      success: true,
      data: {
        status: 'healthy',
        database: result?.ok === 1 ? 'connected' : 'unknown',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
      message: 'سرویس تراز با موفقیت در حال اجرا است',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'خطا در ارتباط با دیتابیس',
          details: [String(error)],
        },
      },
      { status: 500 }
    );
  }
}
