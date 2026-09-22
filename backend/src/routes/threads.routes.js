import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { listAwaitingReplyThreads, getThread } from '../services/threadService.js';
import { generateFollowupDraft } from '../services/geminiService.js';
import { createGmailDraft } from '../services/draftService.js';

const router = Router();

// Zone 2 data: sent threads with no reply yet.
router.get('/', requireAuth, async (req, res) => {
  try {
    const threads = await listAwaitingReplyThreads();
    res.json({ threads });
  } catch (err) {
    console.error('Failed to list awaiting-reply threads:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Generate an AI follow-up draft for one thread (not saved to Gmail yet).
router.post('/:threadId/draft', requireAuth, async (req, res) => {
  const { threadId } = req.params;
  const { tone = 'formal' } = req.body ?? {};

  try {
    const thread = await getThread(threadId);
    const draft = await generateFollowupDraft({ thread, tone });
    res.json({ thread, draft });
  } catch (err) {
    console.error('Failed to generate draft:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Save an (edited) draft to Gmail as a real draft. Never sends automatically.
router.post('/:threadId/save-draft', requireAuth, async (req, res) => {
  const { threadId } = req.params;
  const { subject, body, to } = req.body ?? {};

  if (!subject || !body || !to) {
    return res.status(400).json({ error: 'subject, body, and to are required' });
  }

  try {
    const savedDraft = await createGmailDraft({ threadId, to, subject, body });
    res.json({ draft: savedDraft });
  } catch (err) {
    console.error('Failed to save draft:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
