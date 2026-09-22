import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { getGroupedTasks, addTask, setTaskDone, editTask, removeTask } from '../services/taskService.js';

const router = Router();

router.get('/', requireAuth, (req, res) => {
  res.json({ groups: getGroupedTasks() });
});

router.post('/', requireAuth, (req, res) => {
  const { text, dueAt, threadId } = req.body ?? {};
  try {
    const task = addTask({ text, dueAt, threadId });
    res.status(201).json({ task });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const { done, text, dueAt } = req.body ?? {};
  try {
    const patch = {};
    if (typeof done === 'boolean') patch.done = done;
    if (typeof text === 'string') patch.text = text;
    if (dueAt !== undefined) patch.dueAt = dueAt;

    const task = typeof done === 'boolean' && Object.keys(patch).length === 1 ? setTaskDone(id, done) : editTask(id, patch);
    res.json({ task });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

router.delete('/:id', requireAuth, (req, res) => {
  try {
    removeTask(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

export default router;
