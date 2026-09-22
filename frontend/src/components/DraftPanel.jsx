const TONES = [
  { id: 'formal', label: 'Formal' },
  { id: 'casual', label: 'Casual' },
  { id: 'urgent', label: 'Urgent' },
];

export default function DraftPanel({
  thread,
  tone,
  onToneChange,
  subject,
  body,
  onBodyChange,
  onRegenerate,
  onSave,
  onSend,
  onClose,
  loading,
  saving,
  sending,
  savedDraftId,
  statusMessage,
}) {
  if (!thread) {
    return (
      <div className="w-[420px] flex-shrink-0 bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-sm h-fit">
        Pick a thread and click "Draft Follow-up" to get started.
      </div>
    );
  }

  const recipientName = thread.to?.split('<')[0].trim() || thread.recipientEmail;

  return (
    <div className="w-[420px] flex-shrink-0 bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4 h-fit">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-semibold text-base">Follow-up draft</h2>
          <div className="text-xs text-gray-400 mt-1">
            To: {recipientName} &lt;{thread.recipientEmail}&gt;
          </div>
          <div className="text-xs text-gray-400">Re: {thread.subject}</div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div>
        <div className="text-xs font-semibold text-gray-700 mb-2">Tone</div>
        <div className="flex gap-2">
          {TONES.map((t) => (
            <button
              key={t.id}
              onClick={() => onToneChange(t.id)}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                tone === t.id ? 'bg-indigo-600 text-white font-semibold' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-700">Draft</span>
          <span className="text-[11px] text-gray-400">Drafted with Gemini</span>
        </div>
        <textarea
          value={loading ? 'Generating draft...' : body}
          onChange={(e) => onBodyChange(e.target.value)}
          disabled={loading}
          rows={10}
          className="w-full border border-gray-200 rounded-[10px] p-3.5 text-[13.5px] leading-relaxed text-gray-800 bg-gray-50 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={onRegenerate}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[9px] border border-gray-200 bg-white text-gray-700 text-[13px] font-medium disabled:opacity-50 transition-colors hover:bg-gray-50"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <path d="M21 3v6h-6" />
          </svg>
          Regenerate
        </button>
        <button
          onClick={onSave}
          disabled={loading || saving}
          className="flex-1 py-2.5 rounded-[9px] border border-gray-200 bg-white text-gray-700 text-[13px] font-medium disabled:opacity-50 transition-colors hover:bg-gray-50"
        >
          {saving ? 'Saving...' : savedDraftId ? 'Update draft' : 'Save draft'}
        </button>
        <button
          onClick={onSend}
          disabled={loading || sending}
          className="flex-[1.2] flex items-center justify-center gap-1.5 py-2.5 rounded-[9px] bg-indigo-600 text-white text-[13px] font-semibold disabled:opacity-50 transition-colors hover:bg-indigo-700"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13" />
            <path d="M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>

      {statusMessage && <div className="text-[12px] text-center text-green-700">{statusMessage}</div>}

      <div className="text-[11.5px] text-gray-400 italic text-center">
        AI-generated draft — review before sending. Nothing sends without your approval.
      </div>
    </div>
  );
}
