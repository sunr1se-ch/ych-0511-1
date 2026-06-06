import { Request, Response } from 'express';
import { FieldModel } from '../models/FieldModel';
import { FieldService } from '../services/FieldService';
import type { Field, CreateFieldRequest, UpdateFieldRequest, ApiResponse } from '../../shared/types';

export const FieldController = {
  getAll(_req: Request, res: Response<ApiResponse<Field[]>>) {
    const fields = FieldService.getAllFieldsWithStatus();
    res.json({ success: true, data: fields });
  },

  getById(req: Request<{ id: string }>, res: Response<ApiResponse<Field>>) {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(404).json({ success: false, message: '晒场不存在' });
      return;
    }
    const field = FieldService.getFieldWithStatus(id);
    if (!field) {
      res.status(404).json({ success: false, message: '晒场不存在' });
      return;
    }
    res.json({ success: true, data: field });
  },

  create(req: Request<unknown, unknown, CreateFieldRequest>, res: Response<ApiResponse<Field>>) {
    const { code, area, humidityThreshold } = req.body;
    if (!code || area === undefined || humidityThreshold === undefined) {
      res.status(400).json({ success: false, message: '缺少必要参数' });
      return;
    }

    const existing = FieldModel.getByCode(code);
    if (existing) {
      res.status(400).json({ success: false, message: '晒场编号已存在' });
      return;
    }

    const field = FieldModel.create({ code, area, humidityThreshold });
    res.status(201).json({ success: true, data: field });
  },

  update(req: Request<{ id: string }, unknown, UpdateFieldRequest>, res: Response<ApiResponse<Field>>) {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(404).json({ success: false, message: '晒场不存在' });
      return;
    }
    const existing = FieldModel.getById(id);
    if (!existing) {
      res.status(404).json({ success: false, message: '晒场不存在' });
      return;
    }

    if (req.body.code && req.body.code !== existing.code) {
      const duplicate = FieldModel.getByCode(req.body.code);
      if (duplicate) {
        res.status(400).json({ success: false, message: '晒场编号已存在' });
        return;
      }
    }

    const field = FieldModel.update(id, req.body);
    res.json({ success: true, data: field! });
  },

  delete(req: Request<{ id: string }>, res: Response<ApiResponse<null>>) {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(404).json({ success: false, message: '晒场不存在' });
      return;
    }
    const success = FieldModel.delete(id);
    if (!success) {
      res.status(404).json({ success: false, message: '晒场不存在' });
      return;
    }
    res.json({ success: true, data: null });
  },
};
