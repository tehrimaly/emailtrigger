import { google } from 'googleapis';
import { createOAuthClient } from '../config/googleClient.js';
import { loadTokens, saveTokens } from './tokenStore.js';

/**
 * Builds an OAuth2 client hydrated with the stored tokens and wired to
 * persist refreshed access tokens back to disk automatically.
 * Returns null if the user hasn't connected their Gmail account yet.
 */
export function getAuthorizedClient() {
  const tokens = loadTokens();
  if (!tokens) return null;

  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials(tokens);

  // googleapis refreshes the access token transparently when expired;
  // this keeps the refreshed token on disk for next time.
  oauth2Client.on('tokens', (newTokens) => {
    saveTokens({ ...loadTokens(), ...newTokens });
  });

  return oauth2Client;
}

export function isConnected() {
  return getAuthorizedClient() !== null;
}

export async function getProfile() {
  const auth = getAuthorizedClient();
  if (!auth) throw new Error('Not connected to Gmail');

  const gmail = google.gmail({ version: 'v1', auth });
  const { data } = await gmail.users.getProfile({ userId: 'me' });
  return data; // { emailAddress, messagesTotal, threadsTotal, historyId }
}

function findHeader(headers, name) {
  const header = headers?.find((h) => h.name.toLowerCase() === name.toLowerCase());
  return header?.value ?? '';
}

/**
 * Lists the user's most recent sent messages with a few parsed headers.
 * Used to confirm the OAuth flow works end-to-end before anything else
 * (thread-level "awaiting reply" detection and AI drafting come later).
 */
export async function listSentMessages({ maxResults = 10 } = {}) {
  const auth = getAuthorizedClient();
  if (!auth) throw new Error('Not connected to Gmail');

  const gmail = google.gmail({ version: 'v1', auth });

  const { data: listData } = await gmail.users.messages.list({
    userId: 'me',
    q: 'in:sent',
    maxResults,
  });

  const messages = listData.messages ?? [];

  const detailed = await Promise.all(
    messages.map(async ({ id, threadId }) => {
      const { data } = await gmail.users.messages.get({
        userId: 'me',
        id,
        format: 'metadata',
        metadataHeaders: ['To', 'Subject', 'Date'],
      });

      return {
        id,
        threadId,
        to: findHeader(data.payload?.headers, 'To'),
        subject: findHeader(data.payload?.headers, 'Subject'),
        date: findHeader(data.payload?.headers, 'Date'),
        snippet: data.snippet,
      };
    })
  );

  return detailed;
}
