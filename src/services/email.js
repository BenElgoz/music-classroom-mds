import nodemailer from 'nodemailer';
import { getEmailTransportConfig } from '../config/email.js';

export async function sendLoginLink(email, token) {
  const transporter = nodemailer.createTransport(getEmailTransportConfig());

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const url = `${baseUrl}/login?token=${encodeURIComponent(token)}`;

  const html = `
    <p>Bonjour,</p>
    <p>Cliquez sur ce lien pour vous connecter (valable ${process.env.LOGIN_TOKEN_TTL_MIN || 15} minutes):</p>
    <p><a href="${url}">${url}</a></p>
    <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
  `;

  await transporter.sendMail({
    to: email,
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    subject: 'Votre lien de connexion',
    html,
  });
}
