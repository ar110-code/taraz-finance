import { toEnglishDigits } from './utils';

export interface ParsedBankSMS {
  success: boolean;
  bankName?: string;
  type: 'expense' | 'income';
  amount: number; // In Toman
  rawAmount: number;
  currency: 'تومان' | 'ریال';
  cardNumber?: string;
  accountNumber?: string;
  balance?: number; // In Toman
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm
  merchantOrParty?: string;
  predictedCategory?: {
    name: string;
    reason: string;
  };
  originalText: string;
  error?: string;
}

// Convert Jalali Date to Gregorian YYYY-MM-DD
export function jalaliToGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  jy += 1595;
  let days = -355668 + (365 * jy) + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4) + jd;
  if (jm < 7) {
    days += (jm - 1) * 31;
  } else {
    days += ((jm - 7) * 30) + 186;
  }
  let gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    days--;
    gy += 100 * Math.floor(days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let gd = days + 1;
  const salA = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  while (gm < 13 && gd > salA[gm]) {
    gd -= salA[gm];
    gm++;
  }
  return { gy, gm, gd };
}

// Format to ISO string YYYY-MM-DD
function formatGregorianDate(gy: number, gm: number, gd: number): string {
  const m = gm < 10 ? `0${gm}` : `${gm}`;
  const d = gd < 10 ? `0${gd}` : `${gd}`;
  return `${gy}-${m}-${d}`;
}

const BANK_NAMES = [
  'بانک ملت', 'ملت',
  'بانک ملی', 'ملی ایران', 'ملی',
  'بانک سامان', 'سامان',
  'بلوبانک', 'بلو بانک', 'بلو',
  'بانک قرض الحسنه رسالت', 'رسالت',
  'بانک پاسارگاد', 'پاسارگاد',
  'بانک تجارت', 'تجارت',
  'بانک سپه', 'سپه',
  'بانک پارسیان', 'پارسیان',
  'بانک آینده', 'آینده',
  'بانک صادرات', 'صادرات',
  'بانک شهر', 'شهر',
  'بانک رفاه', 'رفاه',
  'بانک کشاورزی', 'کشاورزی',
  'بانک مسکن', 'مسکن',
  'ویپاد', 'پاسارگاد-ویپاد'
];

// Category keyword matchers
const CATEGORY_RULES: { category: string; keywords: string[]; type: 'expense' | 'income' }[] = [
  {
    category: 'حمل و نقل',
    type: 'expense',
    keywords: ['اسنپ', 'تپسی', 'ماکسیم', 'مترو', 'بنزین', 'پمپ بنزین', 'سوخت', 'جایگاه', 'کرایه', 'پارکینگ', 'بزرگراه', 'عوارضی']
  },
  {
    category: 'خوراک و سوپرمارکت',
    type: 'expense',
    keywords: ['سوپرمارکت', 'هایپرمارکت', 'هایپر', 'افق کوروش', 'کوروش', 'اتکا', 'رفاه', 'رستوران', 'کافه', 'اسنپ فود', 'اسنپ‌فود', 'فود', 'نانوایی', 'شیرینی', 'میوه', 'قصابی', 'پروتئین', 'پیتزا', 'ساندویچ', 'فست فود', 'چلوکبابی', 'قهوه']
  },
  {
    category: 'مسکن و قبوض',
    type: 'expense',
    keywords: ['برق', 'گاز', 'آب', 'مخابرات', 'قبض', 'همراه اول', 'ایرانسل', 'رایتل', 'شارژ', 'اجاره', 'شارژ ساختمان', 'شهرداری', 'مالیات']
  },
  {
    category: 'خرید و پوشاک',
    type: 'expense',
    keywords: ['دیجی کالا', 'دیجیکالا', 'پوشاک', 'لباس', 'بوتیک', 'کفش', 'کیف', 'فروشگاه', 'لوازم خانگی', 'اکسسوری', 'طلا', 'جواهر', 'ساعت']
  },
  {
    category: 'سلامت و درمان',
    type: 'expense',
    keywords: ['داروخانه', 'دکتر', 'پزشک', 'درمانگاه', 'بیمارستان', 'کلینیک', 'دندانپزشکی', 'آزمایشگاه', 'ویزیت', 'فیزیوتراپی', 'چشم‌پزشکی']
  },
  {
    category: 'تفریح و فرهنگ',
    type: 'expense',
    keywords: ['سینما', 'تئاتر', 'بازی', 'تفریح', 'استخر', 'باشگاه', 'بدنسازی', 'کتاب', 'کتابفروشی', 'سینماتیکت', 'کنسرت']
  },
  {
    category: 'حقوق و دستمزد',
    type: 'income',
    keywords: ['حقوق', 'دستمزد', 'پاداش', 'عیدی', 'تسویه حساب', 'مزایا', 'کارکرد', 'پرداخت حقوق']
  },
  {
    category: 'سرمایه‌گذاری و پس‌انداز',
    type: 'income',
    keywords: ['سود سپرده', 'واریز سود', 'بورس', 'سود سهام', 'اوراق', 'صندوق']
  },
  {
    category: 'درآمد متفرقه',
    type: 'income',
    keywords: ['واریز', 'انتقال از', 'ساتنا', 'پایا', 'حواله', 'هدیه']
  }
];

export function parseBankSMS(rawText: string): ParsedBankSMS {
  if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
    return {
      success: false,
      type: 'expense',
      amount: 0,
      rawAmount: 0,
      currency: 'تومان',
      originalText: '',
      error: 'متن پیامک خالی است'
    };
  }

  const text = rawText.trim();
  const normalizedText = toEnglishDigits(text);

  // 1. Detect Bank
  let detectedBank: string | undefined;
  for (const bank of BANK_NAMES) {
    if (text.includes(bank)) {
      detectedBank = bank.replace(/^بانک\s+/, '').trim();
      break;
    }
  }

  // 2. Detect Transaction Type
  let type: 'expense' | 'income' = 'expense';
  const isIncome = /(واریز|انتقال به شما|افزایش حساب|حقوق|سود سپرده|واریز به|دریافت شد)/i.test(text);
  const isExpense = /(برداشت|خرید|کسر|انتقال از شما|پرداخت قبض|کارمزد|کارت به کارت به)/i.test(text);

  if (isIncome && !isExpense) {
    type = 'income';
  } else {
    type = 'expense';
  }

  // 3. Detect Currency
  let currency: 'تومان' | 'ریال' = 'ریال';
  if (/(تومان|ت\b)/i.test(text) || text.includes('بلو') || text.includes('ویپاد')) {
    currency = 'تومان';
  }

  // 4. Extract Amount
  let amount = 0;
  let rawAmount = 0;

  // Pattern: "مبلغ: 1,500,000 ریال" or "مبلغ 500,000" or "خرید 450,000 تومان" or "واریز: 10,000,000"
  const amountRegexes = [
    /(?:مبلغ|مبلغ:|خرید|واریز|برداشت|وجه)\s*[:]?\s*([0-9,]+)\s*(ریال|تومان|ت)?/i,
    /([0-9,]{4,})\s*(ریال|تومان|ت)/i,
    /([0-9,]{4,})/
  ];

  for (const regex of amountRegexes) {
    const match = normalizedText.match(regex);
    if (match && match[1]) {
      const cleanNum = parseInt(match[1].replace(/,/g, ''), 10);
      if (!isNaN(cleanNum) && cleanNum > 0) {
        rawAmount = cleanNum;
        if (match[2] && /(تومان|ت)/i.test(match[2])) {
          currency = 'تومان';
        } else if (match[2] && /ریال/i.test(match[2])) {
          currency = 'ریال';
        }
        break;
      }
    }
  }

  // Convert Rial to Toman if needed
  if (currency === 'ریال' && rawAmount > 0) {
    amount = Math.floor(rawAmount / 10);
  } else {
    amount = rawAmount;
  }

  // 5. Extract Card or Account Number
  let cardNumber: string | undefined;
  let accountNumber: string | undefined;

  const cardMatch = normalizedText.match(/(?:کارت|کارت:|از|به)\s*([0-9*xX-]{4,19})/i);
  if (cardMatch && cardMatch[1]) {
    const cleaned = cardMatch[1].replace(/[^0-9*]/g, '');
    if (cleaned.length >= 4) {
      cardNumber = cleaned;
    }
  }

  const accMatch = normalizedText.match(/(?:حساب|حساب:)\s*([0-9.-]{6,20})/i);
  if (accMatch && accMatch[1]) {
    accountNumber = accMatch[1].trim();
  }

  // 6. Extract Balance (مانده)
  let balance: number | undefined;
  const balanceMatch = normalizedText.match(/(?:مانده|موجودی|موجودي|مانده:)\s*[:]?\s*([0-9,]+)\s*(ریال|تومان)?/i);
  if (balanceMatch && balanceMatch[1]) {
    const rawBalance = parseInt(balanceMatch[1].replace(/,/g, ''), 10);
    if (!isNaN(rawBalance)) {
      if (balanceMatch[2] === 'تومان' || currency === 'تومان') {
        balance = rawBalance;
      } else {
        balance = Math.floor(rawBalance / 10);
      }
    }
  }

  // 7. Extract Date and Time
  let date: string | undefined;
  let time: string | undefined;

  // Jalali Date: 1403/06/25 or 1403-06-25
  const dateMatch = normalizedText.match(/(14[0-9]{2})[/-](0?[1-9]|1[0-2])[/-](0?[1-9]|[12][0-9]|3[01])/);
  if (dateMatch) {
    const jy = parseInt(dateMatch[1], 10);
    const jm = parseInt(dateMatch[2], 10);
    const jd = parseInt(dateMatch[3], 10);
    const g = jalaliToGregorian(jy, jm, jd);
    date = formatGregorianDate(g.gy, g.gm, g.gd);
  } else {
    // Default to today
    date = new Date().toISOString().slice(0, 10);
  }

  // Time: 14:30 or 14:30:25
  const timeMatch = normalizedText.match(/(?:ساعت|زمان)?\s*([0-2]?[0-9]):([0-5][0-9])(?::([0-5][0-9]))?/);
  if (timeMatch) {
    time = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
  }

  // 8. Extract Merchant or Party (پذیرنده / بابت)
  let merchantOrParty: string | undefined;
  const specificMerchantMatch = text.match(/(?:بابت|پذیرنده|خرید از|فروشگاه|پایانه|به نام)\s*[:]?\s*([^,\n\r0-9-]+)/i);
  if (specificMerchantMatch && specificMerchantMatch[1]) {
    const cleaned = specificMerchantMatch[1].trim();
    if (cleaned.length > 2 && cleaned.length < 50 && !cleaned.includes('حساب') && !cleaned.includes('کارت')) {
      merchantOrParty = cleaned;
    }
  } else {
    const generalMatch = text.match(/(?:از)\s*[:]?\s*([^,\n\r0-9-]+)/i);
    if (generalMatch && generalMatch[1]) {
      const cleaned = generalMatch[1].trim();
      if (!cleaned.includes('حساب') && !cleaned.includes('کارت') && cleaned.length > 2 && cleaned.length < 50) {
        merchantOrParty = cleaned;
      }
    }
  }

  // 9. Predict Category based on keywords (check specific food keywords before generic transport)
  let predictedCategory: { name: string; reason: string } | undefined;

  // Specific override for food delivery apps
  if (text.includes('اسنپ فود') || text.includes('اسنپ‌فود')) {
    predictedCategory = {
      name: 'خوراک و سوپرمارکت',
      reason: 'تشخیص بر اساس کلیدواژه «اسنپ‌فود»'
    };
  } else {
    for (const rule of CATEGORY_RULES) {
      if (rule.type === type) {
        for (const kw of rule.keywords) {
          if (text.includes(kw)) {
            predictedCategory = {
              name: rule.category,
              reason: `تشخیص بر اساس کلیدواژه «${kw}»`
            };
            break;
          }
        }
        if (predictedCategory) break;
      }
    }
  }

  // Fallback category
  if (!predictedCategory) {
    predictedCategory = {
      name: type === 'expense' ? 'سایر مخارج' : 'درآمد متفرقه',
      reason: 'دسته‌بندی پیش‌فرض بر اساس نوع تراکنش'
    };
  }

  return {
    success: amount > 0,
    bankName: detectedBank,
    type,
    amount,
    rawAmount,
    currency,
    cardNumber,
    accountNumber,
    balance,
    date,
    time,
    merchantOrParty,
    predictedCategory,
    originalText: text,
    error: amount <= 0 ? 'مبلغ تراکنش در متن پیامک شناسایی نشد' : undefined
  };
}
