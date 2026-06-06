import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { WorkOrderModel } from '../models/WorkOrderModel';
import type { WorkOrder, CompleteWorkOrderRequest, ApiResponse, WorkOrderStatus } from '../../shared/types';

export const WorkOrderController = {
  getAll(req: Request, res: Response<ApiResponse<WorkOrder[]>>) {
    const status = req.query.status as WorkOrderStatus | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    let orders: WorkOrder[];
    if (startDate && endDate) {
      orders = WorkOrderModel.getByDateRange(startDate, endDate, status);
    } else {
      orders = WorkOrderModel.getAll(status);
    }

    res.json({ success: true, data: orders });
  },

  getById(req: Request<{ id: string }>, res: Response<ApiResponse<WorkOrder>>) {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(404).json({ success: false, message: '工单不存在' });
      return;
    }
    const order = WorkOrderModel.getById(id);
    if (!order) {
      res.status(404).json({ success: false, message: '工单不存在' });
      return;
    }
    res.json({ success: true, data: order });
  },

  complete(req: Request<{ id: string }, unknown, CompleteWorkOrderRequest>, res: Response<ApiResponse<WorkOrder>>) {
    const id = parseInt(req.params.id, 10);
    const { workDuration, remark, photoBase64 } = req.body;

    if (isNaN(id)) {
      res.status(404).json({ success: false, message: '工单不存在' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ success: false, message: '未登录' });
      return;
    }

    if (!remark?.trim()) {
      res.status(400).json({ success: false, message: '请填写作业备注' });
      return;
    }

    if (!workDuration || workDuration <= 0) {
      res.status(400).json({ success: false, message: '请填写有效的作业时长' });
      return;
    }

    const order = WorkOrderModel.getById(id);
    if (!order) {
      res.status(404).json({ success: false, message: '工单不存在' });
      return;
    }

    if (order.status === 'completed') {
      res.status(400).json({ success: false, message: '工单已完成，不可重复操作' });
      return;
    }

    let photoUrl: string | undefined;
    if (photoBase64) {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const fileName = `workorder_${id}_${Date.now()}.jpg`;
      const filePath = path.join(uploadsDir, fileName);
      const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(filePath, base64Data, 'base64');
      photoUrl = `/uploads/${fileName}`;
    }

    const updated = WorkOrderModel.complete(id, req.user.id, {
      workDuration,
      remark,
      photoBase64: photoUrl,
    });

    res.json({ success: true, data: updated! });
  },
};
