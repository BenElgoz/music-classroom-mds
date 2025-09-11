import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

export async function voteTrack(req, res) {
  try {
    const { userId, trackId } = req.body;
    if (!userId || !trackId) return res.status(400).json({ error: 'userId, trackId requis' });

    // Récupérer la session du track
    const track = await prisma.track.findUnique({ where: { id: Number(trackId) } });
    if (!track) return res.status(404).json({ error: 'Track not found' });

    // Règle: un vote par utilisateur par jour ET par session
    const today = dayjs().format('YYYY-MM-DD');
    const session = await prisma.session.findUnique({ where: { id: track.sessionId } });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const existing = await prisma.vote.findFirst({
      where: {
        userId: Number(userId),
        sessionId: session.id,
        votedAt: {
          gte: dayjs(today).startOf('day').toDate(),
          lte: dayjs(today).endOf('day').toDate(),
        }
      }
    });

    if (existing) return res.status(409).json({ error: 'Déjà voté aujourd\'hui pour cette session' });

    const vote = await prisma.vote.create({
      data: {
        userId: Number(userId),
        trackId: Number(trackId),
        sessionId: session.id
      }
    });

    res.status(201).json(vote);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
