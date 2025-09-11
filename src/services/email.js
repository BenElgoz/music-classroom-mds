import nodemailer from 'nodemailer';

export async function sendLoginLink(email, token) {
  const transporter = nodemailer.createTransport({
    // ...config SMTP...
    // host: process.env.SMTP_HOST,
    // port: Number(process.env.SMTP_PORT || 587),
    // secure: false,
    // auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const url = `${baseUrl}/login?token=${token}`;

  await transporter.sendMail({
    to: email,
    subject: 'Votre lien de connexion',
    html: `<p>Cliquez ici pour vous connecter : <a href="${url}">${url}</a></p>`,
  });
}
