import { NextRequest } from 'next/server';
import { financialService } from '@/lib/services/financialService';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || undefined;

    const analytics = financialService.getDashboardAnalytics(month);
    return apiSuccess(analytics, 'آمار و گزارش تحلیلی با موفقیت دریافت شد');
  } catch (error) {
    console.error('Analytics API Error:', error);
    return apiError('ANALYTICS_FETCH_ERROR', 'خطا در محاسبه آمار داشبورد', 500);
  }
}
