import { notificationCopy } from '../notifications/notification-content';

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        character
      ],
  );

export function mailTemplate(
  title: string,
  body: string,
  url: string,
  siteUrl: string,
  language: keyof typeof notificationCopy = 'ru',
  code?: string,
) {
  const copy = notificationCopy[language];
  return `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:32px 16px;background:#f5f2eb;font-family:Arial,sans-serif;color:#242424"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border-radius:20px;overflow:hidden"><tr><td style="padding:32px 36px;background:#26251f;color:#e6d6ab;font-size:18px;letter-spacing:3px">ART GALLERY</td></tr><tr><td style="padding:36px"><p style="margin:0 0 16px;color:#8c7745;font-size:12px;letter-spacing:2px">TILININ'S GALLERY</p><h1 style="margin:0 0 20px;font-size:26px;line-height:1.3">${escapeHtml(title)}</h1><p style="margin:0 0 28px;line-height:1.7;color:#60605a;font-size:16px;white-space:pre-line">${escapeHtml(body)}</p>${code ? `<div style="padding:20px;border:1px solid #e6d6ab;border-radius:12px;background:#faf7ef;text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px">${escapeHtml(code)}</div><p style="font-size:13px;color:#76766e;line-height:1.6">${escapeHtml(copy.codeHint)}</p>` : `<a href="${escapeHtml(url)}" style="display:inline-block;padding:15px 24px;background:#a88b4d;border-radius:10px;color:#fff;text-decoration:none;font-size:15px;font-weight:bold">${copy.open}</a>`}</td></tr><tr><td style="padding:24px 36px;background:#faf9f6;border-top:1px solid #eeece5;font-size:12px;line-height:1.7;color:#85857c">${code ? copy.codeHint : copy.footer}<br><a href="${escapeHtml(siteUrl + '/settings')}" style="color:#8c7745">${copy.settings}</a></td></tr></table></td></tr></table></body></html>`;
}
