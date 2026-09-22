import { Router } from 'express';
import { createOAuthClient, GMAIL_SCOPES } from '../config/googleClient.js';
import { saveTokens, clearTokens } from '../services/tokenStore.js';
import { isConnected, getProfile } from '../services/gmailService.js';

const router = Router();

// Step 1: redirect the browser to Google's consent screen.
router.get('/google', (req, res) => {
  const oauth2Client = createOAuthClient();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // request a refresh_token
    prompt: 'consent', // force refresh_token on every re-auth during dev
    scope: GMAIL_SCOPES,
  });
  res.redirect(url);
});

// Step 2: Google redirects back here with a one-time `code`.
router.get('/google/callback', async (req, res) => {
  const { code, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (error) {
    return res.redirect(`${frontendUrl}/?auth=error&reason=${encodeURIComponent(error)}`);
  }
  if (!code) {
    return res.status(400).send('Missing authorization code');
  }

  try {
    const oauth2Client = createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    saveTokens(tokens);
    res.redirect(`${frontendUrl}/?auth=success`);
  } catch (err) {
    console.error('OAuth callback failed:', err.message);
    res.redirect(`${frontendUrl}/?auth=error&reason=${encodeURIComponent(err.message)}`);
  }
});

// Connection status for the dashboard top bar.
router.get('/status', async (req, res) => {
  if (!isConnected()) {
    return res.json({ connected: false });
  }
  try {
    const profile = await getProfile();
    res.json({ connected: true, email: profile.emailAddress });
  } catch (err) {
    res.json({ connected: false, error: err.message });
  }
});

router.post('/logout', (req, res) => {
  clearTokens();
  res.json({ ok: true });
});

export default router;
