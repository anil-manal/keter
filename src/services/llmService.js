// LLM Streaming Service supporting Groq, Gemini, OpenAI, and Mock Simulator
import { buildSystemPrompt } from '../utils/promptTemplates';
import { getEffectiveApiKey } from './apiKeysConfig';

export async function streamLLMResponse({
  question,
  conversationHistory = [],
  provider = 'mock', // 'groq' | 'gemini' | 'openai' | 'mock'
  apiKey = '',
  apiKeys = {},
  mode = 'star',
  resumeContext = '',
  jobDescription = '',
  customInstructions = '',
  onToken,
  onError,
  onComplete,
  signal,
}) {
  const systemPrompt = buildSystemPrompt(mode, resumeContext, jobDescription, customInstructions);
  const effectiveKey = (apiKey || getEffectiveApiKey(provider, apiKeys) || '').trim();

  if (provider === 'mock' || !effectiveKey) {
    return simulateMockStream({ question, mode, onToken, onComplete, signal });
  }

  try {
    if (provider === 'groq') {
      return await streamGroq({ question, systemPrompt, conversationHistory, apiKey: effectiveKey, onToken, onComplete, signal });
    } else if (provider === 'gemini') {
      return await streamGemini({ question, systemPrompt, conversationHistory, apiKey: effectiveKey, onToken, onComplete, signal });
    } else if (provider === 'openai') {
      return await streamOpenAI({ question, systemPrompt, conversationHistory, apiKey: effectiveKey, onToken, onComplete, signal });
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('[LLM] Request aborted by user');
      return;
    }
    console.error('[LLM Stream Error]', err);
    if (onError) onError(err);
  }
}

// 1. Groq Streaming (OpenAI-compatible) with Verified 2026 Production Models
async function streamGroq({ question, systemPrompt, conversationHistory, apiKey, onToken, onComplete, signal }) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-4),
    { role: 'user', content: question },
  ];

  // Modern active 2026 Groq production models (prioritize ultra-fast Qwen 3.8 27B and Llama 3.3 70B)
  const candidateModels = [
    'qwen/qwen3.8-27b',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'deepseek-r1-distill-llama-70b',
  ];

  // Discover what is actually active on the user's key
  let availableModels = candidateModels;
  try {
    const modelsRes = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal,
    });
    if (modelsRes.ok) {
      const data = await modelsRes.json();
      const allActive = (data.data || [])
        .filter(m => m.active !== false)
        .map(m => m.id)
        .filter(id => !id.includes('whisper') && !id.includes('guard') && !id.includes('orpheus') && !id.includes('allam') && !id.includes('safeguard'));
      console.log('[Groq Active Models on Key]:', allActive);

      // Prioritize our verified candidate list against what is active on this key
      const uniqueActive = [...new Set(allActive)];
      const matched = candidateModels.filter(id => uniqueActive.includes(id));
      if (matched.length > 0) {
        const remaining = uniqueActive.filter(id => !matched.includes(id));
        availableModels = [...matched, ...remaining];
      } else if (uniqueActive.length > 0) {
        availableModels = uniqueActive;
      }
    }
  } catch (e) {
    console.warn('[Groq] Model query failed, using static list:', e);
  }

  let lastError = null;

  for (const model of availableModels) {
    try {
      console.log('[Groq] Attempting model:', model);
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          temperature: 0.2,
          max_tokens: 1200,
        }),
        signal,
      });

      if (response.ok) {
        console.log('[Groq] Streaming successfully using model:', model);
        await parseSSE(response, onToken);
        if (onComplete) onComplete();
        return; // Success!
      } else {
        const errorText = await response.text();
        console.warn(`[Groq] Model ${model} failed (${response.status}):`, errorText);
        lastError = new Error(`Groq Error (${model}): ${errorText}`);
        continue; // Try next model
      }
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      lastError = e;
    }
  }

  throw lastError || new Error('Failed to stream from Groq');
}

// 2. Gemini Streaming with Automatic Model Fallback
async function streamGemini({ question, systemPrompt, apiKey, onToken, onComplete, signal }) {
  const candidateModels = [
    'gemini-3-flash-preview',
    'gemini-3.7-flash',
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
  ];

  let lastError = null;

  for (const model of candidateModels) {
    try {
      console.log('[Gemini] Trying model:', model);
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: question }]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 600,
          }
        }),
        signal,
      });

      if (response.ok) {
        console.log(`[Gemini] Successfully streaming with ${model}`);
        await parseGeminiSSE(response, onToken);
        if (onComplete) onComplete();
        return;
      }

      const errorText = await response.text();
      console.warn(`[Gemini] Model ${model} returned (${response.status}):`, errorText.slice(0, 160));
      lastError = new Error(`Gemini API Error (${response.status}): ${errorText}`);
    } catch (e) {
      if (e.name === 'AbortError') return;
      lastError = e;
    }
  }

  throw lastError || new Error('All Gemini candidate models failed');
}

async function parseGeminiSSE(response, onToken) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();
        if (jsonStr) {
          try {
            const parsed = JSON.parse(jsonStr);
            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) onToken(text);
          } catch (e) {
            // keep parsing
          }
        }
      }
    }
  }
}

// 3. OpenAI Streaming
async function streamOpenAI({ question, systemPrompt, conversationHistory, apiKey, onToken, onComplete, signal }) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-4),
    { role: 'user', content: question },
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      stream: true,
      temperature: 0.3,
      max_tokens: 600,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API Error (${response.status}): ${errorText}`);
  }

  await parseSSE(response, onToken);
  if (onComplete) onComplete();
}

// Helper: Parse standard OpenAI SSE Stream
async function parseSSE(response, onToken) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') return;
        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) onToken(delta);
        } catch (e) {
          // ignore chunk parse errors
        }
      }
    }
  }
}

// 4. Intelligent Mock Simulator for Instant Demonstration
function simulateMockStream({ question, mode, onToken, onComplete, signal }) {
  let sampleOutput = '';

  if (mode === 'star') {
    sampleOutput = `**[S - Situation]** At my previous company, our payment processing microservice experienced periodic 504 gateway timeouts during flash sales, dropping 8% of transactions.

**[T - Task]** As Lead Engineer, I was tasked with diagnosing the bottleneck, redesigning the queue architecture, and achieving sub-200ms processing under a 5x load spike.

**[A - Action]** I traced the issue to unindexed database locks. I migrated synchronous webhook processing to an asynchronous Redis Streams queue with exponential backoff and implemented idempotency keys for transaction safety.

**[R - Result]** We eliminated timeouts entirely (0.001% error rate), reduced p99 latency from 1.8s to 140ms, and successfully handled 25,000 requests/sec during Black Friday.`;
  } else if (mode === 'coding') {
    sampleOutput = `**Approach**: Use a **Hash Map / Sliding Window** to track character indices. When a duplicate is encountered inside the current window, shift the left pointer past its previous occurrence.

**Complexity**: 
- Time: **O(N)** — Single pass through string of length N.
- Space: **O(min(N, M))** — Set size bounded by alphabet size M.

**Key Edge Cases**: Empty string, all identical characters, string with spaces and special symbols.

\`\`\`javascript
function lengthOfLongestSubstring(s) {
  const seen = new Map();
  let maxLen = 0, left = 0;
  for (let right = 0; right < s.length; right++) {
    if (seen.has(s[right]) && seen.get(s[right]) >= left) {
      left = seen.get(s[right]) + 1;
    }
    seen.set(s[right], right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}
\`\`\``;
  } else {
    sampleOutput = `**Core Concept**: A hybrid distributed cache with write-through consistency.

- **Architecture**: In-memory Redis cluster partitioned by user tenant ID with Envoy sidecar routing.
- **Eviction & Consistency**: Cache invalidation via Kafka CDC (Change Data Capture) from Postgres with 30-second TTL fallback.
- **Trade-offs**: Higher write latency for transactions vs instant sub-10ms read availability for 99% of queries.

💡 *Talking Tip: Ask the interviewer about the read-to-write ratio and tolerated stale window.*`;
  }

  // Stream words with realistic typing delay
  const words = sampleOutput.split(' ');
  let i = 0;

  const interval = setInterval(() => {
    if (signal && signal.aborted) {
      clearInterval(interval);
      return;
    }

    if (i < words.length) {
      onToken((i === 0 ? '' : ' ') + words[i]);
      i++;
    } else {
      clearInterval(interval);
      if (onComplete) onComplete();
    }
  }, 35); // 35ms per word (~300 words/min streaming speed)

  return () => clearInterval(interval);
}

// 5. Vision AI Streaming Service for Instant Screen Capture & Auto-Solving
const VISION_SYSTEM_PROMPT = `You are Keter, an elite live technical interview and coding assessment copilot.
You are analyzing text or an image captured from the candidate's screen during a live assessment, interview, or coding challenge.

CRITICAL CODE EXECUTION & REASONING RULES:
1. TRACE STEP-BY-STEP: Do NOT make superficial guesses based on common syntax. Mentally execute the code line by line.
2. JAVASCRIPT EVENT LOOP EXECUTION ORDER:
   - Call Stack (Synchronous): Runs immediately to completion.
   - Microtask Queue (Promise.then(), queueMicrotask(), process.nextTick()): Runs IMMEDIATELY after the synchronous stack empties, BEFORE any macrotasks/timers.
   - Macrotask Queue (setTimeout, setInterval, setImmediate, I/O): Runs ONLY after the microtask queue is completely drained.
   - Note on setTimeout(fn, 0): Even with 0ms delay, it is queued in the macrotask queue and ALWAYS executes AFTER all microtasks (Promises, queueMicrotask).
3. VARIABLE SCOPING & CLOSURES:
   - Check 'var' (function-scoped, shared across loop iterations) vs 'let' / 'const' (block-scoped, new binding per iteration).
4. SQL TRANSACTION ISOLATION LEVELS:
   - READ UNCOMMITTED: Dirty reads possible.
   - READ COMMITTED: Each query reads committed data at statement start; non-repeatable reads possible between two SELECTs in same transaction.
   - REPEATABLE READ: Consistent snapshot for entire transaction.
5. FILTER SCREEN NOISE: Ignore browser tabs, URL bars, bookmarks, sidebar menus, or unrelated open windows in the text/image. Focus exclusively on the technical question card, code snippet, and option choices.

FORMAT STRICTLY FOR TELEPROMPTER HUD:

IF MULTIPLE CHOICE QUESTION (MCQ):
- 🎯 **CORRECT OPTION:** **[Letter & Exact Text]**
- ⚡ **RATIONALE:** 1-2 sentence razor-sharp explanation of the exact execution flow (e.g. why synchronous call stack runs before asynchronous callbacks, or why closure behaves as it does).
- 🚫 **TRAP OPTIONS:** 1 line pointing out why common intuitive guesses are wrong.

IF CODING / ALGORITHM PROBLEM:
- 📌 **OBJECTIVE:** 1 sentence summarizing core goal and edge cases.
- ⏱️ **COMPLEXITY:** Time: **O(...)** | Space: **O(...)**
- 💻 **OPTIMAL CODE:** Clean, bug-free, production-ready code in the language visible on screen. Include concise inline comments.
- 🗣️ **INTERVIEW TALKING POINTS:** 2-3 bullet points the candidate can smoothly say aloud to the interviewer while typing the solution.

IF CODE DEBUGGING:
- 🐞 **BUG IDENTIFIED:** Exactly which line and why it causes failure.
- 🛠️ **FIXED CODE:** Clean corrected snippet.

Be direct, highly technical, and completely avoid conversational fluff.`;

function cleanScreenOcr(text) {
  if (!text) return '';
  const noisePatterns = [
    // Windows timestamps & clocks
    /\b\d{1,2}:\d{2}\s*(am|pm)\b/i,
    /\b\d{2}-\d{2}-\d{4}\b/i,
    // Session IDs / UUID fragments
    /^[a-f0-9-]{12,}$/i,
    /^-[a-f0-9]{4,}/i,
    // Single isolated punctuation or whitespace noise
    /^[•\-_~|\\/+=*]{1,2}$/,
  ];
  return text.split('\n')
    .map(line => line.trim())
    .filter(line => {
      if (!line) return false;
      return !noisePatterns.some(pattern => pattern.test(line));
    })
    .join('\n');
}

export async function streamVisionResponse({
  imageBase64,
  ocrText = '',
  conversationHistory = [],
  provider = 'groq',
  apiKeys = {},
  apiKey = '',
  onToken,
  onError,
  onComplete,
  signal,
}) {
  const effectiveKey = (apiKey || getEffectiveApiKey(provider, apiKeys) || '').trim();
  const geminiKey = (getEffectiveApiKey('gemini', apiKeys) || (provider === 'gemini' ? effectiveKey : '') || '').trim();
  const openaiKey = (getEffectiveApiKey('openai', apiKeys) || (provider === 'openai' ? effectiveKey : '') || '').trim();
  const groqKey = (getEffectiveApiKey('groq', apiKeys) || (provider === 'groq' ? effectiveKey : '') || '').trim();

  // If mock mode or no keys configured
  if (provider === 'mock' || (!effectiveKey && !geminiKey && !openaiKey && !groqKey)) {
    return simulateMockVisionStream({ onToken, onComplete, signal });
  }

  // Format any prior screen scroll context so multi-part questions connect seamlessly
  const priorContext = conversationHistory.length > 0
    ? `\nPREVIOUS SCREEN CONTEXT (User scrolled from previous view):\n` +
      conversationHistory.slice(-3).map(m => `[${m.role}]: ${m.text.slice(0, 400)}`).join('\n') + '\n\n'
    : '';

  try {
    // 1. Google Gemini Flash (Native Vision)
    // Multimodal vision directly inspects screen pixels, syntax boxes, diagrams, and options.
    // Always prioritize if Gemini key is available (either selected as provider or configured in Settings).
    if (geminiKey) {
      try {
        console.log('[Vision Solver] Using Google Gemini Flash (Native Vision)');
        return await streamGeminiVision({
          imageBase64,
          priorContext,
          apiKey: geminiKey,
          onToken,
          onComplete,
          signal,
        });
      } catch (geminiErr) {
        console.warn('[Vision Solver] Gemini failed, attempting fallback to Groq/OpenAI:', geminiErr.message);
        if (!groqKey && !openaiKey && !effectiveKey) {
          throw geminiErr;
        }
      }
    }

    // 2. OpenAI GPT-4o-mini (Native Vision)
    if (openaiKey) {
      try {
        console.log('[Vision Solver] Using OpenAI GPT-4o-mini (Native Vision)');
        return await streamOpenAIVision({
          imageBase64,
          apiKey: openaiKey,
          onToken,
          onComplete,
          signal,
        });
      } catch (openaiErr) {
        console.warn('[Vision Solver] OpenAI failed, attempting fallback to Groq:', openaiErr.message);
        if (!groqKey && !effectiveKey) {
          throw openaiErr;
        }
      }
    }

    // 3. Groq (or automatic fallback when Gemini/OpenAI are unavailable): Windows Native OCR + Groq
    if (groqKey) {
      console.log('[Vision Solver] Solving screen question using Windows Native OCR + Groq text model');
      const cleaned = cleanScreenOcr(ocrText);
      const questionPrompt = `${priorContext}Screen text captured from candidate's live coding/MCQ screen:
"""
${cleaned || ocrText.trim() || 'Technical question captured on screen. Provide structured teleprompter answer.'}
"""

TASK:
1. Identify the question, code snippet, and option choices (A, B, C, D) using this screen and any prior context above.
2. Determine the single strictly correct answer.
3. Format output strictly as:
🎯 **CORRECT OPTION:** [Letter & Exact Text]
⚡ **RATIONALE:** 2-3 concise bullet points explaining the execution.
🚫 **TRAP OPTIONS:** 1-2 lines on why common traps fail.

CRITICAL: Output ONLY the final solution cards. Do NOT include mental scratchpads, OCR critique, or conversational filler.`;
      return await streamGroq({
        question: questionPrompt,
        systemPrompt: VISION_SYSTEM_PROMPT,
        conversationHistory: [],
        apiKey: groqKey,
        onToken,
        onComplete,
        signal,
      });
    }

    return simulateMockVisionStream({ onToken, onComplete, signal });
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('[Vision] Request aborted by user');
      return;
    }
    console.error('[Vision Stream Error]', err);
    if (onError) onError(err);
  }
}

// Vision Provider: Google Gemini with Automatic Model Fallback
async function streamGeminiVision({ imageBase64, priorContext = '', apiKey, onToken, onComplete, signal }) {
  const pureBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  const candidateModels = [
    'gemini-3-flash-preview',
    'gemini-3.7-flash',
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
  ];

  let lastError = null;

  for (const model of candidateModels) {
    try {
      console.log('[Gemini Vision] Trying model:', model);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: (priorContext ? `${priorContext}\n\n` : '') + VISION_SYSTEM_PROMPT },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: pureBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1200,
          },
        }),
        signal,
      });

      if (response.ok) {
        console.log(`[Gemini Vision] Successfully streaming with ${model}`);
        await parseGeminiSSE(response, onToken);
        if (onComplete) onComplete();
        return;
      }

      const errText = await response.text();
      console.warn(`[Gemini Vision] Model ${model} returned (${response.status}):`, errText.slice(0, 160));
      lastError = new Error(`Gemini Vision (${response.status}): ${errText}`);
    } catch (e) {
      if (e.name === 'AbortError') return;
      lastError = e;
    }
  }

  throw lastError || new Error('All Gemini candidate vision models failed');
}

// Vision Provider: OpenAI GPT-4o-mini
async function streamOpenAIVision({ imageBase64, apiKey, onToken, onComplete, signal }) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: VISION_SYSTEM_PROMPT },
            { type: 'image_url', image_url: { url: imageBase64, detail: 'high' } },
          ],
        },
      ],
      stream: true,
      temperature: 0.2,
      max_tokens: 1200,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI Vision (${response.status}): ${errorText}`);
  }

  await parseSSE(response, onToken);
  if (onComplete) onComplete();
}

// Vision Provider: Groq Vision Models
async function streamGroqVision({ imageBase64, apiKey, onToken, onComplete, signal }) {
  let visionModel = 'llama-3.2-11b-vision-preview';
  try {
    const modelsRes = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal,
    });
    if (modelsRes.ok) {
      const data = await modelsRes.json();
      const visionModels = (data.data || [])
        .filter(m => m.active !== false && (m.id.includes('vision') || m.id.includes('vl') || m.id.includes('scout') || m.id.includes('llama-4')))
        .map(m => m.id);
      if (visionModels.length > 0) {
        visionModel = visionModels[0];
      }
    }
  } catch (e) {
    console.warn('[Groq Vision] Model check failed, using fallback:', e);
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: visionModel,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: VISION_SYSTEM_PROMPT },
            { type: 'image_url', image_url: { url: imageBase64 } },
          ],
        },
      ],
      stream: true,
      temperature: 0.2,
      max_tokens: 1200,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq Vision (${response.status}): ${errorText}`);
  }

  await parseSSE(response, onToken);
  if (onComplete) onComplete();
}

// Mock Vision Simulator for testing without active vision keys
function simulateMockVisionStream({ onToken, onComplete, signal }) {
  const sampleOutput = `🎯 **ON-SCREEN PROBLEM IDENTIFIED:** LeetCode #25 - Reverse Nodes in k-Group (Hard)

📌 **OBJECTIVE:** Reverse nodes of a linked list \`k\` at a time and return modified head. If the remaining nodes < \`k\`, leave them in place.

⏱️ **COMPLEXITY:** Time: **O(N)** (single pass) | Space: **O(1)** auxiliary space.

💻 **OPTIMAL CODE (Python 3):**
\`\`\`python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class Solution:
    def reverseKGroup(self, head: ListNode, k: int) -> ListNode:
        # Step 1: Check if there are at least k nodes left
        curr = head
        count = 0
        while curr and count < k:
            curr = curr.next
            count += 1
        if count < k:
            return head

        # Step 2: Invert current k-sized segment
        prev = None
        curr = head
        for _ in range(k):
            nxt = curr.next
            curr.next = prev
            prev = curr
            curr = nxt

        # Step 3: Recurse on remaining list and connect
        head.next = self.reverseKGroup(curr, k)
        return prev
\`\`\`

🗣️ **INTERVIEW TALKING POINTS:**
- "I first eagerly verify that at least $k$ nodes remain, satisfying the constraint that final partial groups are unmodified."
- "We reverse the current chunk in $O(1)$ memory by standard pointer manipulation, then link the segment tail to the recursive call."`;

  const words = sampleOutput.split(' ');
  let i = 0;

  const interval = setInterval(() => {
    if (signal && signal.aborted) {
      clearInterval(interval);
      return;
    }

    if (i < words.length) {
      onToken((i === 0 ? '' : ' ') + words[i]);
      i++;
    } else {
      clearInterval(interval);
      if (onComplete) onComplete();
    }
  }, 30);

  return () => clearInterval(interval);
}

// 6. Multi-Screen Question Reconstructor
export async function reconstructQuestionFromScreens({
  screens = [],
  provider = 'groq',
  apiKeys = {},
  apiKey = '',
  signal,
}) {
  if (!screens || screens.length === 0) return '';
  const cleanGroqKey = (apiKey && provider === 'groq' ? apiKey : getEffectiveApiKey('groq', apiKeys)).trim();
  const cleanGeminiKey = (apiKey && provider === 'gemini' ? apiKey : getEffectiveApiKey('gemini', apiKeys)).trim();
  const cleanOpenaiKey = (apiKey && provider === 'openai' ? apiKey : getEffectiveApiKey('openai', apiKeys)).trim();

  // Clean OCR text from each screen slice
  const screenTexts = screens.map((s, idx) => {
    const cleaned = cleanScreenOcr(s.ocrText);
    return `--- SCREEN ${idx + 1} ---\n${cleaned || s.ocrText.trim()}`;
  }).join('\n\n');

  const systemPrompt = `You are an expert AI examination assistant and OCR question extractor.
The candidate took screenshots during an online coding assessment or technical interview.
The raw screen capture contains surrounding interface elements:
- Browser window titles, tabs, bookmarks, URL bars
- Web application sidebars (e.g. chat history, navigation links, project lists, user profile names)
- Operating system taskbars, tray icons, clocks, notification toasts

YOUR MISSION:
Locate and extract ONLY the technical question / coding challenge / multiple-choice problem from the text.
Completely ignore and discard all sidebars, navigation links, chat history lists, and UI controls.

OUTPUT FORMAT:
Output ONLY the clean problem statement in markdown:
1. Problem Title & Instructions (if any)
2. Complete Code Snippet inside a markdown code block (e.g. \`\`\`java ... \`\`\`) with syntactically valid code and proper indentation.
3. All multiple-choice options (A, B, C, D) with their exact outputs/values.

CRITICAL RULES:
- DO NOT SOLVE THE QUESTION. Do NOT provide answers, solutions, or explanations.
- Output ONLY the clean, reconstructed problem statement with code block and options.`;

  const userPrompt = `Intelligently identify and extract ONLY the technical question and options from this screen text. Completely ignore and discard any sidebar navigation items or interface chrome:\n\n${screenTexts}`;

  // Helper to fetch with timeout so UI never hangs
  const fetchWithTimeout = async (url, options, timeoutMs = 8000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  };

  const imageParts = screens
    .filter(s => s.imageBase64)
    .map(s => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: s.imageBase64.replace(/^data:image\/\w+;base64,/, ''),
      },
    }));

  // 1. Try Groq Fast Text first if key is available (Sub-300ms, zero image upload overhead)
  if (cleanGroqKey && screenTexts && screenTexts.length > 20) {
    const groqCandidateModels = [
      'qwen/qwen3.8-27b',
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
    ];
    for (const gModel of groqCandidateModels) {
      try {
        const res = await fetchWithTimeout(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${cleanGroqKey}`,
            },
            body: JSON.stringify({
              model: gModel,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
              temperature: 0.1,
              max_tokens: 1500,
            }),
          },
          6000
        );

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content?.trim();
          if (content) {
            console.log(`[Question Reconstruct] Intelligently extracted question via Groq (${gModel})!`);
            return content;
          }
        } else {
          const errText = await res.text();
          console.warn(`[Question Reconstruct] Groq (${gModel}) HTTP ${res.status}:`, errText.slice(0, 150));
        }
      } catch (e) {
        console.warn(`[Question Reconstruct] Groq (${gModel}) notice:`, e.message);
      }
    }
  }

  // 2. Try Gemini Multimodal Vision if key is available
  if (cleanGeminiKey) {
    const candidateModels = ['gemini-2.0-flash', 'gemini-1.5-flash'];
    for (const model of candidateModels) {
      try {
        const parts = [
          { text: `${systemPrompt}\n\nLocate and reconstruct ONLY the technical question and options from this screen:\n${screenTexts}` },
          ...imageParts,
        ];

        const res = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanGeminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts }],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 1500,
              },
            }),
          },
          8000
        );

        if (res.ok) {
          const d = await res.json();
          const text = d.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text) {
            console.log(`[Question Reconstruct] Intelligently extracted question via Gemini Multimodal (${model})!`);
            return text;
          }
        } else {
          const errText = await res.text();
          console.warn(`[Question Reconstruct] Gemini (${model}) HTTP ${res.status}:`, errText.slice(0, 150));
        }
      } catch (geminiErr) {
        console.warn(`[Question Reconstruct] Gemini model ${model} notice:`, geminiErr.message);
      }
    }
  }

  // 3. Try OpenAI if key is available
  if (cleanOpenaiKey) {
    try {
      const res = await fetchWithTimeout(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cleanOpenaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.1,
            max_tokens: 1500,
          }),
        },
        8000
      );
      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) {
          console.log('[Question Reconstruct] Intelligently extracted question via OpenAI!');
          return content;
        }
      }
    } catch (e) {
      console.warn('[Question Reconstruct] OpenAI notice:', e.message);
    }
  }

  // 3. Fallback: Return deduplicated sequential OCR text across scrolling slices
  const uniqueLines = [];
  for (const s of screens) {
    const raw = cleanScreenOcr(s.ocrText) || s.ocrText.trim();
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      // Filter out duplicate consecutive lines from scrolling
      if (uniqueLines.length > 0 && uniqueLines[uniqueLines.length - 1] === trimmed) continue;
      uniqueLines.push(trimmed);
    }
  }
  const cleanAssembled = uniqueLines.join('\n');

  return cleanAssembled || screenTexts || 'Could not extract text from screen.';
}

