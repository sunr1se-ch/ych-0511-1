import { Router } from 'express';
import { FieldController } from '../controllers/FieldController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, FieldController.getAll);
router.get('/:id', authMiddleware, FieldController.getById);
router.post('/', authMiddleware, adminMiddleware, FieldController.create);
router.put('/:id', authMiddleware, adminMiddleware, FieldController.update);
router.delete('/:id', authMiddleware, adminMiddleware, FieldController.delete);

export default router;
