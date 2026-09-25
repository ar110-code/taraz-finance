import { getDb } from '../db';
import { Budget } from '@/types';
import { CreateBudgetInput } from '../validations';

export const budgetRepository = {
  findMany(period?: string): Budget[] {
    const db = getDb();
    const query = `
      SELECT 
        b.*,
        c.name as cat_name, c.nameEn as cat_nameEn, c.icon as cat_icon, c.color as cat_color, c.type as cat_type
      FROM budgets b
      LEFT JOIN categories c ON b.categoryId = c.id
      ${period ? 'WHERE b.period = ?' : ''}
      ORDER BY b.monthlyLimit DESC
    `;

    const rows = (period ? db.prepare(query).all(period) : db.prepare(query).all()) as Array<
      Record<string, unknown>
    >;

    return rows.map((row) => ({
      id: row.id as string,
      categoryId: row.categoryId as string,
      monthlyLimit: row.monthlyLimit as number,
      period: row.period as string,
      category: row.cat_name
        ? {
            id: row.categoryId as string,
            name: row.cat_name as string,
            nameEn: row.cat_nameEn as string,
            icon: row.cat_icon as string,
            color: row.cat_color as string,
            type: 'expense' as const,
          }
        : undefined,
    }));
  },

  upsert(data: CreateBudgetInput): Budget {
    const db = getDb();
    const now = new Date().toISOString();
    const existing = db.prepare('SELECT id FROM budgets WHERE categoryId = ?').get(data.categoryId) as { id: string } | undefined;

    if (existing) {
      db.prepare(`
        UPDATE budgets SET monthlyLimit = ?, period = ? WHERE id = ?
      `).run(data.monthlyLimit, data.period, existing.id);
      return this.findMany().find((b) => b.id === existing.id)!;
    } else {
      const id = 'b-' + Math.random().toString(36).substring(2, 9);
      db.prepare(`
        INSERT INTO budgets (id, categoryId, monthlyLimit, period, createdAt)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, data.categoryId, data.monthlyLimit, data.period, now);
      return this.findMany().find((b) => b.id === id)!;
    }
  },

  delete(id: string): boolean {
    const db = getDb();
    const res = db.prepare('DELETE FROM budgets WHERE id = ?').run(id);
    return res.changes > 0;
  },
};
