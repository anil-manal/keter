// Speech-to-Text (STT) Service supporting:
// 1. Web Speech API (Chrome / Edge)
// 2. Groq Whisper API (sub-second audio transcription)
// 3. Deepgram Live WebSocket
// 4. Voice Activity Audio Chunking

export class STTService {
  constructor({ onTranscript, onQuestionDetected, onInterimSpeech, onError }) {
    this.onTranscript = onTranscript;
    this.onQuestionDetected = onQuestionDetected;
    this.onInterimSpeech = onInterimSpeech;
    this.onError = onError;
    this.recognition = null;
    this.deepgramSocket = null;
    this.mediaRecorder = null;
    this.isListening = false;
    this.utteranceBuffer = '';
    this.silenceTimer = null;
  }

  // 1. Web Speech API (Available in Google Chrome and standard browsers)
  startWebSpeech() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return false;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        console.log('[STT] Web Speech Recognition started');
      };

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        const currentText = (finalTranscript || interimTranscript).trim();
        if (currentText && this.onTranscript) {
          this.onTranscript({
            text: currentText,
            isFinal: !!finalTranscript,
            speaker: 'Interviewer',
          });
        }

        if (finalTranscript) {
          this.utteranceBuffer += ' ' + finalTranscript;
          this.evaluateUtterance(this.utteranceBuffer.trim());
        }
      };

      this.recognition.onerror = (err) => {
        console.warn('[STT] Web Speech error:', err.error);
        if (this.onError) this.onError(err);
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch (e) {
            // Already started
          }
        }
      };

      this.recognition.start();
      return true;
    } catch (err) {
      console.warn('[STT] Web Speech start failed:', err);
      return false;
    }
  }

  // 2. Groq Whisper API (Works universally in Electron & Browsers)
  async startGroqWhisper(stream, groqApiKey) {
    if (!stream) return false;
    this.isListening = true;

    try {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      this.mediaRecorder = new MediaRecorder(stream, { mimeType });
      let audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      // Slice audio every 4.2 seconds (~14 req/min, safe from Groq 20 RPM rate limit)
      this.mediaRecorder.onstop = async () => {
        if (audioChunks.length === 0 || !this.isListening) return;
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        audioChunks = [];

        // Restart recording immediately for next window
        if (this.isListening) {
          try {
            this.mediaRecorder.start();
            setTimeout(() => {
              if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                this.mediaRecorder.stop();
              }
            }, 4200);
          } catch (e) {
            // State error catch
          }
        }

        // Transcribe blob using Groq Whisper if not currently backing off from 429
        if (audioBlob.size > 1500 && !this.isBackingOff) {
          await this.transcribeAudioBlob(audioBlob, groqApiKey);
        }
      };

      this.mediaRecorder.start();
      setTimeout(() => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.stop();
        }
      }, 4200);

      return true;
    } catch (err) {
      console.error('[STT] Groq Whisper recording error:', err);
      return false;
    }
  }

  async transcribeAudioBlob(blob, apiKey) {
    try {
      const formData = new FormData();
      formData.append('file', blob, 'audio.webm');
      formData.append('model', 'whisper-large-v3-turbo');
      formData.append('temperature', '0.0');
      formData.append('response_format', 'json');

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (response.status === 429) {
        console.warn('[STT] Groq Whisper rate limit reached (429). Pausing requests for 4s...');
        this.isBackingOff = true;
        setTimeout(() => { this.isBackingOff = false; }, 4000);
        return;
      }

      if (!response.ok) {
        console.warn('[STT] Groq Whisper API error:', response.status);
        return;
      }

      const result = await response.json();
      const text = result.text?.trim();

      // Filter out Whisper silence hallucinations (when ambient noise or silence is recorded)
      const silenceHallucinations = [
        'thank you', 'thanks', 'thank you very much', 'thank you so much',
        'subtitles by', 'amara.org', 'you', 'bye', 'goodbye', 'so', 'okay', 'um', 'uh'
      ];
      const normalized = (text || '').toLowerCase().replace(/[.,!?;:]/g, '').trim();
      const isRepeatedThankYou = /^(thank you\s*)+$/i.test(normalized) || /^(thanks\s*)+$/i.test(normalized);

      if (!text || text.length <= 2 || silenceHallucinations.includes(normalized) || isRepeatedThankYou) {
        return;
      }

      if (this.onTranscript) {
        this.onTranscript({
          text,
          isFinal: true,
          speaker: 'Interviewer',
        });
      }

      // Accumulate all chunks from this speaker turn into a continuous rolling question
      if (!this.turnChunks) this.turnChunks = [];
      this.turnChunks.push(text);
      if (this.turnChunks.length > 8) this.turnChunks.shift(); // Keep last 8 chunks (~30 seconds of context)

      const fullTurnText = this.turnChunks.join(' ').trim();
      if (this.onInterimSpeech) {
        this.onInterimSpeech(fullTurnText);
      }
      this.evaluateUtterance(fullTurnText);
    } catch (err) {
      console.warn('[STT] Audio transcription error:', err);
    }
  }

  evaluateUtterance(text) {
    clearTimeout(this.silenceTimer);

    // List of short filler phrases that should never trigger an AI answer alone
    const fillers = ['thank you', 'thanks', 'okay', 'ok', 'right', 'got it', 'sure', 'alright', 'yeah', 'next one', 'yes', 'no'];
    const cleanLower = text.toLowerCase().trim();
    if (fillers.some(f => cleanLower === f || cleanLower === f + '.')) {
      return;
    }

    const questionMarkers = [
      '?', 'how', 'why', 'what', 'can you', 'could you', 'tell me', 'explain',
      'describe', 'walk me through', 'identify', 'bottleneck', 'optimize', 'improve',
      'solve', 'approach', 'design', 'which', 'difference', 'tradeoff', 'architecture'
    ];
    const isQuestion = questionMarkers.some(m => cleanLower.includes(m)) || text.endsWith('?');

    // Incomplete phrase endings (conjunctions, prepositions, trailing verbs)
    const trailingIncomplete = [
      'and', 'or', 'to', 'for', 'with', 'the', 'a', 'an', 'in', 'on', 'at', 'of',
      'that', 'which', 'who', 'how', 'why', 'what', 'if', 'when', 'where',
      'improve', 'identify', 'increase', 'decrease', 'handle', 'like', 'such as'
    ];
    const words = cleanLower.split(/\s+/).filter(Boolean);
    const lastWord = words.length > 0 ? words[words.length - 1].replace(/[.,?!]/g, '') : '';
    const isTrailing = trailingIncomplete.includes(lastWord);

    // If clearly trailing mid-sentence or mid-clause, allow more pause for the next chunk
    const delay = isTrailing ? 7000 : 5500;

    // Wait for a natural break in speech so interviewer can ask full multi-sentence questions
    this.silenceTimer = setTimeout(() => {
      if ((text.length > 25 && isQuestion) || text.length > 70) {
        let finalized = text;
        // Strip trailing polite fillers like "thank you", "thanks"
        finalized = finalized.replace(/\s*(thank you|thanks)[.!?]*$/i, '').trim();

        if (this.onQuestionDetected && finalized.length > 15) {
          console.log('[STT] Finalized full complete question:', finalized);
          this.onQuestionDetected(finalized);
        }
        if (this.onInterimSpeech) {
          this.onInterimSpeech('');
        }
        this.turnChunks = [];
        this.utteranceBuffer = '';
      }
    }, delay);
  }

  stop() {
    this.isListening = false;
    clearTimeout(this.silenceTimer);
    if (this.onInterimSpeech) this.onInterimSpeech('');
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    if (this.deepgramSocket) {
      this.deepgramSocket.close();
      this.deepgramSocket = null;
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {}
      this.mediaRecorder = null;
    }
  }
}
