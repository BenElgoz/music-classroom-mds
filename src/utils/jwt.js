import jwt from 'jsonwebtoken';

const { JWT_SECRET = 'dev-secret', JWT_EXPIRES = '365d' } = process.env;

export function signJwt(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyJwt(token) {
  return jwt.verify(token, JWT_SECRET);
}