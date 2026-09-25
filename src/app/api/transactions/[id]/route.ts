import { NextRequest } from 'next/server';
import { transactionRepository } from '@/lib/repositories/transactionRepository';
import { financialService } from '@/lib/services/financialService';
import { UpdateTransactionSchema } from '@/lib/validations';
import { apiSuccess, apiError, formatZodError } from '@/lib/api-response';
import { ZodError } from 'zod';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tx = transactionRepository.findById(id);
    if (!tx) {
      return apiError('NOT_FOUND', 'تراکنش مورد نظر یافت نشد', 404);
    }
    return apiSuccess(tx, 'تراکنش یافت شد');
  } catch (error) {
    console.error('Transaction GET [id] Error:', error);
    return apiError('SERVER_ERROR', 'خطا در دریافت جزئیات تراکنش', 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validatedData = UpdateTransactionSchema.parse(body);

    const updated = financialService.updateTransaction(id, validatedData);
    return apiSuccess(updated, 'تراکنش با موفقیت بروزرسانی شد');
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(
        'VALIDATION_ERROR',
        'داده‌های ورودی نامعتبر هستند',
        422,
        formatZodError(error)
      );
    }
    console.error('Transaction PUT Error:', error);
    return apiError('TRANSACTION_UPDATE_ERROR', 'خطا در ویرایش تراکنش', 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = financialService.deleteTransaction(id);
    if (!deleted) {
      return apiError('NOT_FOUND', 'تراکنش برای حذف یافت نشد', 404);
    }
    return apiSuccess({ id }, 'تراکنش با موفقیت حذف شد');
  } catch (error) {
    console.error('Transaction DELETE Error:', error);
    return apiError('TRANSACTION_DELETE_ERROR', 'خطا در حذف تراکنش', 500);
  }
}
