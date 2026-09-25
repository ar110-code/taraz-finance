import { NextRequest } from 'next/server';
import { loanRepository } from '@/lib/repositories/loanRepository';
import { LoanSchema } from '@/lib/validations';
import { apiSuccess, apiError, formatZodError } from '@/lib/api-response';

export async function GET() {
  try {
    const loans = loanRepository.findMany();
    return apiSuccess(loans);
  } catch (err: unknown) {
    console.error('Error fetching loans:', err);
    return apiError('DB_ERROR', 'خطا در دریافت لیست وام‌ها و اقساط', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = LoanSchema.safeParse(body);

    if (!result.success) {
      return apiError(
        'VALIDATION_ERROR',
        'اطلاعات وارد شده برای وام معتبر نیست',
        400,
        formatZodError(result.error)
      );
    }

    const loan = loanRepository.create(result.data);
    return apiSuccess(loan, 'وام و طرح اقساطی با موفقیت ثبت شد', 201);
  } catch (err: unknown) {
    console.error('Error creating loan:', err);
    return apiError('DB_ERROR', 'خطا در ایجاد وام و اقساط', 500);
  }
}
