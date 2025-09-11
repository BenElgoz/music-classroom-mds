import { prisma } from '../config/database.js';
import { signJwt, verifyJwt } from '../utils/jwt.js';
import { sendLoginLink } from '../services/email.js';

export const register = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requis' });

  const preUser = await prisma.pre_registered_users.findUnique({ where: { email } });
  if (!preUser || preUser.isUsed) {
    return res.status(403).json({ error: 'Email non autorisé ou déjà utilisé' });
  }

  const token = signJwt({ email });
  await sendLoginLink(email, token);

  res.json({ message: 'Lien envoyé par email' });
};

export const login = async (req, res) => {
  const { token } = req.body;
  try {
    const payload = verifyJwt(token);

    const preUser = await prisma.pre_registered_users.findUnique({
      where: { email: payload.email },
    });
    if (!preUser || preUser.isUsed) {
      return res.status(403).json({ error: 'Lien invalide ou déjà utilisé' });
    }

    await prisma.user.create({
      data: {
        email: preUser.email,
        firstname: preUser.firstname,
        lastname: preUser.lastname,
        promotion: preUser.promotion,
      },
    });

    await prisma.pre_registered_users.update({
      where: { email: preUser.email },
      data: { isUsed: true },
    });

    res.json({ message: 'Connexion réussie' });
  } catch (e) {
    res.status(401).json({ error: 'Token invalide' });
  }
};
