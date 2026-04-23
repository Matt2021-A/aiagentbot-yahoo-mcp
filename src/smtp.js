import nodemailer from 'nodemailer';
import { config } from './config.js';

function createTransport() {
  return nodemailer.createTransport({
    host: 'smtp.mail.yahoo.com',
    port: 465,
    secure: true,
    auth: {
      user: config.yahooEmail,
      pass: config.yahooAppPassword
    }
  });
}

export async function sendEmail(to, subject, body) {
  if (!to || !subject || !body) {
    throw new Error('to, subject, and body are all required.');
  }

  const transporter = createTransport();
  const info = await transporter.sendMail({
    from: `Claude AI Agent Bot - MattR <${config.yahooEmail}>`,
    to,
    subject,
    text: body
  });

  return {
    accepted: info.accepted,
    rejected: info.rejected,
    messageId: info.messageId,
    response: info.response
  };
}
