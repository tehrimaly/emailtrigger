import { google } from 'googleapis';
import { getAuthorizedClient } from './gmailService.js';

function base64UrlEncode(str) {
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function buildRawMessage({ to, subject, body }) {
  const lines = [`To: ${to}`, `Subject: ${subject}`, 'Content-Type: text/plain; charset="UTF-8"', '', body];
  return base64UrlEncode(lines.join('\r\n'));
}

/**
 * Saves a follow-up as a real Gmail draft, associated with the original
 * thread so it shows up alongside it in the user's inbox. Never sent here.
 */
export async function createGmailDraft({ threadId, to, subject, body }) {
  const auth = getAuthorizedClient();
  if (!auth) throw new Error('Not connected to Gmail');

  const gmail = google.gmail({ version: 'v1', auth });

  const { data } = await gmail.users.drafts.create({
    userId: 'me',
    requestBody: {
      message: {
        threadId,
        raw: buildRawMessage({ to, subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`, body }),
      },
    },
  });

  return { id: data.id, messageId: data.message?.id, threadId: data.message?.threadId };
}

export async function sendDraft(draftId) {
  const auth = getAuthorizedClient();
  if (!auth) throw new Error('Not connected to Gmail');

  const gmail = google.gmail({ version: 'v1', auth });
  const { data } = await gmail.users.drafts.send({ userId: 'me', requestBody: { id: draftId } });
  return { id: data.id, threadId: data.threadId };
}
