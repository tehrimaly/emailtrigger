import { useEffect, useState, useCallback } from 'react';
import TopBar from './components/TopBar.jsx';
import ChatBar from './components/ChatBar.jsx';
import ThreadList from './components/ThreadList.jsx';
import DraftPanel from './components/DraftPanel.jsx';
import TasksBoard from './components/TasksBoard.jsx';
import {
  getAuthStatus,
  getGoogleAuthUrl,
  listThreads,
  generateDraft,
  saveDraft,
  sendDraft,
  sendChatCommand,
  listTasks,
  createTask,
  setTaskDone,
  deleteTask,
} from './api.js';

const EMPTY_TASK_GROUPS = { overdue: [], today: [], tomorrow: [], upcoming: [], someday: [], done: [] };

export default function App() {
  const [status, setStatus] = useState({ connected: false, loading: true });
  const [threads, setThreads] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [thresholdDays, setThresholdDays] = useState(3);
  const [error, setError] = useState(null);

  const [selectedThread, setSelectedThread] = useState(null);
  const [tone, setTone] = useState('formal');
  const [draftBody, setDraftBody] = useState('');
  const [draftSubject, setDraftSubject] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [panelStatus, setPanelStatus] = useState(null);
  const [savedDraftIdByThread, setSavedDraftIdByThread] = useState({});

  const [tab, setTab] = useState('followups');
  const [taskGroups, setTaskGroups] = useState(EMPTY_TASK_GROUPS);

  const refreshTasks = useCallback(async () => {
    try {
      const { groups } = await listTasks();
      setTaskGroups(groups);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const refreshThreads = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const { threads } = await listThreads();
      setThreads(threads);
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    getAuthStatus()
      .then((data) => {
        setStatus({ ...data, loading: false });
        if (data.connected) {
          refreshThreads();
          refreshTasks();
        }
      })
      .catch((err) => setStatus({ connected: false, loading: false, error: err.message }));
  }, [refreshThreads, refreshTasks]);

  const handleAddTask = async ({ text, dueAt }) => {
    await createTask({ text, dueAt });
    await refreshTasks();
  };

  const handleToggleTask = async (id, done) => {
    await setTaskDone(id, done);
    await refreshTasks();
  };

  const handleDeleteTask = async (id) => {
    await deleteTask(id);
    await refreshTasks();
  };

  const openDraftFor = async (thread, requestedTone) => {
    setSelectedThread(thread);
    setPanelStatus(null);
    setDraftLoading(true);
    const useTone = requestedTone || tone;
    setTone(useTone);
    try {
      const { draft } = await generateDraft(thread.threadId, useTone);
      setDraftSubject(draft.subject);
      setDraftBody(draft.body);
    } catch (err) {
      setError(err.message);
    } finally {
      setDraftLoading(false);
    }
  };

  const handleRegenerate = () => selectedThread && openDraftFor(selectedThread, tone);

  const handleSave = async () => {
    if (!selectedThread) return;
    setSaving(true);
    setPanelStatus(null);
    try {
      const { draft } = await saveDraft(selectedThread.threadId, {
        to: selectedThread.recipientEmail,
        subject: draftSubject,
        body: draftBody,
      });
      setSavedDraftIdByThread((prev) => ({ ...prev, [selectedThread.threadId]: draft.id }));
      setPanelStatus('Draft saved to Gmail.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async (threadArg) => {
    const thread = threadArg || selectedThread;
    if (!thread) return;
    let draftId = savedDraftIdByThread[thread.threadId];

    setSending(true);
    setPanelStatus(null);
    try {
      if (!draftId) {
        const { draft } = await saveDraft(thread.threadId, {
          to: thread.recipientEmail,
          subject: draftSubject,
          body: draftBody,
        });
        draftId = draft.id;
        setSavedDraftIdByThread((prev) => ({ ...prev, [thread.threadId]: draftId }));
      }
      await sendDraft(draftId);
      setPanelStatus('Sent!');
      refreshThreads();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleChatCommand = async (message) => {
    const response = await sendChatCommand(message, thresholdDays);

    switch (response.intent) {
      case 'DRAFT_FOLLOWUP': {
        setSelectedThread(response.thread);
        setTone(response.draft.tone);
        setDraftSubject(response.draft.subject);
        setDraftBody(response.draft.body);
        setPanelStatus(null);
        const name = response.thread.to?.split('<')[0].trim() || response.thread.recipientEmail;
        return { message: `Drafted a follow-up for ${name} — review it in the panel.` };
      }
      case 'UPDATE_SETTING':
        setThresholdDays(response.thresholdDays);
        return { message: `Updated the threshold to ${response.thresholdDays} days.` };
      case 'QUERY_THREADS':
        return { message: response.answer };
      case 'CREATE_TASK':
        await refreshTasks();
        return { message: `Added to your tasks: "${response.task.text}".` };
      case 'QUERY_TASKS':
        return { message: response.answer };
      default:
        return { message: response.answer || "Sorry, I didn't understand that." };
    }
  };

  if (status.loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  if (!status.connected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow p-8 max-w-sm text-center space-y-4">
          <h1 className="text-xl font-semibold">Email Follow-up Agent</h1>
          <p className="text-gray-500 text-sm">Connect your Gmail account to get started.</p>
          <a
            href={getGoogleAuthUrl()}
            className="inline-block bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium"
          >
            Connect Gmail
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fb] flex flex-col">
      <TopBar
        email={status.email}
        connected={status.connected}
        onRefresh={refreshThreads}
        refreshing={refreshing}
        thresholdDays={thresholdDays}
        onThresholdChange={setThresholdDays}
      />

      <ChatBar onSubmit={handleChatCommand} disabled={refreshing} />

      {error && (
        <div className="px-8 py-2 bg-red-50 text-red-700 text-sm border-b border-red-100">{error}</div>
      )}

      <div className="px-8 pt-5">
        <div className="inline-flex bg-gray-100 rounded-lg p-1 gap-1">
          {[
            { key: 'followups', label: 'Follow-ups', count: threads.filter((t) => t.daysWaiting > thresholdDays).length },
            {
              key: 'tasks',
              label: 'Tasks',
              count: taskGroups.overdue.length + taskGroups.today.length,
            },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className={`ml-1.5 inline-flex items-center justify-center text-[10px] font-semibold rounded-full w-4 h-4 ${
                    tab === t.key ? 'bg-red-100 text-red-700' : 'bg-red-500 text-white'
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-6 px-8 py-6 flex-1">
        {tab === 'followups' ? (
          <>
            <ThreadList
              threads={threads}
              thresholdDays={thresholdDays}
              selectedThreadId={selectedThread?.threadId}
              savedDraftIdByThread={savedDraftIdByThread}
              onPreview={() => {}}
              onDraftFollowup={(thread) => openDraftFor(thread)}
              onSend={handleSend}
            />

            <DraftPanel
              thread={selectedThread}
              tone={tone}
              onToneChange={(t) => {
                setTone(t);
                if (selectedThread) openDraftFor(selectedThread, t);
              }}
              subject={draftSubject}
              body={draftBody}
              onBodyChange={setDraftBody}
              onRegenerate={handleRegenerate}
              onSave={handleSave}
              onSend={() => handleSend()}
              onClose={() => setSelectedThread(null)}
              loading={draftLoading}
              saving={saving}
              sending={sending}
              savedDraftId={selectedThread ? savedDraftIdByThread[selectedThread.threadId] : null}
              statusMessage={panelStatus}
            />
          </>
        ) : (
          <TasksBoard groups={taskGroups} onAdd={handleAddTask} onToggle={handleToggleTask} onDelete={handleDeleteTask} />
        )}
      </div>
    </div>
  );
}
