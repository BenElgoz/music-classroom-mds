import { Router } from 'express';
import { listBySession, createTrack, topOfDay, deleteTrack } from '../controllers/tracks.js';

const router = Router();

router.get('/tracks/session/:sessionId', listBySession);
router.post('/tracks', createTrack);
router.get('/tracks/top', topOfDay);
router.delete('/tracks/:id', deleteTrack);

export default router;
