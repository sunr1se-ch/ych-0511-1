import { Router } from 'express';
import { WorkOrderController } from '../controllers/WorkOrderController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, WorkOrderController.getAll);
router.get('/:id', authMiddleware, WorkOrderController.getById);
router.post('/:id/complete', authMiddleware, WorkOrderController.complete);

export default router;
