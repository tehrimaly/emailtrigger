import { getGeminiClient, GEMINI_MODEL } from './geminiClient.js';

const TONE_INSTRUCTIONS = {
  formal: 'Write in a formal, professional tone.',
  casual: 'Write in a warm, casual, friendly tone.',
  urgent: 'Write in a polite but urgent tone that conveys time sensitivity without being pushy.',
};

/**
 * Drafts a follow-up email body for one thread. The caller (route/UI)
 * decides when this actually gets saved to Gmail or sent — this only
 * generates text.
 */
export async function generateFollowupDraft({ thread, tone = 'formal' }) {
  const ai = getGeminiClient();
  const toneInstruction = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.formal;
  const recipientName = thread.to?.split('<')[0].trim() || thread.recipientEmail;

  const prompt = `You are drafting a short follow-up email on behalf of the sender of an original email that has not received a reply.

Original email subject: "${thread.subject}"
Original email recipient: ${recipientName} <${thread.recipientEmail}>
Original email snippet: "${thread.snippet ?? ''}"

${toneInstruction}
Keep it brief (3-5 sentences), reference the original topic naturally, and end with a light call to action. Do not repeat the subject line as a heading. Do not fabricate specific facts that aren't implied by the snippet. Sign off with "Best," on its own line, with no name after it.

Respond with JSON only, in exactly this shape: {"body": "<email body text, using \\n for line breaks>"}`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: { responseMimeType: 'application/json' },
  });

  let parsed;
  try {
    parsed = JSON.parse(response.text);
  } catch {
    parsed = { body: response.text }; // model didn't return clean JSON — fall back to raw text
  }

  return {
    subject: thread.subject.startsWith('Re:') ? thread.subject : `Re: ${thread.subject}`,
    body: (parsed.body || '').trim(),
    tone,
  };
}

/**
 * Interprets a free-text chat command against the current thread list.
 * Returns a structured intent the route layer dispatches on — this
 * function never itself drafts, saves, or sends anything.
 */
export async function parseChatCommand({ message, threads, thresholdDays, tasks, now = new Date() }) {
  const ai = getGeminiClient();

  const threadSummaries = threads.map((t) => ({
    id: t.threadId,
    recipientName: t.to?.split('<')[0].trim() || t.recipientEmail,
    recipientEmail: t.recipientEmail,
    subject: t.subject,
    daysWaiting: t.daysWaiting,
  }));

  const taskSummaries = (tasks ?? []).map((t) => ({ id: t.id, text: t.text, dueAt: t.dueAt }));

  const prompt = `You are the assistant embedded in an email follow-up dashboard. The user typed a command into a chat box. Decide what they want and respond with JSON only, matching exactly this shape:

{"intent": "DRAFT_FOLLOWUP" | "QUERY_THREADS" | "UPDATE_SETTING" | "CREATE_TASK" | "QUERY_TASKS" | "UNKNOWN", "threadId": string|null, "tone": "formal"|"casual"|"urgent"|null, "thresholdDays": number|null, "taskText": string|null, "taskDueAt": string|null, "answer": string|null}

Rules:
- "DRAFT_FOLLOWUP": the user wants a follow-up drafted for a specific thread (e.g. "follow up with HR", "draft one for Sarah"). Pick the best matching thread id from the list below by recipient name, email, or subject keywords. Set "tone" if the user specified one, otherwise null. Leave "answer" null.
- "QUERY_THREADS": the user is asking a question about current email threads (e.g. "which ones are overdue?", "how long has Sarah been waiting?"). Answer ONLY using the thread data below, as a short plain-text sentence in "answer".
- "UPDATE_SETTING": the user wants to change the days-threshold (e.g. "change the threshold to 5 days", "only flag overdue after a week"). Put the new number of days in "thresholdDays".
- "CREATE_TASK": the user wants to be reminded of something or add a task/to-do (e.g. "remind me to call the client tomorrow at 3pm", "add a task to review the contract"). Put the task description in "taskText" (concise, no filler like "remind me to"). If a due date/time is mentioned, resolve it to an absolute ISO 8601 datetime in "taskDueAt" using the current date/time given below as reference; if no date/time is mentioned, leave "taskDueAt" null.
- "QUERY_TASKS": the user is asking what they need to do (e.g. "what are my tasks for today?", "what haven't I done yet?", "what's on for tomorrow?"). Answer ONLY using the task list and thread data below, as a short plain-text sentence in "answer" — mention overdue email follow-ups too if relevant to what they asked.
- "UNKNOWN": the command doesn't clearly match any of the above. Put a short, friendly clarifying question in "answer".

Leave every field not mentioned in a rule above as null.

Current date/time (ISO, UTC): ${now.toISOString()}
Current days-threshold: ${thresholdDays}

Threads awaiting reply (JSON):
${JSON.stringify(threadSummaries)}

Existing open tasks (JSON):
${JSON.stringify(taskSummaries)}

User command: "${message}"`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: { responseMimeType: 'application/json' },
  });

  try {
    return JSON.parse(response.text);
  } catch {
    return {
      intent: 'UNKNOWN',
      threadId: null,
      tone: null,
      thresholdDays: null,
      taskText: null,
      taskDueAt: null,
      answer: "Sorry, I couldn't understand that.",
    };
  }
}
