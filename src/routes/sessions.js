import { Router } from 'express';
import { listToday, listTodayByPromotion, getById, listByDate } from '../controllers/sessions.js';

const router = Router();

router.get('/sessions', listToday);
router.get('/sessions/today', listTodayByPromotion);
router.get('/sessions/:id', getById);
router.get('/sessions/by-date/:date', listByDate);

export default router;
