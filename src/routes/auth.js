import { Router } from 'express';
import { prisma } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// route debug qui verif la DB
router.get('/_debug-users', async (req, res, next) => {
  try {
    const all = await prisma.user.findMany({ orderBy: { id: 'asc' } });
    res.json(all);
  } catch (e) {
    next(e);
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;