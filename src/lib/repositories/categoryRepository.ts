import { getDb } from '../db';
import { Category, TransactionType } from '@/types';
import { CreateCategoryInput } from '../validations';

export const categoryRepository = {
  findMany(type?: TransactionType): Category[] {
    const db = getDb();
    if (type) {
      const rows = db.prepare('SELECT * FROM categories WHERE type = ? ORDER BY name ASC').all(type);
      return rows as unknown as Category[];
    }
    const rows = db.prepare('SELECT * FROM categories ORDER BY type DESC, name ASC').all();
    return rows as unknown as Category[];
  },

  findById(id: string): Category | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    return (row as unknown as Category) || null;
  },

  create(data: CreateCategoryInput): Category {
    const db = getDb();
    const id = 'cat-' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO categories (id, name, nameEn, icon, color, type, isDefault, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.name,
      data.nameEn,
      data.icon,
      data.color,
      data.type,
      0,
      now
    );

    return this.findById(id)!;
  },

  delete(id: string): boolean {
    const db = getDb();
    const res = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    return res.changes > 0;
  },
};
