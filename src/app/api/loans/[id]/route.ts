import { NextRequest } from 'next/server';
import { loanRepository } from '@/lib/repositories/loanRepository';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const loan = loanRepository.findById(id);
    if (!loan) {
      return apiError('NOT_FOUND', 'وام مورد نظر یافت نشد', 404);
    }
    return apiSuccess(loan);
  } catch (err: unknown) {
    console.error('Error fetching loan:', err);
    return apiError('DB_ERROR', 'خطا در دریافت اطلاعات وام', 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = loanRepository.delete(id);
    if (!success) {
      return apiError('NOT_FOUND', 'وام مورد نظر یافت نشد یا قبلاً حذف شده است', 404);
    }
    return apiSuccess({ deleted: true }, 'وام با موفقیت حذف شد');
  } catch (err: unknown) {
    console.error('Error deleting loan:', err);
    return apiError('DB_ERROR', 'خطا در حذف وام', 500);
  }
}
