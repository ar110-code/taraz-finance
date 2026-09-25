import { getDb } from '../db';
import { transactionRepository } from '../repositories/transactionRepository';
import { accountRepository } from '../repositories/accountRepository';
import { budgetRepository } from '../repositories/budgetRepository';
import { categoryRepository } from '../repositories/categoryRepository';
import { CreateTransactionInput, UpdateTransactionInput } from '../validations';
import { AnalyticsSummary, Budget } from '@/types';

export const financialService = {
  recordTransaction(data: CreateTransactionInput) {
    const db = getDb();
    db.exec('BEGIN TRANSACTION;');
    try {
      const tx = transactionRepository.create(data);
      const delta = data.type === 'income' ? data.amount : -data.amount;
      accountRepository.updateBalance(data.accountId, delta);
      db.exec('COMMIT;');
      return tx;
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  },

  updateTransaction(id: string, data: UpdateTransactionInput) {
    const oldTx = transactionRepository.findById(id);
    if (!oldTx) throw new Error('تراکنش یافت نشد');

    const db = getDb();
    db.exec('BEGIN TRANSACTION;');
    try {
      // Revert old effect
      const oldDelta = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
      accountRepository.updateBalance(oldTx.accountId, oldDelta);

      // Apply new effect
      const newType = data.type ?? oldTx.type;
      const newAmount = data.amount ?? oldTx.amount;
      const newAccountId = data.accountId ?? oldTx.accountId;
      const newDelta = newType === 'income' ? newAmount : -newAmount;
      accountRepository.updateBalance(newAccountId, newDelta);

      const updated = transactionRepository.update(id, data);
      db.exec('COMMIT;');
      return updated;
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  },

  deleteTransaction(id: string) {
    const tx = transactionRepository.findById(id);
    if (!tx) return false;

    const db = getDb();
    db.exec('BEGIN TRANSACTION;');
    try {
      const delta = tx.type === 'income' ? -tx.amount : tx.amount;
      accountRepository.updateBalance(tx.accountId, delta);
      const deleted = transactionRepository.delete(id);
      db.exec('COMMIT;');
      return deleted;
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  },

  getBudgetStatus(period?: string): Budget[] {
    const currentPeriod = period || new Date().toISOString().slice(0, 7);
    const budgets = budgetRepository.findMany(currentPeriod);
    const db = getDb();

    return budgets.map((b) => {
      const spentRow = db
        .prepare(`
          SELECT COALESCE(SUM(amount), 0) as spent
          FROM transactions
          WHERE categoryId = ? AND type = 'expense' AND date LIKE ?
        `)
        .get(b.categoryId, `${currentPeriod}%`) as { spent: number };

      const spent = spentRow.spent;
      const percentage = b.monthlyLimit > 0 ? Math.round((spent / b.monthlyLimit) * 100) : 0;
      const remaining = Math.max(0, b.monthlyLimit - spent);

      let status: 'safe' | 'warning' | 'danger' = 'safe';
      if (percentage >= 95) {
        status = 'danger';
      } else if (percentage >= 70) {
        status = 'warning';
      }

      return {
        ...b,
        spent,
        percentage,
        remaining,
        status,
      };
    });
  },

  getDashboardAnalytics(monthStr?: string): AnalyticsSummary {
    const db = getDb();
    const currentMonth = monthStr || new Date().toISOString().slice(0, 7); // e.g. 2026-09

    // Calculate previous month
    const currentDate = new Date(currentMonth + '-01');
    currentDate.setMonth(currentDate.getMonth() - 1);
    const prevMonth = currentDate.toISOString().slice(0, 7);

    // Total Balance across all accounts
    const accounts = accountRepository.findMany();
    const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);

    // Current Month Income & Expense
    const currentTotals = db
      .prepare(`
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
        FROM transactions
        WHERE date LIKE ?
      `)
      .get(`${currentMonth}%`) as { income: number; expense: number };

    // Previous Month Expense
    const prevTotals = db
      .prepare(`
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
        FROM transactions
        WHERE date LIKE ?
      `)
      .get(`${prevMonth}%`) as { expense: number };

    const monthIncome = currentTotals.income;
    const monthExpense = currentTotals.expense;
    const netSavings = monthIncome - monthExpense;
    const savingsRate = monthIncome > 0 ? Math.max(0, Math.round((netSavings / monthIncome) * 100)) : 0;

    const previousMonthExpense = prevTotals.expense;
    const expenseChangePercentage =
      previousMonthExpense > 0
        ? Math.round(((monthExpense - previousMonthExpense) / previousMonthExpense) * 100)
        : 0;

    // Category Breakdown for current month
    const categoryRows = db
      .prepare(`
        SELECT 
          t.categoryId,
          c.name as categoryName,
          c.color,
          c.icon,
          SUM(t.amount) as totalAmount
        FROM transactions t
        JOIN categories c ON t.categoryId = c.id
        WHERE t.type = 'expense' AND t.date LIKE ?
        GROUP BY t.categoryId
        ORDER BY totalAmount DESC
      `)
      .all(`${currentMonth}%`) as Array<{
        categoryId: string;
        categoryName: string;
        color: string;
        icon: string;
        totalAmount: number;
      }>;

    const totalCategoryExpense = categoryRows.reduce((sum, r) => sum + r.totalAmount, 0);
    const categoryBreakdown = categoryRows.map((cat) => ({
      ...cat,
      percentage: totalCategoryExpense > 0 ? Math.round((cat.totalAmount / totalCategoryExpense) * 100) : 0,
    }));

    // Monthly Cashflow (Last 6 Months)
    const monthlyCashflow: { monthName: string; income: number; expense: number }[] = [];
    const persianMonthNames = [
      'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mStr = d.toISOString().slice(0, 7);

      const mTotals = db
        .prepare(`
          SELECT 
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
          FROM transactions
          WHERE date LIKE ?
        `)
        .get(`${mStr}%`) as { income: number; expense: number };

      // Determine Jalali month name estimate
      const jalaliMonthIndex = (d.getMonth() + 9) % 12;
      const monthName = persianMonthNames[jalaliMonthIndex] || mStr;

      monthlyCashflow.push({
        monthName,
        income: mTotals.income,
        expense: mTotals.expense,
      });
    }

    return {
      totalBalance,
      monthIncome,
      monthExpense,
      netSavings,
      savingsRate,
      previousMonthExpense,
      expenseChangePercentage,
      categoryBreakdown,
      monthlyCashflow,
    };
  },
};
