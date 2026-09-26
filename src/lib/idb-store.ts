import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Account, Category, Transaction, Budget, Loan } from '@/types';

interface TarazDB extends DBSchema {
  accounts: { key: string; value: Account };
  categories: { key: string; value: Category };
  transactions: {
    key: string;
    value: Transaction;
    indexes: { by_date: string; by_account: string; by_category: string };
  };
  budgets: { key: string; value: Budget };
  loans: { key: string; value: Loan };
}

let dbPromise: Promise<IDBPDatabase<TarazDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<TarazDB>('taraz-db', 1, {
      upgrade(db) {
        db.createObjectStore('accounts', { keyPath: 'id' });
        db.createObjectStore('categories', { keyPath: 'id' });
        const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
        txStore.createIndex('by_date', 'date');
        txStore.createIndex('by_account', 'accountId');
        txStore.createIndex('by_category', 'categoryId');
        db.createObjectStore('budgets', { keyPath: 'id' });
        db.createObjectStore('loans', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}

export async function seedIfEmpty() {
  const db = await getDB();
  const catCount = await db.count('categories');
  if (catCount > 0) return;

  const now = new Date().toISOString();
  const fmtDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  const expenseCats: Category[] = [
    { id: 'cat-food', name: 'خوراک و رستوران', nameEn: 'Food & Dining', icon: 'Utensils', color: '#f59e0b', type: 'expense', isDefault: true },
    { id: 'cat-groceries', name: 'سوپرمارکت و خرید خانه', nameEn: 'Groceries', icon: 'ShoppingCart', color: '#10b981', type: 'expense', isDefault: true },
    { id: 'cat-transport', name: 'حمل‌ونقل و سوخت', nameEn: 'Transportation', icon: 'Car', color: '#3b82f6', type: 'expense', isDefault: true },
    { id: 'cat-housing', name: 'مسکن و اجاره', nameEn: 'Housing & Rent', icon: 'Home', color: '#8b5cf6', type: 'expense', isDefault: true },
    { id: 'cat-bills', name: 'قبوض و اینترنت', nameEn: 'Bills & Utilities', icon: 'Zap', color: '#ec4899', type: 'expense', isDefault: true },
    { id: 'cat-health', name: 'سلامت و درمان', nameEn: 'Healthcare', icon: 'HeartPulse', color: '#ef4444', type: 'expense', isDefault: true },
    { id: 'cat-shopping', name: 'پوشاک و خرید فردی', nameEn: 'Shopping', icon: 'ShoppingBag', color: '#06b6d4', type: 'expense', isDefault: true },
    { id: 'cat-entertainment', name: 'تفریح و سرگرمی', nameEn: 'Entertainment', icon: 'Gamepad2', color: '#f97316', type: 'expense', isDefault: true },
    { id: 'cat-education', name: 'آموزش و کتاب', nameEn: 'Education', icon: 'GraduationCap', color: '#6366f1', type: 'expense', isDefault: true },
    { id: 'cat-loans', name: 'اقساط و وام‌ها', nameEn: 'Loans & Installments', icon: 'Landmark', color: '#ea580c', type: 'expense', isDefault: true },
  ];
  const incomeCats: Category[] = [
    { id: 'cat-salary', name: 'حقوق و دستمزد', nameEn: 'Salary', icon: 'Briefcase', color: '#10b981', type: 'income', isDefault: true },
    { id: 'cat-freelance', name: 'پروژه‌های فریلنسری', nameEn: 'Freelance', icon: 'Laptop', color: '#06b6d4', type: 'income', isDefault: true },
    { id: 'cat-investment', name: 'سرمایه‌گذاری و سود', nameEn: 'Investment', icon: 'TrendingUp', color: '#8b5cf6', type: 'income', isDefault: true },
    { id: 'cat-bonus', name: 'پاداش و هدایا', nameEn: 'Bonus & Gift', icon: 'Gift', color: '#ec4899', type: 'income', isDefault: true },
  ];
  for (const c of [...expenseCats, ...incomeCats]) await db.put('categories', c);

  const accounts: Account[] = [
    { id: 'acc-mellat', name: 'حساب جاری ملت (اصلی)', balance: 34500000, bankName: 'بانک ملت', color: '#ef4444', icon: 'CreditCard', accountNumber: '6104-3378-****-1202' },
    { id: 'acc-blu', name: 'کارت بلو بانک (مخارج روزمره)', balance: 8200000, bankName: 'بلو بانک', color: '#06b6d4', icon: 'CreditCard', accountNumber: '6219-8610-****-8834' },
    { id: 'acc-saman', name: 'صندوق پس‌انداز سامان', balance: 52000000, bankName: 'بانک سامان', color: '#6366f1', icon: 'Vault', accountNumber: '6219-8610-****-4455' },
    { id: 'acc-cash', name: 'کیف پول نقد', balance: 1800000, bankName: 'نقدی', color: '#10b981', icon: 'Banknote', accountNumber: '-' },
  ];
  for (const a of accounts) await db.put('accounts', a);

  const sampleTx: Transaction[] = [
    { id: 'tx-1', type: 'income', amount: 48000000, title: 'واریز حقوق ماهانه', categoryId: 'cat-salary', accountId: 'acc-mellat', date: fmtDate(2), note: 'حقوق پایه و اضافه‌کار', createdAt: now, updatedAt: now },
    { id: 'tx-2', type: 'expense', amount: 3200000, title: 'خرید هفتگی مواد غذایی', categoryId: 'cat-groceries', accountId: 'acc-blu', date: fmtDate(3), note: 'فروشگاه شهروند', createdAt: now, updatedAt: now },
    { id: 'tx-3', type: 'expense', amount: 850000, title: 'کافه و صبحانه کاری', categoryId: 'cat-food', accountId: 'acc-blu', date: fmtDate(4), note: 'کافه سام با همکاران', createdAt: now, updatedAt: now },
    { id: 'tx-4', type: 'expense', amount: 1200000, title: 'شارژ ساختمان و نظافت', categoryId: 'cat-bills', accountId: 'acc-mellat', date: fmtDate(5), note: 'شارژ ماهانه', createdAt: now, updatedAt: now },
    { id: 'tx-5', type: 'income', amount: 15000000, title: 'تسویه فاز اول پروژه طراحی UI', categoryId: 'cat-freelance', accountId: 'acc-saman', date: fmtDate(6), note: 'پروژه استارتاپ سلامت', createdAt: now, updatedAt: now },
    { id: 'tx-6', type: 'expense', amount: 450000, title: 'سفرهای اسنپ و تپسی', categoryId: 'cat-transport', accountId: 'acc-blu', date: fmtDate(7), note: 'تردد درون‌شهری', createdAt: now, updatedAt: now },
    { id: 'tx-7', type: 'expense', amount: 1800000, title: 'خرید دوره آموزشی فرانت‌اند', categoryId: 'cat-education', accountId: 'acc-mellat', date: fmtDate(8), note: 'دوره مسترکلاس React', createdAt: now, updatedAt: now },
    { id: 'tx-8', type: 'expense', amount: 2400000, title: 'خرید کتونی و لباس ورزشی', categoryId: 'cat-shopping', accountId: 'acc-blu', date: fmtDate(10), note: 'تخفیف فصلی', createdAt: now, updatedAt: now },
    { id: 'tx-m1-1', type: 'income', amount: 48000000, title: 'حقوق ماه گذشته', categoryId: 'cat-salary', accountId: 'acc-mellat', date: fmtDate(32), note: 'واریزی حقوق', createdAt: now, updatedAt: now },
    { id: 'tx-m1-2', type: 'income', amount: 8000000, title: 'پاداش عملکرد سه‌ماهه', categoryId: 'cat-bonus', accountId: 'acc-mellat', date: fmtDate(35), note: 'پاداش فصلی', createdAt: now, updatedAt: now },
    { id: 'tx-m1-3', type: 'expense', amount: 5600000, title: 'خرید خواروبار و گوشت', categoryId: 'cat-groceries', accountId: 'acc-blu', date: fmtDate(36), note: 'هایپراستار', createdAt: now, updatedAt: now },
    { id: 'tx-m2-1', type: 'income', amount: 45000000, title: 'واریز حقوق', categoryId: 'cat-salary', accountId: 'acc-mellat', date: fmtDate(62), note: 'حقوق ماه', createdAt: now, updatedAt: now },
    { id: 'tx-m2-2', type: 'expense', amount: 4800000, title: 'خرید لوازم مصرفی خانه', categoryId: 'cat-groceries', accountId: 'acc-blu', date: fmtDate(65), note: 'فروشگاه اتکا', createdAt: now, updatedAt: now },
    { id: 'tx-m3-1', type: 'income', amount: 45000000, title: 'واریز حقوق', categoryId: 'cat-salary', accountId: 'acc-mellat', date: fmtDate(92), note: 'حقوق ماه', createdAt: now, updatedAt: now },
    { id: 'tx-m4-1', type: 'income', amount: 42000000, title: 'واریز حقوق', categoryId: 'cat-salary', accountId: 'acc-mellat', date: fmtDate(122), note: 'حقوق ماه', createdAt: now, updatedAt: now },
    { id: 'tx-m5-1', type: 'income', amount: 42000000, title: 'واریز حقوق', categoryId: 'cat-salary', accountId: 'acc-mellat', date: fmtDate(152), note: 'حقوق ماه', createdAt: now, updatedAt: now },
  ];
  for (const tx of sampleTx) await db.put('transactions', tx);

  const period = new Date().toISOString().slice(0, 7);
  const budgets: Budget[] = [
    { id: 'b-1', categoryId: 'cat-food', monthlyLimit: 4000000, period },
    { id: 'b-2', categoryId: 'cat-groceries', monthlyLimit: 12000000, period },
    { id: 'b-3', categoryId: 'cat-transport', monthlyLimit: 2500000, period },
    { id: 'b-4', categoryId: 'cat-shopping', monthlyLimit: 5000000, period },
    { id: 'b-5', categoryId: 'cat-entertainment', monthlyLimit: 3000000, period },
  ];
  for (const b of budgets) await db.put('budgets', b);
}
