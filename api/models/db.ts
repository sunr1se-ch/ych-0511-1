import initSqlJs, { Database } from 'sql.js';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

let db: Database | null = null;

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'app.db');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function saveDatabase() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

async function initDatabase() {
  const wasmPath = process.env.SQL_WASM_PATH || path.join(process.cwd(), 'sql-wasm.wasm');
  const wasmBuffer = fs.readFileSync(wasmPath);
  
  const SQL = await initSqlJs({
    locateFile: () => wasmPath,
    wasmBinary: wasmBuffer,
  });

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
    console.log('Existing database loaded');
  } else {
    db = new SQL.Database();
    console.log('New database created');
  }

  runMigrations();
  seedDemoData();
  saveDatabase();
}

function runMigrations() {
  if (!db) return;

  const migrationPath = path.join(process.cwd(), 'migrations', '001_init.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
  
  const statements = migrationSql.split(';').filter(s => s.trim());
  for (const sql of statements) {
    if (sql.trim()) {
      db.run(sql);
    }
  }
  console.log('Migrations completed');
}

function seedDemoData() {
  if (!db) return;

  const userCount = db.exec('SELECT COUNT(*) as count FROM users')[0].values[0][0] as number;
  if (userCount > 0) {
    console.log('Demo data already exists, skipping seed');
    return;
  }

  const hashAdmin = bcrypt.hashSync('admin123', 10);
  const hashOperator = bcrypt.hashSync('operator123', 10);

  db.run('INSERT INTO users (username, password_hash, name, role) VALUES (?, ?, ?, ?)', 
    ['admin', hashAdmin, '张管理员', 'admin']);
  db.run('INSERT INTO users (username, password_hash, name, role) VALUES (?, ?, ?, ?)', 
    ['operator1', hashOperator, '李作业员', 'operator']);

  db.run('INSERT INTO fields (code, area, humidity_threshold) VALUES (?, ?, ?)',
    ['A-01', 500.00, 70.00]);
  db.run('INSERT INTO fields (code, area, humidity_threshold) VALUES (?, ?, ?)',
    ['A-02', 600.00, 70.00]);
  db.run('INSERT INTO fields (code, area, humidity_threshold) VALUES (?, ?, ?)',
    ['B-01', 450.00, 68.00]);

  const now = new Date();
  const minutesAgo = (min: number) => new Date(now.getTime() - min * 60 * 1000).toISOString();

  db.run('INSERT INTO sensor_data (field_id, humidity, timestamp) VALUES (?, ?, ?)',
    [1, 65.5, minutesAgo(30)]);
  db.run('INSERT INTO sensor_data (field_id, humidity, timestamp) VALUES (?, ?, ?)',
    [1, 75.0, minutesAgo(20)]);
  db.run('INSERT INTO sensor_data (field_id, humidity, timestamp) VALUES (?, ?, ?)',
    [1, 78.0, minutesAgo(10)]);
  db.run('INSERT INTO sensor_data (field_id, humidity, timestamp) VALUES (?, ?, ?)',
    [1, 80.0, minutesAgo(0)]);

  db.run('INSERT INTO sensor_data (field_id, humidity, timestamp) VALUES (?, ?, ?)',
    [2, 62.3, minutesAgo(20)]);
  db.run('INSERT INTO sensor_data (field_id, humidity, timestamp) VALUES (?, ?, ?)',
    [2, 64.1, minutesAgo(10)]);
  db.run('INSERT INTO sensor_data (field_id, humidity, timestamp) VALUES (?, ?, ?)',
    [2, 63.5, minutesAgo(0)]);

  db.run('INSERT INTO sensor_data (field_id, humidity, timestamp) VALUES (?, ?, ?)',
    [3, 66.0, minutesAgo(20)]);
  db.run('INSERT INTO sensor_data (field_id, humidity, timestamp) VALUES (?, ?, ?)',
    [3, 67.2, minutesAgo(10)]);
  db.run('INSERT INTO sensor_data (field_id, humidity, timestamp) VALUES (?, ?, ?)',
    [3, 65.8, minutesAgo(0)]);

  const triggeredAt = minutesAgo(60);
  const completedAt = minutesAgo(15);
  db.run(`INSERT INTO work_orders (field_id, operator_id, status, humidity_avg, 
    triggered_at, completed_at, work_duration, remark, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [1, 2, 'completed', 77.67, triggeredAt, completedAt, 45, 
     '翻粮完成，湿度已下降至68%', triggeredAt]);

  console.log('Demo data seeded successfully');
}

function getDb(): Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export { initDatabase, getDb, saveDatabase };
export type { Database };
