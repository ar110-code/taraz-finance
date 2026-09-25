import { getDb } from '../db';
import { Loan, Account } from '@/types';
import { CreateLoanInput, UpdateLoanInput } from '../validations';
import { accountRepository } from './accountRepository';

function calculateLoanMetrics(loan: Loan): Loan {
  const remainingInstallments = Math.max(0, loan.totalInstallments - loan.paidInstallments);
  const remainingAmount = remainingInstallments * loan.installmentAmount;
  const progressPercentage = loan.totalInstallments > 0
    ? Math.round((loan.paidInstallments / loan.totalInstallments) * 100)
    : 0;

  // Calculate days until due
  const today = new Date();
  const currentDay = today.getDate();
  let daysUntilDue = loan.dueDay - currentDay;
  if (daysUntilDue < 0) {
    // Due next month (rough calculation)
    daysUntilDue += 30;
  }

  return {
    ...loan,
    remainingInstallments,
    remainingAmount,
    progressPercentage,
    daysUntilDue,
    isOverdue: loan.status === 'active' && daysUntilDue <= 3,
  };
}

export const loanRepository = {
  findMany(): Loan[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM loans ORDER BY status ASC, dueDay ASC').all() as unknown as Loan[];
    const accounts = accountRepository.findMany();
    const accMap = new Map<string, Account>(accounts.map((a) => [a.id, a]));

    return rows.map((r) => {
      const loan: Loan = {
        ...r,
        account: accMap.get(r.accountId),
      };
      return calculateLoanMetrics(loan);
    });
  },

  findById(id: string): Loan | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM loans WHERE id = ?').get(id) as unknown as Loan | undefined;
    if (!row) return null;

    const account = accountRepository.findById(row.accountId);
    return calculateLoanMetrics({
      ...row,
      account: account || undefined,
    });
  },

  create(data: CreateLoanInput): Loan {
    const db = getDb();
    const id = 'loan-' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO loans (
        id, title, lender, totalAmount, installmentAmount, totalInstallments,
        paidInstallments, dueDay, startDate, accountId, status, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.title,
      data.lender,
      data.totalAmount,
      data.installmentAmount,
      data.totalInstallments,
      data.paidInstallments ?? 0,
      data.dueDay,
      data.startDate,
      data.accountId,
      'active',
      now
    );

    return this.findById(id)!;
  },

  update(id: string, data: UpdateLoanInput): Loan {
    const db = getDb();
    const existing = this.findById(id);
    if (!existing) throw new Error('وام یافت نشد');

    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
    if (data.lender !== undefined) { fields.push('lender = ?'); values.push(data.lender); }
    if (data.totalAmount !== undefined) { fields.push('totalAmount = ?'); values.push(data.totalAmount); }
    if (data.installmentAmount !== undefined) { fields.push('installmentAmount = ?'); values.push(data.installmentAmount); }
    if (data.totalInstallments !== undefined) { fields.push('totalInstallments = ?'); values.push(data.totalInstallments); }
    if (data.paidInstallments !== undefined) { fields.push('paidInstallments = ?'); values.push(data.paidInstallments); }
    if (data.dueDay !== undefined) { fields.push('dueDay = ?'); values.push(data.dueDay); }
    if (data.startDate !== undefined) { fields.push('startDate = ?'); values.push(data.startDate); }
    if (data.accountId !== undefined) { fields.push('accountId = ?'); values.push(data.accountId); }

    if (fields.length > 0) {
      values.push(id);
      db.prepare(`UPDATE loans SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.findById(id)!;
  },

  payInstallment(id: string): { loan: Loan; transactionId: string } {
    const db = getDb();
    const loan = this.findById(id);
    if (!loan) throw new Error('وام مورد نظر یافت نشد');
    if (loan.status === 'completed') throw new Error('کلیه اقساط این وام قبلاً پرداخت شده است');

    const nextPaid = loan.paidInstallments + 1;
    const isNowCompleted = nextPaid >= loan.totalInstallments;

    db.exec('BEGIN TRANSACTION;');
    try {
      // 1. Update loan installment count
      db.prepare(`
        UPDATE loans SET
          paidInstallments = ?,
          status = ?
        WHERE id = ?
      `).run(nextPaid, isNowCompleted ? 'completed' : 'active', id);

      // 2. Find or create loan category
      let categoryRow = db.prepare("SELECT id FROM categories WHERE id = 'cat-loans'").get() as { id: string } | undefined;
      if (!categoryRow) {
        categoryRow = db.prepare("SELECT id FROM categories WHERE type = 'expense' LIMIT 1").get() as { id: string } | undefined;
      }
      const categoryId = categoryRow ? categoryRow.id : 'cat-loans';

      // 3. Record expense transaction
      const txId = 'tx-' + Math.random().toString(36).substring(2, 9);
      const now = new Date().toISOString();
      const todayStr = now.slice(0, 10);

      db.prepare(`
        INSERT INTO transactions (
          id, type, amount, title, categoryId, accountId, date, note, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        txId,
        'expense',
        loan.installmentAmount,
        `پرداخت قسط ${loan.title} (${nextPaid} از ${loan.totalInstallments})`,
        categoryId,
        loan.accountId,
        todayStr,
        `بابت قسط شماره ${nextPaid} از وام «${loan.title}» - وام‌دهنده: ${loan.lender}`,
        now,
        now
      );

      // 4. Deduct installment amount from account
      accountRepository.updateBalance(loan.accountId, -loan.installmentAmount);

      db.exec('COMMIT;');

      return {
        loan: this.findById(id)!,
        transactionId: txId,
      };
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  },

  delete(id: string): boolean {
    const db = getDb();
    const res = db.prepare('DELETE FROM loans WHERE id = ?').run(id);
    return res.changes > 0;
  },
};
