import { useState } from 'react';

const AVATAR_COLORS = ['#f97316', '#0ea5e9', '#8b5cf6', '#10b981', '#ec4899', '#eab308'];

function colorFor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function initialsFor(nameOrEmail) {
  const parts = nameOrEmail.replace(/[<>]/g, '').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return nameOrEmail.slice(0, 2).toUpperCase();
}

export default function ThreadCard({ thread, thresholdDays, isSelected, hasDraft, onPreview, onDraftFollowup, onSend }) {
  const [expanded, setExpanded] = useState(false);
  const overdue = thread.daysWaiting > thresholdDays;
  const displayName = thread.to?.split('<')[0].trim() || thread.recipientEmail;

  return (
    <div
      className={`flex items-center gap-4 bg-white border rounded-xl px-[18px] py-4 shadow-sm transition-shadow hover:shadow-md ${
        isSelected ? 'border-indigo-300 ring-1 ring-indigo-100' : overdue ? 'border-red-200' : 'border-gray-200'
      }`}
    >
      <div
        className="w-10 h-10 rounded-full text-white font-semibold text-[13px] flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: colorFor(thread.threadId) }}
      >
        {initialsFor(displayName)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-gray-900 truncate">{thread.subject}</span>
          {overdue && (
            <span className="text-[11px] font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full tracking-wide flex-shrink-0">
              OVERDUE
            </span>
          )}
        </div>
        <div className="text-[13px] text-gray-500 mt-0.5 truncate">
          {displayName} &lt;{thread.recipientEmail}&gt;
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Sent {thread.daysWaiting} day{thread.daysWaiting === 1 ? '' : 's'} ago · no reply yet
        </div>
        {expanded && <div className="text-xs text-gray-600 mt-2 italic border-t border-gray-100 pt-2">"{thread.snippet}"</div>}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => {
            setExpanded((v) => !v);
            onPreview?.(thread);
          }}
          className="px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-[13px] font-medium transition-colors hover:bg-gray-50"
        >
          Preview
        </button>
        <button
          onClick={() => onDraftFollowup(thread)}
          className="px-3.5 py-2 rounded-lg border border-indigo-600 bg-white text-indigo-600 text-[13px] font-semibold transition-colors hover:bg-indigo-50"
        >
          {hasDraft ? 'Regenerate' : 'Draft Follow-up'}
        </button>
        <button
          onClick={() => onSend(thread)}
          disabled={!hasDraft}
          className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
            hasDraft ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          Send
        </button>
      </div>
    </div>
  );
}
