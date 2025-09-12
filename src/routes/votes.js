import { Router } from 'express';
import { voteTrack } from '../controllers/votes.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/votes', requireAuth, voteTrack);

export default router;
