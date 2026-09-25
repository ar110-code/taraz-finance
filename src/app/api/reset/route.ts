import { NextRequest } from 'next/server';
import { resetAndSeedDatabase, wipeDatabaseToZero } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    let mode = 'zero';
    try {
      const body = await req.json();
      if (body?.mode) mode = body.mode;
    } catch {
      // Body may be empty
    }

    if (mode === 'seed') {
      resetAndSeedDatabase();
      return apiSuccess(
        { reset: true, mode: 'seed' },
        'کلیه داده‌ها با موفقیت به حالت اولیه نمونه بازنشانی شدند'
      );
    } else {
      wipeDatabaseToZero();
      return apiSuccess(
        { reset: true, mode: 'zero' },
        'تمام تراکنش‌ها، بودجه‌ها و اقساط پاک شدند و موجودی حساب‌ها صفر شد'
      );
    }
  } catch (error) {
    console.error('Database Reset Error:', error);
    return apiError('RESET_ERROR', 'خطا در بازنشانی پایگاه‌داده', 500);
  }
}
