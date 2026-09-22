function formatDue(dueAt, bucket) {
  if (!dueAt) return null;
  const date = new Date(dueAt);
  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (bucket === 'today') return `Today, ${time}`;
  if (bucket === 'tomorrow') return `Tomorrow, ${time}`;
  if (bucket === 'overdue') return `Overdue · ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function TaskRow({ task, bucket, onToggle, onDelete }) {
  const dueLabel = formatDue(task.dueAt, bucket);

  return (
    <div className="group flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-300 transition-colors">
      <button
        onClick={() => onToggle(task.id, !task.done)}
        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          task.done ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 hover:border-indigo-400'
        }`}
        aria-label={task.done ? 'Mark not done' : 'Mark done'}
      >
        {task.done && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className={`text-sm truncate ${task.done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{task.text}</div>
        {dueLabel && (
          <div className={`text-xs mt-0.5 ${bucket === 'overdue' ? 'text-red-600 font-medium' : 'text-gray-400'}`}>{dueLabel}</div>
        )}
      </div>

      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity flex-shrink-0"
        aria-label="Delete task"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
        </svg>
      </button>
    </div>
  );
}
