import { useState } from 'react';

export default function ChatBar({ onSubmit, disabled }) {
  const [value, setValue] = useState('');
  const [reply, setReply] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!value.trim() || loading) return;
    setLoading(true);
    setReply(null);
    try {
      const result = await onSubmit(value.trim());
      setReply(result);
    } catch (err) {
      setReply({ error: err.message });
    } finally {
      setLoading(false);
      setValue('');
    }
  };

  return (
    <div className="px-8 py-3 bg-white border-b border-gray-200">
      <form onSubmit={handleSubmit} className="flex items-center gap-3 max-w-2xl">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled || loading}
          placeholder='Try "follow up with HR", "remind me to call the client tomorrow at 3pm", or "what do I have today?"'
          className="flex-1 text-[13.5px] outline-none placeholder:text-gray-400 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || loading || !value.trim()}
          className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-[13px] font-semibold disabled:opacity-40"
        >
          {loading ? '...' : 'Ask'}
        </button>
      </form>
      {reply && (
        <div className={`max-w-2xl mt-2 text-[12.5px] ${reply.error ? 'text-red-600' : 'text-gray-600'}`}>
          {reply.error || reply.message}
        </div>
      )}
    </div>
  );
}
