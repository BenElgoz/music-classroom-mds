import { Router } from 'express';
import { listBySession, createTrack, topOfDay, deleteTrack } from '../controllers/tracks.js';
import { requireBody } from '../middleware/validation.js';
import { requireAuth } from '../middleware/auth.js';
import { loginStart } from '../controllers/auth.js';

const router = Router();

router.post('/login/start', requireBody(['email']), loginStart);
router.get('/tracks/session/:sessionId', listBySession);
router.post('/tracks', requireAuth, createTrack);
router.get('/tracks/top', topOfDay);
router.delete('/tracks/:id', deleteTrack);

export default router;
