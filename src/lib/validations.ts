import { z } from 'zod';

export const TransactionSchema = z.object({
  type: z.enum(['expense', 'income'], {
    error: 'نوع تراکنش باید هزینه یا درآمد باشد',
  }),
  amount: z
    .number({ error: 'مبلغ باید یک عدد معتبر باشد' })
    .positive('مبلغ تراکنش باید بزرگتر از صفر باشد'),
  title: z
    .string()
    .min(2, 'عنوان تراکنش باید حداقل ۲ حرف باشد')
    .max(100, 'عنوان تراکنش نمی‌تواند بیشتر از ۱۰۰ حرف باشد'),
  categoryId: z.string().min(1, 'انتخاب دسته‌بندی الزامی است'),
  accountId: z.string().min(1, 'انتخاب حساب الزامی است'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'فرمت تاریخ باید YYYY-MM-DD باشد'),
  note: z.string().max(500, 'یادداشت نمی‌تواند بیشتر از ۵۰۰ حرف باشد').optional(),
});

export type CreateTransactionInput = z.infer<typeof TransactionSchema>;

export const UpdateTransactionSchema = TransactionSchema.partial();
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;

export const BudgetSchema = z.object({
  categoryId: z.string().min(1, 'انتخاب دسته‌بندی الزامی است'),
  monthlyLimit: z
    .number({ error: 'سقف بودجه باید عدد معتبر باشد' })
    .positive('سقف بودجه باید بزرگتر از صفر باشد'),
  period: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'فرمت دوره باید YYYY-MM باشد'),
});

export type CreateBudgetInput = z.infer<typeof BudgetSchema>;

export const AccountSchema = z.object({
  name: z.string().min(2, 'نام حساب باید حداقل ۲ حرف باشد'),
  balance: z.number().default(0),
  bankName: z.string().min(2, 'نام بانک یا موسسه الزامی است'),
  color: z.string().default('#6366f1'),
  icon: z.string().default('CreditCard'),
  accountNumber: z.string().optional(),
});

export type CreateAccountInput = z.infer<typeof AccountSchema>;

export const CategorySchema = z.object({
  name: z.string().min(2, 'نام دسته باید حداقل ۲ حرف باشد'),
  nameEn: z.string().min(2, 'نام انگلیسی دسته باید حداقل ۲ حرف باشد'),
  icon: z.string().default('Tag'),
  color: z.string().default('#6366f1'),
  type: z.enum(['expense', 'income']),
});

export type CreateCategoryInput = z.infer<typeof CategorySchema>;

export const LoanSchema = z.object({
  title: z.string().min(2, 'عنوان وام باید حداقل ۲ حرف باشد').max(100),
  lender: z.string().min(2, 'نام وام‌دهنده یا بانک باید حداقل ۲ حرف باشد').max(100),
  totalAmount: z.number().positive('مبلغ کل وام باید بزرگتر از صفر باشد'),
  installmentAmount: z.number().positive('مبلغ هر قسط باید بزرگتر از صفر باشد'),
  totalInstallments: z.number().int().min(1, 'تعداد کل اقساط باید حداقل ۱ باشد'),
  paidInstallments: z.number().int().min(0).default(0),
  dueDay: z.number().int().min(1).max(31, 'روز سررسید باید بین ۱ تا ۳۱ باشد'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'فرمت تاریخ باید YYYY-MM-DD باشد'),
  accountId: z.string().min(1, 'انتخاب حساب الزامی است'),
});

export type CreateLoanInput = z.infer<typeof LoanSchema>;
export const UpdateLoanSchema = LoanSchema.partial();
export type UpdateLoanInput = z.infer<typeof UpdateLoanSchema>;
