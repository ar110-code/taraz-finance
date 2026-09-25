import { NextRequest } from 'next/server';
import { z } from 'zod';
import { parseBankSMS } from '@/lib/smsParser';
import { financialService } from '@/lib/services/financialService';
import { accountRepository } from '@/lib/repositories/accountRepository';
import { categoryRepository } from '@/lib/repositories/categoryRepository';
import { apiSuccess, apiError, formatZodError } from '@/lib/api-response';

const SmsRecordSchema = z.object({
  smsText: z.string().min(5, 'متن پیامک باید حداقل ۵ کاراکتر باشد'),
  autoSave: z.boolean().optional().default(false),
  accountId: z.string().optional(),
  categoryId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = SmsRecordSchema.safeParse(body);

    if (!result.success) {
      return apiError('VALIDATION_ERROR', 'داده‌های ورودی نامعتبر است', 400, formatZodError(result.error));
    }

    const { smsText, autoSave, accountId: customAccountId, categoryId: customCategoryId } = result.data;
    const parsed = parseBankSMS(smsText);

    if (!parsed.success) {
      return apiError(
        'PARSE_FAILED',
        parsed.error || 'امکان استخراج مبالغ یا جزئیات تراکنش از این متن وجود نداشت',
        422,
        parsed
      );
    }

    // If autoSave is requested, record into database immediately
    if (autoSave) {
      const accounts = accountRepository.findMany();
      if (accounts.length === 0) {
        return apiError('NO_ACCOUNTS', 'هیچ حسابی در سیستم یافت نشد', 400);
      }

      // Match Account
      let selectedAccount = accounts[0];
      if (customAccountId) {
        const found = accounts.find((a) => a.id === customAccountId);
        if (found) selectedAccount = found;
      } else if (parsed.bankName) {
        const bankMatch = accounts.find((a) =>
          a.bankName.includes(parsed.bankName!) || a.name.includes(parsed.bankName!)
        );
        if (bankMatch) selectedAccount = bankMatch;
      }

      // Match Category
      const categories = categoryRepository.findMany(parsed.type);
      let selectedCategory = categories[0];
      if (customCategoryId) {
        const found = categories.find((c) => c.id === customCategoryId);
        if (found) selectedCategory = found;
      } else if (parsed.predictedCategory?.name) {
        const catMatch = categories.find((c) =>
          c.name.includes(parsed.predictedCategory!.name) ||
          parsed.predictedCategory!.name.includes(c.name)
        );
        if (catMatch) selectedCategory = catMatch;
      }

      const title = parsed.merchantOrParty
        ? (parsed.type === 'expense' ? `خرید از ${parsed.merchantOrParty}` : `واریز ${parsed.merchantOrParty}`)
        : (parsed.type === 'expense' ? `برداشت ${selectedAccount.bankName}` : `واریز به ${selectedAccount.bankName}`);

      const transaction = financialService.recordTransaction({
        type: parsed.type,
        amount: parsed.amount,
        title,
        categoryId: selectedCategory ? selectedCategory.id : categories[0].id,
        accountId: selectedAccount.id,
        date: parsed.date || new Date().toISOString().slice(0, 10),
        note: `ثبت خودکار از پیامک:\n${parsed.originalText}`
      });

      const updatedAccount = accountRepository.findById(selectedAccount.id);

      return apiSuccess(
        {
          parsed,
          transaction,
          account: updatedAccount
        },
        'تراکنش با موفقیت از متن پیامک استخراج و ثبت شد',
        201
      );
    }

    // Default: return parsed metadata without recording
    return apiSuccess(
      { parsed },
      'پیامک با موفقیت تجزیه و تحلیل شد'
    );
  } catch (err: unknown) {
    console.error('Error in /api/sms/record:', err);
    return apiError(
      'INTERNAL_SERVER_ERROR',
      err instanceof Error ? err.message : 'خطای پیش‌بینی‌نشده در پردازش پیامک',
      500
    );
  }
}
