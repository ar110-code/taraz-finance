import { getDb } from '../db';
import { Account } from '@/types';
import { CreateAccountInput } from '../validations';

export const accountRepository = {
  findMany(): Account[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM accounts ORDER BY balance DESC').all();
    return rows as unknown as Account[];
  },

  findById(id: string): Account | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
    return (row as unknown as Account) || null;
  },

  create(data: CreateAccountInput): Account {
    const db = getDb();
    const id = 'acc-' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO accounts (id, name, balance, bankName, color, icon, accountNumber, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.name,
      data.balance ?? 0,
      data.bankName,
      data.color ?? '#6366f1',
      data.icon ?? 'CreditCard',
      data.accountNumber ?? null,
      now
    );

    return this.findById(id)!;
  },

  updateBalance(id: string, delta: number) {
    const db = getDb();
    db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(delta, id);
  },

  delete(id: string): boolean {
    const db = getDb();
    const res = db.prepare('DELETE FROM accounts WHERE id = ?').run(id);
    return res.changes > 0;
  },
};
