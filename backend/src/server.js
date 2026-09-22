import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import gmailRoutes from './routes/gmail.routes.js';
import threadsRoutes from './routes/threads.routes.js';
import draftsRoutes from './routes/drafts.routes.js';
import chatRoutes from './routes/chat.routes.js';
import tasksRoutes from './routes/tasks.routes.js';
import { startReminderScheduler } from './services/reminderService.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/auth', authRoutes);
app.use('/api/gmail', gmailRoutes);
app.use('/api/threads', threadsRoutes);
app.use('/api/drafts', draftsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/tasks', tasksRoutes);

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
  console.log(`Start the OAuth flow at http://localhost:${PORT}/auth/google`);
});

startReminderScheduler();
