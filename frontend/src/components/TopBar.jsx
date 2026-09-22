export default function TopBar({ email, connected, onRefresh, refreshing, thresholdDays, onThresholdChange }) {
  return (
    <div className="flex items-center justify-between h-[72px] px-8 bg-white border-b border-gray-200 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-[34px] h-[34px] rounded-[9px] bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6l9 6 9-6" />
            <rect x="3" y="5" width="18" height="14" rx="2" />
          </svg>
        </div>
        <div>
          <div className="font-semibold text-sm leading-tight">
            {connected ? `Connected: ${email}` : 'Not connected to Gmail'}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-[7px] h-[7px] rounded-full ${connected ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className="text-xs text-gray-500">{connected ? 'Synced just now' : 'Awaiting connection'}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-7">
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-gray-700 font-medium whitespace-nowrap">Follow up after</span>
          <input
            type="range"
            min="1"
            max="10"
            value={thresholdDays}
            onChange={(e) => onThresholdChange(Number(e.target.value))}
            className="w-40 accent-indigo-600"
          />
          <span className="text-[13px] font-semibold w-14">{thresholdDays} days</span>
        </div>

        <button
          onClick={onRefresh}
          disabled={!connected || refreshing}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-[13px] font-medium disabled:opacity-50 transition-colors hover:bg-gray-50 disabled:hover:bg-white"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={refreshing ? 'animate-spin' : ''}>
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <path d="M21 3v6h-6" />
          </svg>
          {refreshing ? 'Syncing...' : 'Sync now'}
        </button>
      </div>
    </div>
  );
}
