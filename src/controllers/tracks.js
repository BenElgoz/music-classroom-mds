import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

export async function listBySession(req, res) {
  try {
    const sessionId = Number(req.params.sessionId);
    const tracks = await prisma.track.findMany({
      where: { sessionId },
      orderBy: [{ votes: { _count: 'desc' } }, { submittedAt: 'asc' }],
      include: { votes: true }
    });
    res.json(tracks);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function createTrack(req, res) {
  try {
    const { artist, title, sessionId, userId } = req.body;
    if (!artist || !title || !sessionId || !userId) {
      return res.status(400).json({ error: 'artist, title, sessionId, userId requis' });
    }
    const track = await prisma.track.create({
      data: {
        artist,
        title,
        sessionId: Number(sessionId),
        userId: Number(userId)
      }
    });
    res.status(201).json(track);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function topOfDay(req, res) {
  try {
    const today = dayjs().startOf('day');
    const tracks = await prisma.track.findMany({
      where: { submittedAt: { gte: today.toDate() } },
      include: { votes: true }
    });
    const ranked = tracks
      .map(t => ({ ...t, voteCount: t.votes.length }))
      .sort((a, b) => b.voteCount - a.voteCount || a.submittedAt - b.submittedAt);
    res.json(ranked);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function deleteTrack(req, res) {
  try {
    const id = Number(req.params.id);
    const { userId } = req.body; // à sécuriser via auth plus tard
    const track = await prisma.track.findUnique({ where: { id } });
    if (!track) return res.status(404).json({ error: 'Not found' });
    if (userId !== track.userId) return res.status(403).json({ error: 'Forbidden' });
    await prisma.vote.deleteMany({ where: { trackId: id } });
    await prisma.track.delete({ where: { id } });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
