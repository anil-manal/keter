// Audio Capture Service: Handles Microphone & System Loopback Capture

export class AudioCaptureManager {
  constructor() {
    this.audioContext = null;
    this.micStream = null;
    this.systemStream = null;
    this.micAnalyser = null;
    this.systemAnalyser = null;
    this.isListening = false;
  }

  async initAudioContext() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  // 1. Capture Candidate Mic
  async startMicrophone() {
    await this.initAudioContext();
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const source = this.audioContext.createMediaStreamSource(this.micStream);
      this.micAnalyser = this.audioContext.createAnalyser();
      this.micAnalyser.fftSize = 64;
      source.connect(this.micAnalyser);
      return this.micStream;
    } catch (err) {
      console.warn('[Audio] Microphone access failed or denied:', err);
      return null;
    }
  }

  // 2. Capture Meeting / System Audio via Screen or Tab Sharing
  async startSystemAudio() {
    await this.initAudioContext();
    try {
      // In Chromium / Electron, getDisplayMedia with audio: true captures system/tab audio
      this.systemStream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: 1, height: 1, frameRate: 1 }, // Minimal video overhead
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
        },
      });

      // Stop video track immediately to conserve CPU/RAM, retain pristine audio
      const videoTracks = this.systemStream.getVideoTracks();
      videoTracks.forEach(track => track.stop());

      const audioTracks = this.systemStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const audioStream = new MediaStream([audioTracks[0]]);
        const source = this.audioContext.createMediaStreamSource(audioStream);
        this.systemAnalyser = this.audioContext.createAnalyser();
        this.systemAnalyser.fftSize = 64;
        source.connect(this.systemAnalyser);
        return audioStream;
      }
      return null;
    } catch (err) {
      console.warn('[Audio] System audio loopback access denied or cancelled:', err);
      return null;
    }
  }

  // Get live volume level (0 to 100) for visualizer UI
  getAudioLevels() {
    let micLevel = 0;
    let systemLevel = 0;

    if (this.micAnalyser) {
      const data = new Uint8Array(this.micAnalyser.frequencyBinCount);
      this.micAnalyser.getByteFrequencyData(data);
      const avg = data.reduce((acc, val) => acc + val, 0) / data.length;
      micLevel = Math.min(100, Math.round((avg / 255) * 150));
    }

    if (this.systemAnalyser) {
      const data = new Uint8Array(this.systemAnalyser.frequencyBinCount);
      this.systemAnalyser.getByteFrequencyData(data);
      const avg = data.reduce((acc, val) => acc + val, 0) / data.length;
      systemLevel = Math.min(100, Math.round((avg / 255) * 150));
    }

    return { micLevel, systemLevel };
  }

  // Create a combined audio stream combining both Mic and System audio
  getMixedStream() {
    if (!this.audioContext) return this.micStream || this.systemStream;
    try {
      const destination = this.audioContext.createMediaStreamDestination();
      if (this.micStream && this.micStream.getAudioTracks().length > 0) {
        const micSource = this.audioContext.createMediaStreamSource(this.micStream);
        micSource.connect(destination);
      }
      if (this.systemStream && this.systemStream.getAudioTracks().length > 0) {
        const sysSource = this.audioContext.createMediaStreamSource(this.systemStream);
        sysSource.connect(destination);
      }
      return destination.stream.getAudioTracks().length > 0 ? destination.stream : (this.micStream || this.systemStream);
    } catch (e) {
      console.warn('[Audio] Error mixing audio streams:', e);
      return this.micStream || this.systemStream;
    }
  }

  stopSystemAudio() {
    if (this.systemStream) {
      this.systemStream.getTracks().forEach(t => t.stop());
      this.systemStream = null;
    }
    this.systemAnalyser = null;
  }

  stopAll() {
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
    if (this.systemStream) {
      this.systemStream.getTracks().forEach(t => t.stop());
      this.systemStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const audioCaptureManager = new AudioCaptureManager();
