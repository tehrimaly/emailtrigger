import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { listSentMessages } from '../services/gmailService.js';

const router = Router();

// Sanity-check endpoint: confirms OAuth + scopes work by listing the
// user's own recent sent messages. Thread-level "awaiting reply" logic
// and AI drafting build on top of this once it's verified.
router.get('/sent', requireAuth, async (req, res) => {
  try {
    const maxResults = Math.min(Number(req.query.maxResults) || 10, 50);
    const messages = await listSentMessages({ maxResults });
    res.json({ count: messages.length, messages });
  } catch (err) {
    console.error('Failed to list sent messages:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
