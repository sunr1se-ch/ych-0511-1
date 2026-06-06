import { getDb, saveDatabase } from './db';
import type { Database } from './db';

interface QueryResult {
  columns: string[];
  values: unknown[][];
}

function mapRows<T>(result: QueryResult | undefined): T[] {
  if (!result || !result.columns || result.values.length === 0) {
    return [];
  }

  return result.values.map(row => {
    const obj: Record<string, unknown> = {};
    result.columns.forEach((col, index) => {
      const camelCase = col.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      obj[camelCase] = row[index];
    });
    return obj as T;
  });
}

function mapRow<T>(result: QueryResult | undefined): T | undefined {
  const rows = mapRows<T>(result);
  return rows[0];
}

export function query<T>(sql: string, params: unknown[] = []): T[] {
  const db = getDb();
  const result = db.exec(sql, params) as QueryResult[];
  return mapRows<T>(result[0]);
}

export function queryOne<T>(sql: string, params: unknown[] = []): T | undefined {
  const db = getDb();
  const result = db.exec(sql, params) as QueryResult[];
  return mapRow<T>(result[0]);
}

export function run(sql: string, params: unknown[] = []): { lastInsertRowid: number; changes: number } {
  const db = getDb();
  db.run(sql, params);
  saveDatabase();
  
  const lastId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] as number;
  const changesResult = db.exec('SELECT changes() as c')[0].values[0][0] as number;
  
  return {
    lastInsertRowid: lastId,
    changes: changesResult,
  };
}

export function getDatabase(): Database {
  return getDb();
}
