import { google } from 'googleapis';
import { getAuthorizedClient } from './gmailService.js';

function findHeader(headers, name) {
  const header = headers?.find((h) => h.name.toLowerCase() === name.toLowerCase());
  return header?.value ?? '';
}

// "you@example.com" out of a "Name <you@example.com>" header value.
function extractEmailAddress(headerValue) {
  const match = headerValue.match(/<([^>]+)>/);
  return (match ? match[1] : headerValue).trim().toLowerCase();
}

function isFromSelf(fromHeader, selfEmail) {
  return extractEmailAddress(fromHeader) === selfEmail.toLowerCase();
}

/**
 * A thread is "awaiting reply" when the most recent message in it was sent
 * by us and nobody has replied since. Built from in:sent as the seed list
 * (not a dedicated Gmail concept), then confirmed at the thread level.
 */
export async function listAwaitingReplyThreads({ maxThreads = 30 } = {}) {
  const auth = getAuthorizedClient();
  if (!auth) throw new Error('Not connected to Gmail');

  const gmail = google.gmail({ version: 'v1', auth });

  const { data: profile } = await gmail.users.getProfile({ userId: 'me' });
  const selfEmail = profile.emailAddress;

  const { data: listData } = await gmail.users.messages.list({
    userId: 'me',
    q: 'in:sent',
    maxResults: 50,
  });

  const seedMessages = listData.messages ?? [];
  const seenThreadIds = new Set();
  const threadIds = [];
  for (const { threadId } of seedMessages) {
    if (!seenThreadIds.has(threadId)) {
      seenThreadIds.add(threadId);
      threadIds.push(threadId);
    }
    if (threadIds.length >= maxThreads) break;
  }

  const threads = await Promise.all(
    threadIds.map(async (threadId) => {
      const { data: thread } = await gmail.users.threads.get({
        userId: 'me',
        id: threadId,
        format: 'metadata',
        metadataHeaders: ['From', 'To', 'Subject', 'Date'],
      });

      const messages = thread.messages ?? [];
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage) return null;

      const headers = lastMessage.payload?.headers;
      const fromHeader = findHeader(headers, 'From');
      if (!isFromSelf(fromHeader, selfEmail)) return null; // someone already replied

      const dateHeader = findHeader(headers, 'Date');
      const sentDate = new Date(dateHeader);
      const daysWaiting = Math.floor((Date.now() - sentDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        threadId,
        lastMessageId: lastMessage.id,
        subject: findHeader(headers, 'Subject') || '(no subject)',
        to: findHeader(headers, 'To'),
        recipientEmail: extractEmailAddress(findHeader(headers, 'To')),
        sentDate: sentDate.toISOString(),
        daysWaiting: Math.max(daysWaiting, 0),
        snippet: lastMessage.snippet,
      };
    })
  );

  return threads.filter(Boolean).sort((a, b) => b.daysWaiting - a.daysWaiting);
}

export async function getThread(threadId) {
  const auth = getAuthorizedClient();
  if (!auth) throw new Error('Not connected to Gmail');

  const gmail = google.gmail({ version: 'v1', auth });
  const { data: thread } = await gmail.users.threads.get({
    userId: 'me',
    id: threadId,
    format: 'full',
  });

  const messages = thread.messages ?? [];
  const lastMessage = messages[messages.length - 1];
  const headers = lastMessage?.payload?.headers;

  return {
    threadId,
    subject: findHeader(headers, 'Subject') || '(no subject)',
    to: findHeader(headers, 'To'),
    recipientEmail: extractEmailAddress(findHeader(headers, 'To')),
    snippet: lastMessage?.snippet ?? '',
    lastMessageId: lastMessage?.id,
  };
}
