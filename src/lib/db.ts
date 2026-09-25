import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'taraz.sqlite');

declare global {
  // eslint-disable-next-line no-var
  var _tarazDb: DatabaseSync | undefined;
}

function initDatabase(): DatabaseSync {
  const db = new DatabaseSync(DB_PATH);

  // Use DELETE journal mode on Windows to avoid .sqlite-shm file lock conflicts with watchers
  db.exec('PRAGMA journal_mode = DELETE;');
  db.exec('PRAGMA foreign_keys = ON;');

  // Create tables if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 0,
      bankName TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#6366f1',
      icon TEXT NOT NULL DEFAULT 'CreditCard',
      accountNumber TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      nameEn TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'Tag',
      color TEXT NOT NULL DEFAULT '#6366f1',
      type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
      isDefault INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
      amount REAL NOT NULL,
      title TEXT NOT NULL,
      categoryId TEXT NOT NULL,
      accountId TEXT NOT NULL,
      date TEXT NOT NULL,
      note TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(categoryId) REFERENCES categories(id) ON DELETE CASCADE,
      FOREIGN KEY(accountId) REFERENCES accounts(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_transactions_categoryId ON transactions(categoryId);
    CREATE INDEX IF NOT EXISTS idx_transactions_accountId ON transactions(accountId);

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      categoryId TEXT NOT NULL UNIQUE,
      monthlyLimit REAL NOT NULL,
      period TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(categoryId) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS loans (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      lender TEXT NOT NULL,
      totalAmount REAL NOT NULL,
      installmentAmount REAL NOT NULL,
      totalInstallments INTEGER NOT NULL,
      paidInstallments INTEGER NOT NULL DEFAULT 0,
      dueDay INTEGER NOT NULL,
      startDate TEXT NOT NULL,
      accountId TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed')),
      createdAt TEXT NOT NULL,
      FOREIGN KEY(accountId) REFERENCES accounts(id) ON DELETE CASCADE
    );
  `);

  seedDefaultData(db);

  return db;
}

function seedDefaultData(db: DatabaseSync) {
  // Check if categories are empty
  const categoryCount = (
    db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number }
  ).count;

  if (categoryCount === 0) {
    const now = new Date().toISOString();
    const insertCat = db.prepare(
      'INSERT INTO categories (id, name, nameEn, icon, color, type, isDefault, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );

    // Default Expense Categories
    const expenseCategories = [
      { id: 'cat-food', name: 'خوراک و رستوران', nameEn: 'Food & Dining', icon: 'Utensils', color: '#f59e0b' },
      { id: 'cat-groceries', name: 'سوپرمارکت و خرید خانه', nameEn: 'Groceries', icon: 'ShoppingCart', color: '#10b981' },
      { id: 'cat-transport', name: 'حمل‌ونقل و سوخت', nameEn: 'Transportation', icon: 'Car', color: '#3b82f6' },
      { id: 'cat-housing', name: 'مسکن و اجاره', nameEn: 'Housing & Rent', icon: 'Home', color: '#8b5cf6' },
      { id: 'cat-bills', name: 'قبوض و اینترنت', nameEn: 'Bills & Utilities', icon: 'Zap', color: '#ec4899' },
      { id: 'cat-health', name: 'سلامت و درمان', nameEn: 'Healthcare', icon: 'HeartPulse', color: '#ef4444' },
      { id: 'cat-shopping', name: 'پوشاک و خرید فردی', nameEn: 'Shopping', icon: 'ShoppingBag', color: '#06b6d4' },
      { id: 'cat-entertainment', name: 'تفریح و سرگرمی', nameEn: 'Entertainment', icon: 'Gamepad2', color: '#f97316' },
      { id: 'cat-education', name: 'آموزش و کتاب', nameEn: 'Education', icon: 'GraduationCap', color: '#6366f1' },
      { id: 'cat-loans', name: 'اقساط و وام‌ها', nameEn: 'Loans & Installments', icon: 'Landmark', color: '#ea580c' },
    ];

    for (const c of expenseCategories) {
      insertCat.run(c.id, c.name, c.nameEn, c.icon, c.color, 'expense', 1, now);
    }

    // Default Income Categories
    const incomeCategories = [
      { id: 'cat-salary', name: 'حقوق و دستمزد', nameEn: 'Salary', icon: 'Briefcase', color: '#10b981' },
      { id: 'cat-freelance', name: 'پروژه‌های فریلنسری', nameEn: 'Freelance', icon: 'Laptop', color: '#06b6d4' },
      { id: 'cat-investment', name: 'سرمایه‌گذاری و سود', nameEn: 'Investment', icon: 'TrendingUp', color: '#8b5cf6' },
      { id: 'cat-bonus', name: 'پاداش و هدایا', nameEn: 'Bonus & Gift', icon: 'Gift', color: '#ec4899' },
    ];

    for (const c of incomeCategories) {
      insertCat.run(c.id, c.name, c.nameEn, c.icon, c.color, 'income', 1, now);
    }
  }

  // Check if accounts are empty
  const accountCount = (
    db.prepare('SELECT COUNT(*) as count FROM accounts').get() as { count: number }
  ).count;

  if (accountCount === 0) {
    const now = new Date().toISOString();
    const insertAccount = db.prepare(
      'INSERT INTO accounts (id, name, balance, bankName, color, icon, accountNumber, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );

    const accounts = [
      { id: 'acc-mellat', name: 'حساب جاری ملت (اصلی)', balance: 34500000, bankName: 'بانک ملت', color: '#ef4444', icon: 'CreditCard', accountNumber: '۶۱۰۴-۳۳۷۸-****-۱۲۰۲' },
      { id: 'acc-blu', name: 'کارت بلو بانک (مخارج روزمره)', balance: 8200000, bankName: 'بلو بانک', color: '#06b6d4', icon: 'CreditCard', accountNumber: '۶۲۱۹-۸۶۱۰-****-۸۸۳۴' },
      { id: 'acc-saman', name: 'صندوق پس‌انداز سامان', balance: 52000000, bankName: 'بانک سامان', color: '#6366f1', icon: 'Vault', accountNumber: '۶۲۱۹-۸۶۱۰-****-۴۴۵۵' },
      { id: 'acc-cash', name: 'کیف پول نقد', balance: 1800000, bankName: 'نقدی', color: '#10b981', icon: 'Banknote', accountNumber: '-' },
    ];

    for (const a of accounts) {
      insertAccount.run(a.id, a.name, a.balance, a.bankName, a.color, a.icon, a.accountNumber, now);
    }
  }

  // Seed sample transactions if empty
  const txCount = (
    db.prepare('SELECT COUNT(*) as count FROM transactions').get() as { count: number }
  ).count;

  if (txCount === 0) {
    const now = new Date();
    const insertTx = db.prepare(
      'INSERT INTO transactions (id, type, amount, title, categoryId, accountId, date, note, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    const fmtDate = (daysAgo: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - daysAgo);
      return d.toISOString().split('T')[0];
    };

    const sampleTransactions = [
      // Current Month (Month 0)
      { id: 'tx-1', type: 'income', amount: 48000000, title: 'واریز حقوق ماهانه', categoryId: 'cat-salary', accountId: 'acc-mellat', date: fmtDate(2), note: 'حقوق پایه و اضافه‌کار' },
      { id: 'tx-2', type: 'expense', amount: 3200000, title: 'خرید هفتگی مواد غذایی', categoryId: 'cat-groceries', accountId: 'acc-blu', date: fmtDate(3), note: 'فروشگاه شهروند' },
      { id: 'tx-3', type: 'expense', amount: 850000, title: 'کافه و صبحانه کاری', categoryId: 'cat-food', accountId: 'acc-blu', date: fmtDate(4), note: 'کافه سام با همکاران' },
      { id: 'tx-4', type: 'expense', amount: 1200000, title: 'شارژ ساختمان و نظافت', categoryId: 'cat-bills', accountId: 'acc-mellat', date: fmtDate(5), note: 'شارژ ماهانه' },
      { id: 'tx-5', type: 'income', amount: 15000000, title: 'تسویه فاز اول پروژه طراحی UI', categoryId: 'cat-freelance', accountId: 'acc-saman', date: fmtDate(6), note: 'پروژه استارتاپ سلامت' },
      { id: 'tx-6', type: 'expense', amount: 450000, title: 'سفرهای اسنپ و تپسی', categoryId: 'cat-transport', accountId: 'acc-blu', date: fmtDate(7), note: 'تردد درون‌شهری' },
      { id: 'tx-7', type: 'expense', amount: 1800000, title: 'خرید دوره آموزشی فرانت‌اند', categoryId: 'cat-education', accountId: 'acc-mellat', date: fmtDate(8), note: 'دوره مسترکلاس React 19' },
      { id: 'tx-8', type: 'expense', amount: 2400000, title: 'خرید کتونی و لباس ورزشی', categoryId: 'cat-shopping', accountId: 'acc-blu', date: fmtDate(10), note: 'تخفیف فصلی' },

      // 1 Month Ago
      { id: 'tx-m1-1', type: 'income', amount: 48000000, title: 'حقوق ماه گذشته', categoryId: 'cat-salary', accountId: 'acc-mellat', date: fmtDate(32), note: 'واریزی حقوق' },
      { id: 'tx-m1-2', type: 'income', amount: 8000000, title: 'پاداش عملکرد سه‌ماهه', categoryId: 'cat-bonus', accountId: 'acc-mellat', date: fmtDate(35), note: 'پاداش فصلی' },
      { id: 'tx-m1-3', type: 'expense', amount: 5600000, title: 'خرید خواروبار و گوشت', categoryId: 'cat-groceries', accountId: 'acc-blu', date: fmtDate(36), note: 'هایپراستار' },
      { id: 'tx-m1-4', type: 'expense', amount: 2100000, title: 'سرویس دوره‌ای خودرو', categoryId: 'cat-transport', accountId: 'acc-mellat', date: fmtDate(40), note: 'تعویض روغن و لنت' },
      { id: 'tx-m1-5', type: 'expense', amount: 1300000, title: 'کافه و رستوران آخر هفته', categoryId: 'cat-food', accountId: 'acc-blu', date: fmtDate(42), note: 'دورهمی دوستان' },

      // 2 Months Ago
      { id: 'tx-m2-1', type: 'income', amount: 45000000, title: 'واریز حقوق', categoryId: 'cat-salary', accountId: 'acc-mellat', date: fmtDate(62), note: 'حقوق ماه' },
      { id: 'tx-m2-2', type: 'expense', amount: 4800000, title: 'خرید لوازم مصرفی خانه', categoryId: 'cat-groceries', accountId: 'acc-blu', date: fmtDate(65), note: 'فروشگاه اتکا' },
      { id: 'tx-m2-3', type: 'expense', amount: 3500000, title: 'بلیط قطار و هتل سفر', categoryId: 'cat-entertainment', accountId: 'acc-saman', date: fmtDate(70), note: 'سفر به اصفهان' },

      // 3 Months Ago
      { id: 'tx-m3-1', type: 'income', amount: 45000000, title: 'واریز حقوق', categoryId: 'cat-salary', accountId: 'acc-mellat', date: fmtDate(92), note: 'حقوق ماه' },
      { id: 'tx-m3-2', type: 'income', amount: 12000000, title: 'پروژه مشاوره فنی', categoryId: 'cat-freelance', accountId: 'acc-saman', date: fmtDate(95), note: 'مشاوره سئو و وب' },
      { id: 'tx-m3-3', type: 'expense', amount: 5100000, title: 'سوپرمارکت و مواد شوینده', categoryId: 'cat-groceries', accountId: 'acc-blu', date: fmtDate(98), note: 'خرید ماهانه' },
      { id: 'tx-m3-4', type: 'expense', amount: 2800000, title: 'دندانپزشکی و جرم‌گیری', categoryId: 'cat-health', accountId: 'acc-mellat', date: fmtDate(102), note: 'کلینیک دندان' },

      // 4 Months Ago
      { id: 'tx-m4-1', type: 'income', amount: 42000000, title: 'واریز حقوق', categoryId: 'cat-salary', accountId: 'acc-mellat', date: fmtDate(122), note: 'حقوق ماه' },
      { id: 'tx-m4-2', type: 'expense', amount: 4200000, title: 'خرید اقلام خوراکی', categoryId: 'cat-groceries', accountId: 'acc-blu', date: fmtDate(125), note: 'میوه و سبزیجات' },
      { id: 'tx-m4-3', type: 'expense', amount: 1600000, title: 'بنزین و عوارض اتوبان', categoryId: 'cat-transport', accountId: 'acc-blu', date: fmtDate(130), note: 'هزینه‌های تردد' },

      // 5 Months Ago
      { id: 'tx-m5-1', type: 'income', amount: 42000000, title: 'واریز حقوق', categoryId: 'cat-salary', accountId: 'acc-mellat', date: fmtDate(152), note: 'حقوق ماه' },
      { id: 'tx-m5-2', type: 'expense', amount: 4500000, title: 'خرید هفتگی شهروند', categoryId: 'cat-groceries', accountId: 'acc-blu', date: fmtDate(155), note: 'سوپرمارکت' },
      { id: 'tx-m5-3', type: 'expense', amount: 1900000, title: 'کتاب‌های تخصصی و رمان', categoryId: 'cat-education', accountId: 'acc-mellat', date: fmtDate(160), note: 'شهر کتاب' },
    ];

    for (const tx of sampleTransactions) {
      const createdAt = new Date().toISOString();
      insertTx.run(tx.id, tx.type, tx.amount, tx.title, tx.categoryId, tx.accountId, tx.date, tx.note, createdAt, createdAt);
    }
  }

  // Seed sample budgets if empty
  const budgetCount = (
    db.prepare('SELECT COUNT(*) as count FROM budgets').get() as { count: number }
  ).count;

  if (budgetCount === 0) {
    const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
    const nowStr = new Date().toISOString();
    const insertBudget = db.prepare(
      'INSERT INTO budgets (id, categoryId, monthlyLimit, period, createdAt) VALUES (?, ?, ?, ?, ?)'
    );

    const sampleBudgets = [
      { id: 'b-1', categoryId: 'cat-food', monthlyLimit: 4000000 },
      { id: 'b-2', categoryId: 'cat-groceries', monthlyLimit: 12000000 },
      { id: 'b-3', categoryId: 'cat-transport', monthlyLimit: 2500000 },
      { id: 'b-4', categoryId: 'cat-shopping', monthlyLimit: 5000000 },
      { id: 'b-5', categoryId: 'cat-entertainment', monthlyLimit: 3000000 },
    ];

    for (const b of sampleBudgets) {
      insertBudget.run(b.id, b.categoryId, b.monthlyLimit, currentPeriod, nowStr);
    }
  }
}

function ensureTables(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS loans (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      lender TEXT NOT NULL,
      totalAmount REAL NOT NULL,
      installmentAmount REAL NOT NULL,
      totalInstallments INTEGER NOT NULL,
      paidInstallments INTEGER NOT NULL DEFAULT 0,
      dueDay INTEGER NOT NULL,
      startDate TEXT NOT NULL,
      accountId TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed')),
      createdAt TEXT NOT NULL,
      FOREIGN KEY(accountId) REFERENCES accounts(id) ON DELETE CASCADE
    );

    INSERT OR IGNORE INTO categories (id, name, nameEn, icon, color, type, isDefault, createdAt)
    VALUES ('cat-loans', 'اقساط و وام‌ها', 'Loans & Installments', 'Landmark', '#f97316', 'expense', 1, datetime('now'));
  `);
}

export function getDb(): DatabaseSync {
  if (!globalThis._tarazDb) {
    globalThis._tarazDb = initDatabase();
  }
  ensureTables(globalThis._tarazDb);
  return globalThis._tarazDb;
}

export function resetAndSeedDatabase(): void {
  const db = getDb();
  db.exec('BEGIN TRANSACTION;');
  try {
    db.exec('DELETE FROM transactions;');
    db.exec('DELETE FROM budgets;');
    db.exec('DELETE FROM loans;');
    db.exec('DELETE FROM accounts;');
    db.exec('DELETE FROM categories;');
    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
  seedDefaultData(db);
}

export function wipeDatabaseToZero(): void {
  const db = getDb();
  db.exec('BEGIN TRANSACTION;');
  try {
    db.exec('DELETE FROM transactions;');
    db.exec('DELETE FROM budgets;');
    db.exec('DELETE FROM loans;');
    db.exec('UPDATE accounts SET balance = 0;');
    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}


