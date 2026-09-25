import { NextRequest, NextResponse } from 'next/server';
import { transactionRepository } from '@/lib/repositories/transactionRepository';
import { formatShamsiDate } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const type = (searchParams.get('type') as 'expense' | 'income') || undefined;

    const { transactions } = transactionRepository.findMany({
      startDate,
      endDate,
      type,
      limit: 10000,
    });

    const headers = [
      'شناسه',
      'عنوان',
      'نوع',
      'مبلغ (تومان)',
      'دسته‌بندی',
      'حساب بانکی',
      'تاریخ میلادی',
      'تاریخ شمسی',
      'یادداشت',
    ];

    const rows = transactions.map((t) => [
      t.id,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      t.type === 'income' ? 'درآمد' : 'هزینه',
      t.amount,
      `"${(t.category?.name || '').replace(/"/g, '""')}"`,
      `"${(t.account?.name || '').replace(/"/g, '""')}"`,
      t.date,
      formatShamsiDate(t.date),
      `"${(t.note || '').replace(/"/g, '""')}"`,
    ]);

    // Prepend UTF-8 BOM so Persian characters display perfectly in Microsoft Excel
    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="taraz-transactions-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export Error:', error);
    return NextResponse.json({ error: 'خطا در خروجی داده‌ها' }, { status: 500 });
  }
}
