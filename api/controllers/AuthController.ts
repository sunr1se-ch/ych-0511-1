import { Request, Response } from 'express';
import { UserModel } from '../models/UserModel';
import type { LoginRequest, ApiResponse, LoginResponse } from '../../shared/types';

export const AuthController = {
  login(req: Request<unknown, unknown, LoginRequest>, res: Response<ApiResponse<LoginResponse>>) {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ success: false, message: '请输入用户名和密码' });
      return;
    }

    const result = UserModel.login({ username, password });
    if (!result) {
      res.status(401).json({ success: false, message: '用户名或密码错误' });
      return;
    }

    res.json({ success: true, data: result });
  },

  me(req: Request, res: Response<ApiResponse<{ user: typeof req.user }>>) {
    res.json({ success: true, data: { user: req.user } });
  },
};
