import { Router } from 'express';
import { prisma } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';
import { loginStart, callback } from '../controllers/auth.js';
import { requireBody } from '../middleware/validation.js';

const router = Router();

router.post('/login/start', requireBody(['email']), loginStart);

// debug DB
router.get('/_debug-users', async (req, res, next) => {
  try {
    const all = await prisma.user.findMany({ orderBy: { id: 'asc' } });
    res.json(all);
  } catch (e) {
    next(e);
  }
});

// Auth
router.post('/login/start', loginStart);
router.get('/callback', callback);

// Profil connecté
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
