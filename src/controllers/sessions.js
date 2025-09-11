import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

export async function listToday(req, res) {
  try {
    const today = dayjs().format('YYYY-MM-DD');
    const sessions = await prisma.session.findMany({
      where: { date: today },
      orderBy: [{ startTime: 'asc' }, { subject: 'asc' }]
    });
    res.json(sessions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function listTodayByPromotion(req, res) {
  try {
    const today = dayjs().format('YYYY-MM-DD');
    const sessions = await prisma.session.findMany({ where: { date: today } });
    const grouped = sessions.reduce((acc, s) => {
      const key = s.promotion || 'Autres';
      acc[key] = acc[key] || [];
      acc[key].push(s);
      return acc;
    }, {});
    res.json(grouped);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function getById(req, res) {
  try {
    const id = Number(req.params.id);
    const session = await prisma.session.findUnique({ where: { id } });
    if (!session) return res.status(404).json({ error: 'Not found' });
    res.json(session);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function listByDate(req, res) {
  try {
    const date = req.params.date; // YYYY-MM-DD
    const sessions = await prisma.session.findMany({
      where: { date },
      orderBy: [{ startTime: 'asc' }, { subject: 'asc' }]
    });
    res.json(sessions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
