import { NextRequest } from 'next/server';
import { categoryRepository } from '@/lib/repositories/categoryRepository';
import { CategorySchema } from '@/lib/validations';
import { apiSuccess, apiError, formatZodError } from '@/lib/api-response';
import { TransactionType } from '@/types';
import { ZodError } from 'zod';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get('type') as TransactionType) || undefined;

    const categories = categoryRepository.findMany(type);
    return apiSuccess(categories, 'لیست دسته‌بندی‌ها دریافت شد');
  } catch (error) {
    console.error('Categories GET Error:', error);
    return apiError('CATEGORIES_FETCH_ERROR', 'خطا در بارگذاری دسته‌بندی‌ها', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = CategorySchema.parse(body);

    const category = categoryRepository.create(validatedData);
    return apiSuccess(category, 'دسته‌بندی با موفقیت ایجاد شد', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(
        'VALIDATION_ERROR',
        'داده‌های دسته‌بندی نامعتبر هستند',
        422,
        formatZodError(error)
      );
    }
    console.error('Category POST Error:', error);
    return apiError('CATEGORY_CREATE_ERROR', 'خطا در ایجاد دسته‌بندی', 500);
  }
}
