import { Router } from 'express';
import { listToday, listTodayByPromotion, getById, listByDate } from '../controllers/sessions.js';
import { requireBody } from '../middleware/validation.js';
import { loginStart } from '../controllers/auth.js';

const router = Router();

router.post('/login/start', requireBody(['email']), loginStart);
router.get('/sessions', listToday);
router.get('/sessions/today', listTodayByPromotion);
router.get('/sessions/:id', getById);
router.get('/sessions/by-date/:date', listByDate);

export default router;
