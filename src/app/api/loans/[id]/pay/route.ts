import { NextRequest } from 'next/server';
import { loanRepository } from '@/lib/repositories/loanRepository';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = loanRepository.payInstallment(id);

    return apiSuccess(
      result,
      `قسط با موفقیت پرداخت شد و تراکنش کسر از حساب ثبت گردید`,
      200
    );
  } catch (err: unknown) {
    console.error('Error paying installment:', err);
    return apiError(
      'PAYMENT_ERROR',
      err instanceof Error ? err.message : 'خطا در ثبت پرداخت قسط',
      400
    );
  }
}
