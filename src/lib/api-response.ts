import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export type ApiResponse<T> =
  | { success: true; data: T; message?: string }
  | {
      success: false;
      error: {
        code: string;
        message: string;
        details?: unknown;
      };
    };

export function apiSuccess<T>(data: T, message: string = 'عملیات با موفقیت انجام شد', status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

export function apiError(
  code: string,
  message: string,
  status: number = 400,
  details?: unknown
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  );
}

export function formatZodError(error: ZodError) {
  const issues = (error as unknown as { issues?: Array<{ path: (string | number)[]; message: string }> }).issues || [];
  return issues.map((e) => ({
    path: e.path.join('.'),
    message: e.message,
  }));
}
