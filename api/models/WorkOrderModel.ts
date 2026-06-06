import { query, queryOne, run } from './dbUtils';
import type { WorkOrder, WorkOrderStatus, CompleteWorkOrderRequest } from '../../shared/types';

interface WorkOrderRow {
  id: number;
  fieldId: number;
  fieldCode: string;
  operatorId?: number;
  operatorName?: string;
  status: WorkOrderStatus;
  humidityAvg: number;
  triggeredAt: string;
  completedAt?: string;
  workDuration?: number;
  remark?: string;
  photoUrl?: string;
  createdAt: string;
}

export const WorkOrderModel = {
  getAll(status?: WorkOrderStatus): WorkOrder[] {
    let sql = `
      SELECT wo.*, f.code as field_code, u.name as operator_name
      FROM work_orders wo
      LEFT JOIN fields f ON wo.field_id = f.id
      LEFT JOIN users u ON wo.operator_id = u.id
    `;
    const params: unknown[] = [];

    if (status) {
      sql += ' WHERE wo.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY wo.created_at DESC';

    return query<WorkOrderRow>(sql, params);
  },

  getById(id: number): WorkOrder | undefined {
    return queryOne<WorkOrderRow>(`
      SELECT wo.*, f.code as field_code, u.name as operator_name
      FROM work_orders wo
      LEFT JOIN fields f ON wo.field_id = f.id
      LEFT JOIN users u ON wo.operator_id = u.id
      WHERE wo.id = ?
    `, [id]);
  },

  getPendingByFieldIdAndDate(fieldId: number, date: string): WorkOrder | undefined {
    return queryOne<WorkOrderRow>(`
      SELECT wo.*, f.code as field_code
      FROM work_orders wo
      LEFT JOIN fields f ON wo.field_id = f.id
      WHERE wo.field_id = ? 
        AND wo.status IN ('pending', 'processing')
        AND DATE(wo.created_at) = ?
      LIMIT 1
    `, [fieldId, date]);
  },

  create(fieldId: number, humidityAvg: number, triggeredAt: string): WorkOrder {
    const result = run(`
      INSERT INTO work_orders (field_id, status, humidity_avg, triggered_at)
      VALUES (?, 'pending', ?, ?)
    `, [fieldId, humidityAvg, triggeredAt]);

    return this.getById(result.lastInsertRowid)!;
  },

  updateStatus(id: number, status: WorkOrderStatus): boolean {
    const result = run('UPDATE work_orders SET status = ? WHERE id = ?', [status, id]);
    return result.changes > 0;
  },

  complete(id: number, operatorId: number, data: CompleteWorkOrderRequest): WorkOrder | undefined {
    const now = new Date().toISOString();
    run(`
      UPDATE work_orders 
      SET status = 'completed', 
          operator_id = ?, 
          completed_at = ?, 
          work_duration = ?, 
          remark = ?,
          photo_url = ?
      WHERE id = ?
    `, [operatorId, now, data.workDuration, data.remark, data.photoBase64 || null, id]);

    return this.getById(id);
  },

  getByDateRange(startDate: string, endDate: string, status?: WorkOrderStatus): WorkOrder[] {
    let sql = `
      SELECT wo.*, f.code as field_code, u.name as operator_name
      FROM work_orders wo
      LEFT JOIN fields f ON wo.field_id = f.id
      LEFT JOIN users u ON wo.operator_id = u.id
      WHERE DATE(wo.created_at) BETWEEN ? AND ?
    `;
    const params: unknown[] = [startDate, endDate];

    if (status) {
      sql += ' AND wo.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY wo.created_at DESC';

    return query<WorkOrderRow>(sql, params);
  },
};
