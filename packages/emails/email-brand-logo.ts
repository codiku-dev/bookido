/** Content-ID for the inline logo attachment (nodemailer `attachments[].cid`). */
export const EMAIL_BOOKIDO_LOGO_CID = "bookido-mark@bookido";

export function emailBookidoLogoCidSrc(): string {
  return `cid:${EMAIL_BOOKIDO_LOGO_CID}`;
}
