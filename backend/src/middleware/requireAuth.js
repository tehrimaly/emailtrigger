import { isConnected } from '../services/gmailService.js';

export function requireAuth(req, res, next) {
  if (!isConnected()) {
    return res.status(401).json({ error: 'Not connected to Gmail. Visit /auth/google first.' });
  }
  next();
}
