import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Same pattern as tokenStore.js: single-user local JSON file standing in
// for a database. Never commit backend/data/tasks.json (see .gitignore).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TASKS_PATH = path.join(__dirname, '..', '..', 'data', 'tasks.json');

function readAll() {
  if (!fs.existsSync(TASKS_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(TASKS_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

function writeAll(tasks) {
  fs.mkdirSync(path.dirname(TASKS_PATH), { recursive: true });
  fs.writeFileSync(TASKS_PATH, JSON.stringify(tasks, null, 2));
}

export function listTasks() {
  return readAll();
}

export function createTask({ text, dueAt = null, threadId = null }) {
  const tasks = readAll();
  const task = {
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    text,
    dueAt,
    threadId,
    done: false,
    reminderSent: false,
    createdAt: new Date().toISOString(),
  };
  tasks.push(task);
  writeAll(tasks);
  return task;
}

export function updateTask(id, patch) {
  const tasks = readAll();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return null;
  tasks[index] = { ...tasks[index], ...patch };
  writeAll(tasks);
  return tasks[index];
}

export function deleteTask(id) {
  const tasks = readAll();
  const next = tasks.filter((t) => t.id !== id);
  writeAll(next);
  return next.length !== tasks.length;
}
