import { NextRequest } from 'next/server';
import { accountRepository } from '@/lib/repositories/accountRepository';
import { AccountSchema } from '@/lib/validations';
import { apiSuccess, apiError, formatZodError } from '@/lib/api-response';
import { ZodError } from 'zod';

export async function GET() {
  try {
    const accounts = accountRepository.findMany();
    return apiSuccess(accounts, 'لیست حساب‌ها دریافت شد');
  } catch (error) {
    console.error('Accounts GET Error:', error);
    return apiError('ACCOUNTS_FETCH_ERROR', 'خطا در بارگذاری حساب‌ها', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = AccountSchema.parse(body);

    const account = accountRepository.create(validatedData);
    return apiSuccess(account, 'حساب جدید با موفقیت ایجاد شد', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(
        'VALIDATION_ERROR',
        'داده‌های حساب نامعتبر هستند',
        422,
        formatZodError(error)
      );
    }
    console.error('Account POST Error:', error);
    return apiError('ACCOUNT_CREATE_ERROR', 'خطا در ایجاد حساب', 500);
  }
}
