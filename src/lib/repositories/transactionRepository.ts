import { getDb } from '../db';
import { Transaction, TransactionType } from '@/types';
import { CreateTransactionInput, UpdateTransactionInput } from '../validations';

export interface TransactionFilterOptions {
  query?: string;
  type?: TransactionType;
  categoryId?: string;
  accountId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export const transactionRepository = {
  findMany(options: TransactionFilterOptions = {}): { transactions: Transaction[]; total: number } {
    const db = getDb();
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (options.query) {
      conditions.push('(t.title LIKE ? OR t.note LIKE ?)');
      params.push(`%${options.query}%`, `%${options.query}%`);
    }

    if (options.type) {
      conditions.push('t.type = ?');
      params.push(options.type);
    }

    if (options.categoryId) {
      conditions.push('t.categoryId = ?');
      params.push(options.categoryId);
    }

    if (options.accountId) {
      conditions.push('t.accountId = ?');
      params.push(options.accountId);
    }

    if (options.startDate) {
      conditions.push('t.date >= ?');
      params.push(options.startDate);
    }

    if (options.endDate) {
      conditions.push('t.date <= ?');
      params.push(options.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db.prepare(`SELECT COUNT(*) as count FROM transactions t ${whereClause}`).get(...params) as { count: number };
    const total = countRow.count;

    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const query = `
      SELECT 
        t.*,
        c.name as cat_name, c.nameEn as cat_nameEn, c.icon as cat_icon, c.color as cat_color, c.type as cat_type,
        a.name as acc_name, a.bankName as acc_bankName, a.color as acc_color, a.icon as acc_icon
      FROM transactions t
      LEFT JOIN categories c ON t.categoryId = c.id
      LEFT JOIN accounts a ON t.accountId = a.id
      ${whereClause}
      ORDER BY t.date DESC, t.createdAt DESC
      LIMIT ? OFFSET ?
    `;

    const rows = db.prepare(query).all(...params, limit, offset) as Array<
      Record<string, unknown>
    >;

    const transactions: Transaction[] = rows.map((row) => ({
      id: row.id as string,
      type: row.type as TransactionType,
      amount: row.amount as number,
      title: row.title as string,
      categoryId: row.categoryId as string,
      accountId: row.accountId as string,
      date: row.date as string,
      note: (row.note as string) || undefined,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
      category: row.cat_name
        ? {
            id: row.categoryId as string,
            name: row.cat_name as string,
            nameEn: row.cat_nameEn as string,
            icon: row.cat_icon as string,
            color: row.cat_color as string,
            type: row.cat_type as TransactionType,
          }
        : undefined,
      account: row.acc_name
        ? {
            id: row.accountId as string,
            name: row.acc_name as string,
            balance: 0,
            bankName: row.acc_bankName as string,
            color: row.acc_color as string,
            icon: row.acc_icon as string,
          }
        : undefined,
    }));

    return { transactions, total };
  },

  findById(id: string): Transaction | null {
    const db = getDb();
    const query = `
      SELECT 
        t.*,
        c.name as cat_name, c.nameEn as cat_nameEn, c.icon as cat_icon, c.color as cat_color, c.type as cat_type,
        a.name as acc_name, a.bankName as acc_bankName, a.color as acc_color, a.icon as acc_icon
      FROM transactions t
      LEFT JOIN categories c ON t.categoryId = c.id
      LEFT JOIN accounts a ON t.accountId = a.id
      WHERE t.id = ?
    `;
    const row = db.prepare(query).get(id) as Record<string, unknown> | undefined;
    if (!row) return null;

    return {
      id: row.id as string,
      type: row.type as TransactionType,
      amount: row.amount as number,
      title: row.title as string,
      categoryId: row.categoryId as string,
      accountId: row.accountId as string,
      date: row.date as string,
      note: (row.note as string) || undefined,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
      category: row.cat_name
        ? {
            id: row.categoryId as string,
            name: row.cat_name as string,
            nameEn: row.cat_nameEn as string,
            icon: row.cat_icon as string,
            color: row.cat_color as string,
            type: row.cat_type as TransactionType,
          }
        : undefined,
      account: row.acc_name
        ? {
            id: row.accountId as string,
            name: row.acc_name as string,
            balance: 0,
            bankName: row.acc_bankName as string,
            color: row.acc_color as string,
            icon: row.acc_icon as string,
          }
        : undefined,
    };
  },

  create(data: CreateTransactionInput): Transaction {
    const db = getDb();
    const id = 'tx-' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO transactions (id, type, amount, title, categoryId, accountId, date, note, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.type,
      data.amount,
      data.title,
      data.categoryId,
      data.accountId,
      data.date,
      data.note ?? null,
      now,
      now
    );

    return this.findById(id)!;
  },

  update(id: string, data: UpdateTransactionInput): Transaction | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const db = getDb();
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };

    db.prepare(`
      UPDATE transactions
      SET type = ?, amount = ?, title = ?, categoryId = ?, accountId = ?, date = ?, note = ?, updatedAt = ?
      WHERE id = ?
    `).run(
      updated.type,
      updated.amount,
      updated.title,
      updated.categoryId,
      updated.accountId,
      updated.date,
      updated.note ?? null,
      updated.updatedAt,
      id
    );

    return this.findById(id);
  },

  delete(id: string): boolean {
    const db = getDb();
    const res = db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
    return res.changes > 0;
  },
};
