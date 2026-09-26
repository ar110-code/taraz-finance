import { getDB, seedIfEmpty } from './idb-store';
import { Account, Category, Transaction, Budget, Loan, AnalyticsSummary } from '@/types';

function uuid() {
  return crypto.randomUUID();
}

async function ensureSeeded() {
  await seedIfEmpty();
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  await ensureSeeded();
  const db = await getDB();
  return db.getAll('categories');
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

export async function getAccounts(): Promise<Account[]> {
  await ensureSeeded();
  const db = await getDB();
  return db.getAll('accounts');
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function getTransactions(opts?: {
  limit?: number;
  type?: string;
  categoryId?: string;
  accountId?: string;
  query?: string;
}): Promise<{ transactions: Transaction[]; total: number }> {
  await ensureSeeded();
  const db = await getDB();
  const [allTx, allCats, allAccs] = await Promise.all([
    db.getAll('transactions'),
    db.getAll('categories'),
    db.getAll('accounts'),
  ]);

  const catMap = Object.fromEntries(allCats.map((c) => [c.id, c]));
  const accMap = Object.fromEntries(allAccs.map((a) => [a.id, a]));

  let filtered = allTx
    .map((tx) => ({ ...tx, category: catMap[tx.categoryId], account: accMap[tx.accountId] }))
    .sort((a, b) => b.date.localeCompare(a.date));

  if (opts?.type) filtered = filtered.filter((t) => t.type === opts.type);
  if (opts?.categoryId) filtered = filtered.filter((t) => t.categoryId === opts.categoryId);
  if (opts?.accountId) filtered = filtered.filter((t) => t.accountId === opts.accountId);
  if (opts?.query) {
    const q = opts.query.toLowerCase();
    filtered = filtered.filter((t) => t.title.toLowerCase().includes(q) || (t.note || '').toLowerCase().includes(q));
  }

  const total = filtered.length;
  if (opts?.limit) filtered = filtered.slice(0, opts.limit);
  return { transactions: filtered, total };
}

export async function createTransaction(data: {
  type: 'income' | 'expense';
  amount: number;
  title: string;
  categoryId: string;
  accountId: string;
  date: string;
  note?: string;
}): Promise<Transaction> {
  await ensureSeeded();
  const db = await getDB();
  const now = new Date().toISOString();
  const tx: Transaction = { ...data, id: uuid(), createdAt: now, updatedAt: now };

  // Update account balance
  const account = await db.get('accounts', data.accountId);
  if (account) {
    account.balance += data.type === 'income' ? data.amount : -data.amount;
    await db.put('accounts', account);
  }

  await db.put('transactions', tx);
  return tx;
}

export async function deleteTransaction(id: string): Promise<void> {
  await ensureSeeded();
  const db = await getDB();
  const tx = await db.get('transactions', id);
  if (!tx) return;

  // Reverse account balance
  const account = await db.get('accounts', tx.accountId);
  if (account) {
    account.balance -= tx.type === 'income' ? tx.amount : -tx.amount;
    await db.put('accounts', account);
  }

  await db.delete('transactions', id);
}

// ─── Budgets ──────────────────────────────────────────────────────────────────

export async function getBudgets(): Promise<Budget[]> {
  await ensureSeeded();
  const db = await getDB();
  const period = new Date().toISOString().slice(0, 7);
  const [allBudgets, allCats, allTx] = await Promise.all([
    db.getAll('budgets'),
    db.getAll('categories'),
    db.getAll('transactions'),
  ]);

  const catMap = Object.fromEntries(allCats.map((c) => [c.id, c]));
  const monthTx = allTx.filter((t) => t.type === 'expense' && t.date.startsWith(period));

  return allBudgets.map((b) => {
    const spent = monthTx.filter((t) => t.categoryId === b.categoryId).reduce((s, t) => s + t.amount, 0);
    const percentage = b.monthlyLimit > 0 ? Math.round((spent / b.monthlyLimit) * 100) : 0;
    const remaining = Math.max(0, b.monthlyLimit - spent);
    const status: Budget['status'] = percentage >= 100 ? 'danger' : percentage >= 80 ? 'warning' : 'safe';
    return { ...b, category: catMap[b.categoryId], spent, percentage, remaining, status };
  });
}

export async function createBudget(data: { categoryId: string; monthlyLimit: number }): Promise<Budget> {
  await ensureSeeded();
  const db = await getDB();
  const period = new Date().toISOString().slice(0, 7);
  const existing = (await db.getAll('budgets')).find((b) => b.categoryId === data.categoryId);
  const budget: Budget = { ...(existing || {}), id: existing?.id || uuid(), ...data, period };
  await db.put('budgets', budget);
  return budget;
}

export async function deleteBudget(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('budgets', id);
}

// ─── Loans ────────────────────────────────────────────────────────────────────

function enrichLoan(loan: Loan, account?: Account): Loan {
  const remainingInstallments = loan.totalInstallments - loan.paidInstallments;
  const remainingAmount = remainingInstallments * loan.installmentAmount;
  const progressPercentage = Math.round((loan.paidInstallments / loan.totalInstallments) * 100);
  const today = new Date();
  const daysUntilDue = loan.dueDay - today.getDate();
  const isOverdue = daysUntilDue < 0 && loan.status === 'active';
  return { ...loan, account, remainingInstallments, remainingAmount, progressPercentage, daysUntilDue, isOverdue };
}

export async function getLoans(): Promise<Loan[]> {
  await ensureSeeded();
  const db = await getDB();
  const [loans, accounts] = await Promise.all([db.getAll('loans'), db.getAll('accounts')]);
  const accMap = Object.fromEntries(accounts.map((a) => [a.id, a]));
  return loans.map((l) => enrichLoan(l, accMap[l.accountId]));
}

export async function createLoan(
  data: Omit<Loan, 'id' | 'createdAt' | 'status'> & { paidInstallments?: number }
): Promise<Loan> {
  await ensureSeeded();
  const db = await getDB();
  const paid = data.paidInstallments ?? 0;
  const loan: Loan = {
    ...data,
    id: uuid(),
    paidInstallments: paid,
    status: paid >= data.totalInstallments ? 'completed' : 'active',
    createdAt: new Date().toISOString(),
  };
  await db.put('loans', loan);
  return loan;
}

export async function payLoanInstallment(id: string): Promise<Loan> {
  await ensureSeeded();
  const db = await getDB();
  const loan = await db.get('loans', id);
  if (!loan) throw new Error('Loan not found');
  if (loan.paidInstallments >= loan.totalInstallments) throw new Error('All installments paid');

  // Deduct from account
  const account = await db.get('accounts', loan.accountId);
  if (account) {
    account.balance -= loan.installmentAmount;
    await db.put('accounts', account);
  }

  // Create transaction
  const now = new Date().toISOString();
  await db.put('transactions', {
    id: uuid(), type: 'expense', amount: loan.installmentAmount,
    title: `پرداخت قسط: ${loan.title}`, categoryId: 'cat-loans',
    accountId: loan.accountId, date: now.split('T')[0], createdAt: now, updatedAt: now,
  });

  loan.paidInstallments += 1;
  if (loan.paidInstallments >= loan.totalInstallments) loan.status = 'completed';
  await db.put('loans', loan);
  return enrichLoan(loan, account || undefined);
}

export async function deleteLoan(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('loans', id);
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getAnalytics(): Promise<AnalyticsSummary> {
  await ensureSeeded();
  const db = await getDB();
  const [accounts, categories, transactions] = await Promise.all([
    db.getAll('accounts'),
    db.getAll('categories'),
    db.getAll('transactions'),
  ]);

  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  const monthTx = transactions.filter((t) => t.date.startsWith(currentMonth));
  const prevMonthTx = transactions.filter((t) => t.date.startsWith(prevMonth));

  const monthIncome = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const previousMonthExpense = prevMonthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netSavings = monthIncome - monthExpense;
  const savingsRate = monthIncome > 0 ? Math.round((netSavings / monthIncome) * 100) : 0;
  const expenseChangePercentage = previousMonthExpense > 0
    ? Math.round(((monthExpense - previousMonthExpense) / previousMonthExpense) * 100) : 0;

  // Category breakdown (current month expenses)
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const catTotals: Record<string, number> = {};
  for (const tx of monthTx.filter((t) => t.type === 'expense')) {
    catTotals[tx.categoryId] = (catTotals[tx.categoryId] || 0) + tx.amount;
  }
  const categoryBreakdown = Object.entries(catTotals)
    .map(([catId, totalAmount]) => {
      const cat = catMap[catId];
      return {
        categoryId: catId,
        categoryName: cat?.name || 'سایر',
        color: cat?.color || '#6366f1',
        icon: cat?.icon || 'Tag',
        totalAmount,
        percentage: monthExpense > 0 ? Math.round((totalAmount / monthExpense) * 100) : 0,
      };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 8);

  // Monthly cashflow (last 6 months)
  const shamsiMonths = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
  const monthlyCashflow = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthKey = d.toISOString().slice(0, 7);
    const mTx = transactions.filter((t) => t.date.startsWith(monthKey));
    return {
      monthName: shamsiMonths[d.getMonth()],
      income: mTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: mTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    };
  });

  return { totalBalance, monthIncome, monthExpense, netSavings, savingsRate,
    previousMonthExpense, expenseChangePercentage, categoryBreakdown, monthlyCashflow };
}

// ─── SMS Record ───────────────────────────────────────────────────────────────

export async function recordSmsTransaction(data: {
  amount: number;
  type: 'income' | 'expense';
  title: string;
  rawSms: string;
}): Promise<void> {
  const accounts = await getAccounts();
  const defaultAccount = accounts[0];
  if (!defaultAccount) return;

  await createTransaction({
    type: data.type,
    amount: data.amount,
    title: data.title,
    categoryId: data.type === 'income' ? 'cat-salary' : 'cat-bills',
    accountId: defaultAccount.id,
    date: new Date().toISOString().split('T')[0],
    note: data.rawSms.slice(0, 100),
  });
}

// ─── Reset ────────────────────────────────────────────────────────────────────

export async function resetDatabase(mode: 'zero' | 'seed'): Promise<void> {
  const db = await getDB();
  await db.clear('transactions');
  await db.clear('budgets');
  await db.clear('loans');
  if (mode === 'seed') {
    // Re-seed accounts with original balances
    const accounts = await db.getAll('accounts');
    if (accounts.length > 0) {
      const defaults: Record<string, number> = {
        'acc-mellat': 34500000, 'acc-blu': 8200000, 'acc-saman': 52000000, 'acc-cash': 1800000
      };
      for (const acc of accounts) {
        acc.balance = defaults[acc.id] ?? acc.balance;
        await db.put('accounts', acc);
      }
    }
  } else {
    // Zero mode: just zero out balances
    const accounts = await db.getAll('accounts');
    for (const acc of accounts) {
      acc.balance = 0;
      await db.put('accounts', acc);
    }
  }
}

// ─── Export CSV ───────────────────────────────────────────────────────────────

export async function exportToCSV(type?: string): Promise<string> {
  const { transactions } = await getTransactions({ type, limit: 10000 });
  const rows = [
    ['عنوان', 'نوع', 'مبلغ (ریال)', 'دسته‌بندی', 'حساب', 'تاریخ', 'یادداشت'].join(','),
    ...transactions.map((t) =>
      [t.title, t.type === 'income' ? 'درآمد' : 'هزینه', t.amount,
       t.category?.name || '', t.account?.name || '', t.date, t.note || ''].join(',')
    ),
  ];
  return rows.join('\n');
}
