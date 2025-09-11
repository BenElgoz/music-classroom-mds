const nodemailer = require('nodemailer');

exports.sendLoginLink = async (email, token) => {
  const transporter = nodemailer.createTransport({
    // ...config SMTP...
  });

  const url = `${process.env.FRONTEND_URL}/login?token=${token}`;
  await transporter.sendMail({
    to: email,
    subject: "Votre lien de connexion",
    html: `<p>Cliquez ici pour vous connecter : <a href="${url}">${url}</a></p>`
  });
};