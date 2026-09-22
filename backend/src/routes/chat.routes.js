import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { listAwaitingReplyThreads } from '../services/threadService.js';
import { parseChatCommand, generateFollowupDraft } from '../services/geminiService.js';
import { addTask, getTasksSummary } from '../services/taskService.js';

const router = Router();

// The chat command bar: one endpoint, several possible outcomes depending
// on what Gemini decides the user meant (draft a follow-up, answer a
// question, change a setting, or manage tasks/reminders).
router.post('/command', requireAuth, async (req, res) => {
  const { message, thresholdDays = 3 } = req.body ?? {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  try {
    const threads = await listAwaitingReplyThreads();
    const tasks = getTasksSummary();
    const intent = await parseChatCommand({ message, threads, thresholdDays, tasks });

    switch (intent.intent) {
      case 'DRAFT_FOLLOWUP': {
        const thread = threads.find((t) => t.threadId === intent.threadId);
        if (!thread) {
          return res.json({
            intent: 'UNKNOWN',
            answer: "I couldn't find a matching thread awaiting a reply.",
          });
        }
        const draft = await generateFollowupDraft({ thread, tone: intent.tone || 'formal' });
        return res.json({ intent: 'DRAFT_FOLLOWUP', thread, draft });
      }

      case 'UPDATE_SETTING': {
        if (typeof intent.thresholdDays !== 'number') {
          return res.json({ intent: 'UNKNOWN', answer: "I couldn't tell what threshold you wanted." });
        }
        return res.json({ intent: 'UPDATE_SETTING', thresholdDays: intent.thresholdDays });
      }

      case 'QUERY_THREADS':
        return res.json({ intent: 'QUERY_THREADS', answer: intent.answer });

      case 'CREATE_TASK': {
        if (!intent.taskText) {
          return res.json({ intent: 'UNKNOWN', answer: "I couldn't tell what to remind you about." });
        }
        const task = addTask({ text: intent.taskText, dueAt: intent.taskDueAt });
        return res.json({ intent: 'CREATE_TASK', task });
      }

      case 'QUERY_TASKS':
        return res.json({ intent: 'QUERY_TASKS', answer: intent.answer });

      default:
        return res.json({ intent: 'UNKNOWN', answer: intent.answer || "Sorry, I didn't understand that." });
    }
  } catch (err) {
    console.error('Failed to handle chat command:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
