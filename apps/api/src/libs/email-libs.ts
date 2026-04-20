import type { ReactElement } from 'react';
import nodemailer from 'nodemailer';
import { render } from '@react-email/render';

export type SendEmailParams = {
  to: string | string[];
  subject: string;
  component: ReactElement;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  headers?: Record<string, string>;
};

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (cachedTransporter) return cachedTransporter;

  const port = Number(process.env.EMAIL_SMTP_PORT);
  if (Number.isNaN(port)) {
    throw new Error('EMAIL_SMTP_PORT must be a valid number');
  }

  cachedTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.EMAIL_SMTP_USER,
      pass: process.env.EMAIL_SMTP_PASSWORD,
    },
  });

  return cachedTransporter;
}

export async function sendEmail(p: SendEmailParams) {
  const transporter = getTransporter();

  const html = await Promise.resolve(render(p.component, { pretty: true }));
  const text = await Promise.resolve(render(p.component, { plainText: true }));

  const from = p.from ?? `${process.env.APP_NAME} <${process.env.EMAIL_SMTP_USER}>`;

  const result = await transporter.sendMail({
    from,
    to: p.to,
    subject: p.subject,
    html,
    text,
    replyTo: p.replyTo,
    cc: p.cc,
    bcc: p.bcc,
    headers: p.headers,
  });

  return result;
}
