import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toPersianDigits(value: string | number): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
}

export function toEnglishDigits(value: string): string {
  if (!value) return '';
  return value
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

export function formatToman(amount: number, showSign: boolean = false): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-US');
  const persianFormatted = toPersianDigits(formatted);

  if (showSign && amount > 0) {
    return `+${persianFormatted} تومان`;
  }
  if (isNegative) {
    return `−${persianFormatted} تومان`;
  }
  return `${persianFormatted} تومان`;
}

export function formatShamsiDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return isoDate;
    
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return isoDate;
  }
}

export function formatShamsiMonthYear(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
    }).format(date);
  } catch {
    return dateString;
  }
}

// Convert numbers up to billions to Persian words
const ones = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
const teens = [
  'ده',
  'یازده',
  'دوازده',
  'سیزده',
  'چهارده',
  'پانزده',
  'شانزده',
  'هفده',
  'هجده',
  'نوزده',
];
const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
const hundreds = [
  '',
  'یکصد',
  'دویست',
  'سیصد',
  'چهارصد',
  'پانصد',
  'ششصد',
  'هفتصد',
  'هشتصد',
  'نهصد',
];
const scales = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون'];

function chunkToWords(num: number): string {
  if (num === 0) return '';
  const parts: string[] = [];

  const h = Math.floor(num / 100);
  const remainder = num % 100;

  if (h > 0) {
    parts.push(hundreds[h]);
  }

  if (remainder >= 10 && remainder < 20) {
    parts.push(teens[remainder - 10]);
  } else {
    const t = Math.floor(remainder / 10);
    const o = remainder % 10;
    if (t > 0) parts.push(tens[t]);
    if (o > 0) parts.push(ones[o]);
  }

  return parts.join(' و ');
}

export function amountToPersianWords(amount: number): string {
  if (amount === 0) return 'صفر تومان';
  if (isNaN(amount) || amount < 0) return '';

  const chunks: number[] = [];
  let temp = Math.floor(amount);

  while (temp > 0) {
    chunks.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  const words: string[] = [];
  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunk = chunks[i];
    if (chunk > 0) {
      const chunkWord = chunkToWords(chunk);
      const scale = scales[i];
      words.push(scale ? `${chunkWord} ${scale}` : chunkWord);
    }
  }

  const result = words.join(' و ');
  return result ? `${result} تومان` : '';
}
