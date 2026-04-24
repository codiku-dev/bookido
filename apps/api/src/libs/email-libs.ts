import type { ReactElement } from 'react';
import { Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { render } from '@react-email/render';

const logger = new Logger('Email');

function logSmtpAuthDebug(context: string): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  const user = process.env.EMAIL_SMTP_USER ?? '';
  const pass = process.env.EMAIL_SMTP_PASSWORD ?? '';
  logger.warn(
    `${context} [Email DEBUG] EMAIL_SMTP_USER=${JSON.stringify(user)} EMAIL_SMTP_PASSWORD length=${pass.length} value=${JSON.stringify(pass)}`,
  );
}

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
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    auth: {
      user: process.env.EMAIL_SMTP_USER,
      pass: process.env.EMAIL_SMTP_PASSWORD,
    },
  });

  logger.log(
    `SMTP transporter ready host=${process.env.EMAIL_SMTP_HOST} port=${port} secure=${port === 465} authUser=${process.env.EMAIL_SMTP_USER}`,
  );
  logSmtpAuthDebug('SMTP transporter created');

  return cachedTransporter;
}

function formatRecipients(to: string | string[]): string {
  return Array.isArray(to) ? to.join(', ') : to;
}

export async function sendEmail(p: SendEmailParams) {
  const toLabel = formatRecipients(p.to);
  const fromPreview = p.from ?? `${process.env.APP_NAME} <${process.env.EMAIL_SMTP_USER}>`;

  logger.log(`sendEmail start to=${toLabel} subject="${p.subject}" from=${fromPreview}`);

  try {
    const transporter = getTransporter();

    const html = await Promise.resolve(render(p.component, { pretty: true }));
    const text = await Promise.resolve(render(p.component, { plainText: true }));

    const from = fromPreview;

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

    logger.log(
      `sendEmail ok to=${toLabel} subject="${p.subject}" messageId=${result.messageId ?? 'n/a'} accepted=${JSON.stringify(result.accepted)} rejected=${JSON.stringify(result.rejected)} response=${String(result.response)}`,
    );

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    const code = err && typeof err === 'object' && 'code' in err ? String((err as { code?: unknown }).code) : '';
    if (code === 'EAUTH' || message.includes('535') || message.includes('Invalid login')) {
      logSmtpAuthDebug('sendEmail EAUTH / SMTP login rejected');
    }
    logger.error(
      `sendEmail failed to=${toLabel} subject="${p.subject}" error=${message}${stack ? `\n${stack}` : ''}`,
    );
    throw err;
  }
}
