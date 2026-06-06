import { Router } from 'express';
import { SensorDataController } from '../controllers/SensorDataController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, SensorDataController.getByFieldId);
router.get('/range', authMiddleware, SensorDataController.getByTimeRange);
router.post('/', authMiddleware, SensorDataController.create);

export default router;
