import { Router } from 'express';
import { voteTrack } from '../controllers/votes.js';

const router = Router();

router.post('/votes', voteTrack);

export default router;
