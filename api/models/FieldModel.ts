import { query, queryOne, run } from './dbUtils';
import type { Field, CreateFieldRequest, UpdateFieldRequest } from '../../shared/types';

interface FieldRow {
  id: number;
  code: string;
  area: number;
  humidityThreshold: number;
  createdAt: string;
}

export const FieldModel = {
  getAll(): Field[] {
    return query<FieldRow>('SELECT * FROM fields ORDER BY code');
  },

  getById(id: number): Field | undefined {
    return queryOne<FieldRow>('SELECT * FROM fields WHERE id = ?', [id]);
  },

  getByCode(code: string): Field | undefined {
    return queryOne<FieldRow>('SELECT * FROM fields WHERE code = ?', [code]);
  },

  create(data: CreateFieldRequest): Field {
    const result = run(`
      INSERT INTO fields (code, area, humidity_threshold)
      VALUES (?, ?, ?)
    `, [data.code, data.area, data.humidityThreshold]);

    return this.getById(result.lastInsertRowid)!;
  },

  update(id: number, data: UpdateFieldRequest): Field | undefined {
    const sets: string[] = [];
    const params: unknown[] = [];

    if (data.code !== undefined) {
      sets.push('code = ?');
      params.push(data.code);
    }
    if (data.area !== undefined) {
      sets.push('area = ?');
      params.push(data.area);
    }
    if (data.humidityThreshold !== undefined) {
      sets.push('humidity_threshold = ?');
      params.push(data.humidityThreshold);
    }

    if (sets.length === 0) return this.getById(id);

    params.push(id);
    run(`UPDATE fields SET ${sets.join(', ')} WHERE id = ?`, params);
    return this.getById(id);
  },

  delete(id: number): boolean {
    const result = run('DELETE FROM fields WHERE id = ?', [id]);
    return result.changes > 0;
  },
};
