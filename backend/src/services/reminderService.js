import { google } from 'googleapis';
import { getAuthorizedClient } from './gmailService.js';
import { listTasks, updateTask } from './taskStore.js';

const CHECK_INTERVAL_MS = 60 * 1000;

function base64UrlEncode(str) {
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sendReminderEmail(gmail, selfEmail, task) {
  const dueLine = task.dueAt ? `Was due: ${new Date(task.dueAt).toLocaleString()}\n\n` : '';
  const lines = [
    `To: ${selfEmail}`,
    `Subject: Reminder: ${task.text}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    `This is a reminder for a task you set in the Email Follow-up Agent:\n\n${task.text}\n\n${dueLine}Mark it done from the Tasks board once you've taken care of it.`,
  ];

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: base64UrlEncode(lines.join('\r\n')) },
  });
}

let running = false;

/**
 * Every minute, sends a reminder email (to the connected account itself)
 * for any task whose due time has passed and hasn't been reminded about
 * yet. Uses the same gmail.send scope already granted for drafts — no
 * separate notification service needed to stay free-tier.
 */
async function checkAndSendDueReminders() {
  if (running) return;
  running = true;
  try {
    const auth = getAuthorizedClient();
    if (!auth) return; // not connected yet

    const now = new Date();
    const due = listTasks().filter((t) => !t.done && !t.reminderSent && t.dueAt && new Date(t.dueAt) <= now);
    if (due.length === 0) return;

    const gmail = google.gmail({ version: 'v1', auth });
    const { data: profile } = await gmail.users.getProfile({ userId: 'me' });

    for (const task of due) {
      try {
        await sendReminderEmail(gmail, profile.emailAddress, task);
        updateTask(task.id, { reminderSent: true });
      } catch (err) {
        console.error(`Failed to send reminder for task ${task.id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('Reminder check failed:', err.message);
  } finally {
    running = false;
  }
}

export function startReminderScheduler() {
  setInterval(checkAndSendDueReminders, CHECK_INTERVAL_MS);
}
