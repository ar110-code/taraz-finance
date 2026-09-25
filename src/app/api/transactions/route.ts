import { NextRequest } from 'next/server';
import { transactionRepository } from '@/lib/repositories/transactionRepository';
import { financialService } from '@/lib/services/financialService';
import { TransactionSchema } from '@/lib/validations';
import { apiSuccess, apiError, formatZodError } from '@/lib/api-response';
import { TransactionType } from '@/types';
import { ZodError } from 'zod';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || undefined;
    const type = (searchParams.get('type') as TransactionType) || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const accountId = searchParams.get('accountId') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0;

    const result = transactionRepository.findMany({
      query,
      type,
      categoryId,
      accountId,
      startDate,
      endDate,
      limit,
      offset,
    });

    return apiSuccess(result, 'لیست تراکنش‌ها دریافت شد');
  } catch (error) {
    console.error('Transactions GET Error:', error);
    return apiError('TRANSACTIONS_FETCH_ERROR', 'خطا در بارگذاری تراکنش‌ها', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = TransactionSchema.parse(body);

    const transaction = financialService.recordTransaction(validatedData);
    return apiSuccess(transaction, 'تراکنش جدید با موفقیت ثبت شد', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(
        'VALIDATION_ERROR',
        'داده‌های ورودی تراکنش نامعتبر هستند',
        422,
        formatZodError(error)
      );
    }
    console.error('Transaction POST Error:', error);
    return apiError('TRANSACTION_CREATE_ERROR', 'خطا در ثبت تراکنش', 500);
  }
}
