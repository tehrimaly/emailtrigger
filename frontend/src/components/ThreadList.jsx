import ThreadCard from './ThreadCard.jsx';

export default function ThreadList({ threads, thresholdDays, selectedThreadId, savedDraftIdByThread, onPreview, onDraftFollowup, onSend }) {
  return (
    <div className="flex-1 min-w-0 flex flex-col gap-3.5">
      <div className="flex items-baseline justify-between">
        <h1 className="font-semibold text-lg">Awaiting reply</h1>
        <span className="text-[13px] text-gray-500">{threads.length} threads with no reply</span>
      </div>

      {threads.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500 text-sm">
          No sent threads are waiting on a reply right now.
        </div>
      )}

      {threads.map((thread) => (
        <ThreadCard
          key={thread.threadId}
          thread={thread}
          thresholdDays={thresholdDays}
          isSelected={thread.threadId === selectedThreadId}
          hasDraft={Boolean(savedDraftIdByThread[thread.threadId])}
          onPreview={onPreview}
          onDraftFollowup={onDraftFollowup}
          onSend={onSend}
        />
      ))}
    </div>
  );
}
