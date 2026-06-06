import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../models/UserModel';
import type { User } from '../../shared/types';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: '未提供认证令牌' });
    return;
  }

  const token = authHeader.substring(7);
  const user = UserModel.verifyToken(token);
  if (!user) {
    res.status(401).json({ success: false, message: '认证令牌无效或已过期' });
    return;
  }

  req.user = user;
  next();
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ success: false, message: '需要管理员权限' });
    return;
  }
  next();
}
