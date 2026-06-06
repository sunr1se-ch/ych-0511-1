import { query, queryOne, run } from './dbUtils';
import type { SensorData } from '../../shared/types';

interface SensorDataRow {
  id: number;
  fieldId: number;
  humidity: number;
  timestamp: string;
}

export const SensorDataModel = {
  getByFieldId(fieldId: number, hours: number = 2): SensorData[] {
    return query<SensorDataRow>(`
      SELECT * FROM sensor_data 
      WHERE field_id = ? AND timestamp >= datetime('now', ?)
      ORDER BY timestamp ASC
    `, [fieldId, `-${hours} hours`]);
  },

  getByTimeRange(fieldId: number, startTime: string, endTime: string): SensorData[] {
    return query<SensorDataRow>(`
      SELECT * FROM sensor_data 
      WHERE field_id = ? AND timestamp >= ? AND timestamp <= ?
      ORDER BY timestamp ASC
    `, [fieldId, startTime, endTime]);
  },

  getRecentByFieldId(fieldId: number, limit: number = 3): SensorData[] {
    return query<SensorDataRow>(`
      SELECT * FROM sensor_data 
      WHERE field_id = ? 
      ORDER BY timestamp DESC
      LIMIT ?
    `, [fieldId, limit]);
  },

  getLatestByFieldId(fieldId: number): SensorData | undefined {
    return queryOne<SensorDataRow>(`
      SELECT * FROM sensor_data 
      WHERE field_id = ? 
      ORDER BY timestamp DESC
      LIMIT 1
    `, [fieldId]);
  },

  create(fieldId: number, humidity: number, timestamp?: string): SensorData {
    const ts = timestamp || new Date().toISOString();
    const result = run(`
      INSERT INTO sensor_data (field_id, humidity, timestamp)
      VALUES (?, ?, ?)
    `, [fieldId, humidity, ts]);

    return {
      id: result.lastInsertRowid,
      fieldId,
      humidity,
      timestamp: ts,
    };
  },
};
