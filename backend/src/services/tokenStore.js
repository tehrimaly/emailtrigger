import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// This app is a single-user personal tool: one local token file stands in
// for a session/DB. Never commit backend/data/tokens.json (see .gitignore).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKENS_PATH = path.join(__dirname, '..', '..', 'data', 'tokens.json');

export function saveTokens(tokens) {
  fs.mkdirSync(path.dirname(TOKENS_PATH), { recursive: true });
  fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
}

export function loadTokens() {
  if (!fs.existsSync(TOKENS_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf-8'));
  } catch {
    return null;
  }
}

export function clearTokens() {
  if (fs.existsSync(TOKENS_PATH)) fs.unlinkSync(TOKENS_PATH);
}
