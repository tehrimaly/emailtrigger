import { listTasks, createTask, updateTask, deleteTask } from './taskStore.js';

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * Groups tasks into the buckets the Tasks board renders: overdue (past due,
 * not done), today, tomorrow, upcoming (later, has a date), someday (no
 * date), and done. A task can only land in one bucket.
 */
export function getGroupedTasks() {
  const tasks = listTasks();
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const groups = { overdue: [], today: [], tomorrow: [], upcoming: [], someday: [], done: [] };

  for (const task of tasks) {
    if (task.done) {
      groups.done.push(task);
      continue;
    }
    if (!task.dueAt) {
      groups.someday.push(task);
      continue;
    }
    const due = new Date(task.dueAt);
    if (due < now && !isSameDay(due, now)) {
      groups.overdue.push(task);
    } else if (isSameDay(due, now)) {
      groups.today.push(task);
    } else if (isSameDay(due, tomorrow)) {
      groups.tomorrow.push(task);
    } else {
      groups.upcoming.push(task);
    }
  }

  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => new Date(a.dueAt ?? a.createdAt) - new Date(b.dueAt ?? b.createdAt));
  }

  return groups;
}

export function addTask({ text, dueAt, threadId }) {
  if (!text || !text.trim()) throw new Error('Task text is required');
  return createTask({ text: text.trim(), dueAt: dueAt || null, threadId: threadId || null });
}

export function setTaskDone(id, done) {
  const task = updateTask(id, { done });
  if (!task) throw new Error('Task not found');
  return task;
}

export function editTask(id, patch) {
  const task = updateTask(id, patch);
  if (!task) throw new Error('Task not found');
  return task;
}

export function removeTask(id) {
  const removed = deleteTask(id);
  if (!removed) throw new Error('Task not found');
}

export function getTasksSummary() {
  return listTasks()
    .filter((t) => !t.done)
    .map((t) => ({ id: t.id, text: t.text, dueAt: t.dueAt }));
}
