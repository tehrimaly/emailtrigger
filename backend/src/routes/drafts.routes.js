import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { sendDraft } from '../services/draftService.js';

const router = Router();

// The only place a follow-up actually goes out — always a separate,
// explicit call the user triggers after reviewing the saved draft.
router.post('/:draftId/send', requireAuth, async (req, res) => {
  const { draftId } = req.params;
  try {
    const sent = await sendDraft(draftId);
    res.json({ sent });
  } catch (err) {
    console.error('Failed to send draft:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
