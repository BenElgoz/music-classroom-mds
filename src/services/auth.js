import crypto from 'crypto';
import { prisma } from '../config/database.js';
import { signJwt } from '../utils/jwt.js';
import { sendLoginLink } from './email.js';

const LOGIN_TOKEN_TTL_MIN = Number(process.env.LOGIN_TOKEN_TTL_MIN || 15);

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex'); // simple; en prod => stocker hashé
}

// 1) Démarrer un login par email
export async function startEmailLogin(email) {
  // Normaliser l'email
  const normalized = email.trim().toLowerCase();

  // Vérifier si l'email est autorisé (PreRegisteredUser)
  let user = await prisma.user.findUnique({ where: { email: normalized } });

  if (!user) {
    const pre = await prisma.preRegisteredUser.findUnique({ where: { email: normalized } });
    if (!pre) {
      throw Object.assign(new Error('Email non autorisé'), { status: 403 });
    }
    // Créer l'utilisateur à la 1re demande
    user = await prisma.user.create({
      data: {
        email: normalized,
        firstname: pre.firstname,
        lastname: pre.lastname,
        promotion: pre.promotion,
        isActive: true,
      },
    });
    // Optionnel: marquer le pré-enregistrement comme utilisé pour éviter des doublons
    await prisma.preRegisteredUser.update({
      where: { id: pre.id },
      data: { isUsed: true },
    });
  }

  // Générer un token one-time
  const token = randomToken();
  const expiresAt = new Date(Date.now() + LOGIN_TOKEN_TTL_MIN * 60 * 1000);

  await prisma.authToken.create({
    data: {
      token,
      expiresAt,
      userId: user.id,
    },
  });

  await sendLoginLink(normalized, token);

  return { ok: true };
}

// 2) Consommer le token => JWT
export async function consumeLoginToken(token) {
  const now = new Date();
  const row = await prisma.authToken.findUnique({ where: { token } });

  if (!row || row.isUsed || row.expiresAt < now) {
    throw Object.assign(new Error('Token invalide ou expiré'), { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: row.userId } });
  if (!user || !user.isActive) {
    throw Object.assign(new Error('Utilisateur inactif'), { status: 403 });
  }

  // Marquer le token comme utilisé et mettre à jour lastLogin
  await prisma.$transaction([
    prisma.authToken.update({ where: { id: row.id }, data: { isUsed: true } }),
    prisma.user.update({ where: { id: user.id }, data: { lastLogin: now } }),
  ]);

  const payload = {
    sub: user.id,
    email: user.email,
    given_name: user.firstname,
    family_name: user.lastname,
    promotion: user.promotion,
  };
  const jwt = signJwt(payload);

  return { token: jwt, user };
}
