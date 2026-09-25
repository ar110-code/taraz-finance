import { NextRequest } from 'next/server';
import { budgetRepository } from '@/lib/repositories/budgetRepository';
import { financialService } from '@/lib/services/financialService';
import { BudgetSchema } from '@/lib/validations';
import { apiSuccess, apiError, formatZodError } from '@/lib/api-response';
import { ZodError } from 'zod';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || undefined;

    const budgetsWithStatus = financialService.getBudgetStatus(period);
    return apiSuccess(budgetsWithStatus, 'اطلاعات بودجه‌بندی دریافت شد');
  } catch (error) {
    console.error('Budgets GET Error:', error);
    return apiError('BUDGETS_FETCH_ERROR', 'خطا در بارگذاری بودجه‌ها', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = BudgetSchema.parse(body);

    const budget = budgetRepository.upsert(validatedData);
    return apiSuccess(budget, 'بودجه با موفقیت ذخیره شد', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(
        'VALIDATION_ERROR',
        'داده‌های بودجه نامعتبر هستند',
        422,
        formatZodError(error)
      );
    }
    console.error('Budget POST Error:', error);
    return apiError('BUDGET_SAVE_ERROR', 'خطا در ثبت بودجه', 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return apiError('INVALID_ID', 'شناسه بودجه الزامی است', 400);
    }

    const deleted = budgetRepository.delete(id);
    return apiSuccess({ deleted }, 'بودجه حذف شد');
  } catch (error) {
    console.error('Budget DELETE Error:', error);
    return apiError('BUDGET_DELETE_ERROR', 'خطا در حذف بودجه', 500);
  }
}
