const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

async function request(path, options) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request to ${path} failed`);
  return data;
}

export const getAuthStatus = () => request('/auth/status');

export const getGoogleAuthUrl = () => `${API_BASE}/auth/google`;

export const listThreads = () => request('/api/threads');

export const generateDraft = (threadId, tone) =>
  request(`/api/threads/${threadId}/draft`, { method: 'POST', body: JSON.stringify({ tone }) });

export const saveDraft = (threadId, { to, subject, body }) =>
  request(`/api/threads/${threadId}/save-draft`, {
    method: 'POST',
    body: JSON.stringify({ to, subject, body }),
  });

export const sendDraft = (draftId) => request(`/api/drafts/${draftId}/send`, { method: 'POST' });

export const sendChatCommand = (message, thresholdDays) =>
  request('/api/chat/command', { method: 'POST', body: JSON.stringify({ message, thresholdDays }) });

export const listTasks = () => request('/api/tasks');

export const createTask = ({ text, dueAt }) =>
  request('/api/tasks', { method: 'POST', body: JSON.stringify({ text, dueAt }) });

export const setTaskDone = (id, done) =>
  request(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ done }) });

export const deleteTask = (id) => request(`/api/tasks/${id}`, { method: 'DELETE' });
