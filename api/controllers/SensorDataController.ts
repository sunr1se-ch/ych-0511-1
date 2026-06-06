import { Request, Response } from 'express';
import { SensorDataModel } from '../models/SensorDataModel';
import { WorkOrderService } from '../services/WorkOrderService';
import type { SensorData, ApiResponse } from '../../shared/types';

export const SensorDataController = {
  getByFieldId(req: Request, res: Response<ApiResponse<SensorData[]>>) {
    const fieldId = parseInt(req.query.fieldId as string);
    const hours = parseInt(req.query.hours as string) || 2;

    if (isNaN(fieldId)) {
      res.status(400).json({ success: false, message: '请提供有效的晒场ID' });
      return;
    }

    const data = SensorDataModel.getByFieldId(fieldId, hours);
    res.json({ success: true, data });
  },

  create(req: Request, res: Response<ApiResponse<SensorData>>) {
    const { fieldId, humidity } = req.body;
    if (!fieldId || humidity === undefined) {
      res.status(400).json({ success: false, message: '缺少必要参数' });
      return;
    }

    const data = SensorDataModel.create(fieldId, humidity);
    WorkOrderService.checkAndCreateWorkOrder(fieldId);
    res.status(201).json({ success: true, data });
  },
};
