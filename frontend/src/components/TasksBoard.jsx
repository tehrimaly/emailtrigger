import { useState } from 'react';
import TaskRow from './TaskRow.jsx';

const SECTIONS = [
  { key: 'overdue', label: 'Overdue', accent: 'text-red-600' },
  { key: 'today', label: 'Today', accent: 'text-gray-900' },
  { key: 'tomorrow', label: 'Tomorrow', accent: 'text-gray-900' },
  { key: 'upcoming', label: 'Upcoming', accent: 'text-gray-900' },
  { key: 'someday', label: 'Someday', accent: 'text-gray-500' },
];

export default function TasksBoard({ groups, onAdd, onToggle, onDelete }) {
  const [text, setText] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [adding, setAdding] = useState(false);

  const openCount = SECTIONS.reduce((sum, s) => sum + (groups[s.key]?.length ?? 0), 0);
  const doneCount = groups.done?.length ?? 0;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!text.trim() || adding) return;
    setAdding(true);
    try {
      await onAdd({ text: text.trim(), dueAt: dueAt ? new Date(dueAt).toISOString() : null });
      setText('');
      setDueAt('');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-3.5">
      <div className="flex items-baseline justify-between">
        <h1 className="font-semibold text-lg">Tasks</h1>
        <span className="text-[13px] text-gray-500">{openCount} open</span>
      </div>

      <form onSubmit={handleAdd} className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a task..."
          className="flex-1 text-sm outline-none placeholder:text-gray-400"
        />
        <input
          type="datetime-local"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          className="text-xs text-gray-500 outline-none border border-gray-200 rounded-lg px-2 py-1.5"
        />
        <button
          type="submit"
          disabled={!text.trim() || adding}
          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-[13px] font-semibold disabled:opacity-40 flex-shrink-0"
        >
          Add
        </button>
      </form>

      {openCount === 0 && doneCount === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500 text-sm">
          Nothing on your plate. Add a task above, or ask the chat bar to remind you about something.
        </div>
      )}

      {SECTIONS.map(
        (section) =>
          groups[section.key]?.length > 0 && (
            <div key={section.key} className="flex flex-col gap-2">
              <div className={`text-xs font-semibold uppercase tracking-wide ${section.accent}`}>
                {section.label} <span className="text-gray-400 font-normal">({groups[section.key].length})</span>
              </div>
              {groups[section.key].map((task) => (
                <TaskRow key={task.id} task={task} bucket={section.key} onToggle={onToggle} onDelete={onDelete} />
              ))}
            </div>
          )
      )}

      {doneCount > 0 && (
        <details className="mt-1">
          <summary className="text-xs font-semibold uppercase tracking-wide text-gray-400 cursor-pointer select-none">
            Done ({doneCount})
          </summary>
          <div className="flex flex-col gap-2 mt-2">
            {groups.done.map((task) => (
              <TaskRow key={task.id} task={task} bucket="done" onToggle={onToggle} onDelete={onDelete} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
