/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiService } from './apiService';
import { EndpointConfig, DEFAULT_ENDPOINT_CONFIG } from '../config/endpoints';

export interface AudioState {
  isSpeaking: boolean;
  isLoading: boolean;
  activeMessageId: string | null;
  provider: 'gemini' | 'openai' | 'elevenlabs' | null;
  voiceName: string | null;
}

export interface VoiceOptions {
  voice?: string;
  provider?: 'gemini' | 'openai' | 'elevenlabs';
  speed?: number;
  emotion?: string;
  apiKeys?: any;
}

interface StreamQueueItem {
  id: number;
  text: string;
  audioPromise: Promise<AudioBuffer | null>;
}

class AudioService {
  private currentAudio: HTMLAudioElement | null = null;
  private currentAudioUrl: string | null = null;
  private audioCtx: AudioContext | null = null;
  private currentSourceNode: AudioBufferSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  private isSpeaking = false;
  private isLoading = false;
  private activeMessageId: string | null = null;
  private activeProvider: 'gemini' | 'openai' | 'elevenlabs' | null = null;
  private activeVoiceName: string | null = null;

  private stateListeners: Array<(state: AudioState) => void> = [];
  private frequencyListeners: Array<(frequencies: Uint8Array) => void> = [];

  // Active Streaming Voice Session State
  private activeStreamSession: {
    sessionId: string;
    messageId: string;
    options: VoiceOptions;
    config: EndpointConfig;
    rawBuffer: string;
    queue: StreamQueueItem[];
    nextId: number;
    playIndex: number;
    isPlaying: boolean;
    isFinished: boolean;
    isAborted: boolean;
    abortController: AbortController;
  } | null = null;

  constructor() {
    // Web Audio lazy initialization
  }

  private getAudioContext(sampleRate: number = 24000): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass({ sampleRate });
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public onStateChange(listener: (state: AudioState) => void): () => void {
    this.stateListeners.push(listener);
    listener(this.getState());
    return () => {
      this.stateListeners = this.stateListeners.filter((l) => l !== listener);
    };
  }

  public onFrequencyData(listener: (frequencies: Uint8Array) => void): () => void {
    this.frequencyListeners.push(listener);
    return () => {
      this.frequencyListeners = this.frequencyListeners.filter((l) => l !== listener);
    };
  }

  public getState(): AudioState {
    return {
      isSpeaking: this.isSpeaking,
      isLoading: this.isLoading,
      activeMessageId: this.activeMessageId,
      provider: this.activeProvider,
      voiceName: this.activeVoiceName,
    };
  }

  private notify(): void {
    const state = this.getState();
    this.stateListeners.forEach((fn) => fn(state));
  }

  private startFrequencyTracker(analyser: AnalyserNode) {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const update = () => {
      if (!this.isSpeaking) {
        dataArray.fill(0);
        this.frequencyListeners.forEach((fn) => fn(dataArray));
        return;
      }
      analyser.getByteFrequencyData(dataArray);
      this.frequencyListeners.forEach((fn) => fn(dataArray));
      this.animFrameId = requestAnimationFrame(update);
    };

    update();
  }

  public stop(): void {
    // Abort stream session if active
    if (this.activeStreamSession) {
      this.activeStreamSession.isAborted = true;
      this.activeStreamSession.abortController.abort();
      this.activeStreamSession = null;
    }

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.currentSourceNode) {
      try {
        this.currentSourceNode.stop();
        this.currentSourceNode.disconnect();
      } catch (e) {
        // Ignore
      }
      this.currentSourceNode = null;
    }

    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }

    if (this.currentAudioUrl) {
      URL.revokeObjectURL(this.currentAudioUrl);
      this.currentAudioUrl = null;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    this.isSpeaking = false;
    this.isLoading = false;
    this.activeMessageId = null;
    this.activeProvider = null;
    this.activeVoiceName = null;
    this.notify();
  }

  /**
   * Helper to sanitize markdown and technical syntax for spoken speech
   */
  public sanitizeForSpeech(text: string): string {
    return text
      .replace(/```[\s\S]*?```/g, ' [potongan kode] ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/https?:\/\/[^\s]+/g, ' tautan ')
      .replace(/[*#_~>|]/g, ' ')
      .replace(/^[\s\d.-]+(?=[A-Za-z])/gm, '') // Remove bullet numbers e.g. "1. " at line starts
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Decode raw PCM 16-bit 24kHz (Gemini Live) into Web Audio AudioBuffer
   */
  private decodePcm24k(base64Data: string, ctx: AudioContext): AudioBuffer {
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }

    const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
    audioBuffer.getChannelData(0).set(float32Array);
    return audioBuffer;
  }

  /**
   * Decode encoded MP3 / WAV into Web Audio AudioBuffer
   */
  private async decodeEncodedAudio(base64Data: string, ctx: AudioContext): Promise<AudioBuffer> {
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return await ctx.decodeAudioData(bytes.buffer.slice(0));
  }

  /**
   * Play an AudioBuffer with frequency analysis and await its completion
   */
  private playBuffer(audioBuffer: AudioBuffer, ctx: AudioContext): Promise<void> {
    return new Promise((resolve) => {
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyser.connect(ctx.destination);

      this.currentSourceNode = source;
      this.analyserNode = analyser;
      this.startFrequencyTracker(analyser);

      source.onended = () => {
        if (this.currentSourceNode === source) {
          this.currentSourceNode = null;
        }
        resolve();
      };

      source.start(0);
    });
  }

  /**
   * Synthesize audio for a single sentence/chunk with Neural AI engine
   */
  private async synthesizeChunk(
    text: string,
    options: VoiceOptions,
    config: EndpointConfig,
    signal: AbortSignal
  ): Promise<AudioBuffer | null> {
    if (signal.aborted || !text.trim()) return null;

    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts && !signal.aborted) {
      try {
        const res = await apiService.generateSpeech(
          text,
          {
            voice: options.voice,
            provider: options.provider || 'gemini',
            speed: options.speed,
            emotion: options.emotion,
            apiKeys: options.apiKeys,
          },
          config
        );

        if (signal.aborted || !res.audioBase64) return null;

        const ctx = this.getAudioContext(24000);
        if (res.mimeType?.includes('pcm')) {
          return this.decodePcm24k(res.audioBase64, ctx);
        } else {
          return await this.decodeEncodedAudio(res.audioBase64, ctx);
        }
      } catch (err) {
        attempts++;
        if (attempts >= maxAttempts) {
          console.warn('Neural TTS synthesis failed after retries:', err);
          return null;
        }
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    return null;
  }

  /**
   * Play a chunk via Browser SpeechSynthesis Utterance with consistent vocal profile
   */
  private playBrowserSpeechChunk(
    text: string,
    speed: number = 1.0,
    voiceName?: string,
    signal?: AbortSignal
  ): Promise<void> {
    return new Promise((resolve) => {
      if (signal?.aborted || typeof window === 'undefined' || !('speechSynthesis' in window) || !text.trim()) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.slice(0, 800));
      utterance.lang = 'id-ID';
      utterance.rate = Math.max(0.8, Math.min(1.5, speed));

      const isFemale = ['kore', 'zephyr', 'shimmer', 'coral', 'aoede'].includes((voiceName || 'kore').toLowerCase());
      utterance.pitch = isFemale ? 1.15 : 0.95;

      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find((v) => v.lang.startsWith('id') || v.lang.includes('ID'));
      if (idVoice) {
        utterance.voice = idVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Start a Real-Time Chunk-Based Streaming Speech Session
   * Called as soon as the user submits a message and the AI starts streaming text tokens.
   */
  public startStreamSession(
    messageId: string,
    options: VoiceOptions = {},
    config: EndpointConfig = DEFAULT_ENDPOINT_CONFIG
  ): void {
    // Unconditionally terminate any previous speech (both Web Audio and Browser Speech) to avoid clashing
    this.stop();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const sessionId = Math.random().toString(36).substring(7);
    this.activeStreamSession = {
      sessionId,
      messageId,
      options,
      config,
      rawBuffer: '',
      queue: [],
      nextId: 0,
      playIndex: 0,
      isPlaying: false,
      isFinished: false,
      isAborted: false,
      abortController: new AbortController(),
    };

    this.activeMessageId = messageId;
    this.activeProvider = options.provider || 'gemini';
    this.activeVoiceName = options.voice || 'Kore';
    this.isLoading = true;
    this.isSpeaking = false;
    this.notify();
  }

  /**
   * Push incoming text token/delta from the streaming AI model response
   */
  public pushStreamChunk(chunkText: string): void {
    const session = this.activeStreamSession;
    if (!session || session.isAborted) return;

    session.rawBuffer += chunkText;

    // Scan for complete sentences or clauses
    this.extractAndQueueSentences(session, false);
  }

  /**
   * Signal that the text stream has completed from the AI model
   */
  public finishStream(): void {
    const session = this.activeStreamSession;
    if (!session || session.isAborted) return;

    session.isFinished = true;
    this.extractAndQueueSentences(session, true);
  }

  /**
   * Sentence / Clause Boundary Extractor
   */
  private extractAndQueueSentences(
    session: NonNullable<typeof this.activeStreamSession>,
    isFinal: boolean
  ): void {
    while (session.rawBuffer.length > 0) {
      // Look for natural sentence breaks
      const sentenceRegex = /([.!?:\n]+|\s*;\s*)/g;
      let match = sentenceRegex.exec(session.rawBuffer);

      // If buffer is getting long (> 45 chars) and contains a comma or dash, split early for ultra-low latency!
      if (!match && session.rawBuffer.length > 45) {
        const commaMatch = /([,]| - | — )/g.exec(session.rawBuffer);
        if (commaMatch && commaMatch.index >= 20) {
          match = commaMatch;
        }
      }

      if (match) {
        const breakIndex = match.index + match[0].length;
        const segment = session.rawBuffer.substring(0, breakIndex);

        // Avoid breaking inside common abbreviations (e.g. "Dr.", "Jl.", "Rp.", "No.", "3.7")
        if (/\b(Dr|Prof|Jl|Rp|No|dll|dsb|dst|vs|i\.e|e\.g)\.$/i.test(segment.trim()) || /\d\.\d+$/.test(segment.trim())) {
          // Continue scanning for next punctuation
          continue;
        }

        session.rawBuffer = session.rawBuffer.substring(breakIndex);
        const cleanText = this.sanitizeForSpeech(segment);
        if (cleanText.length >= 2) {
          this.enqueueChunkForPlayback(session, cleanText);
        }
      } else {
        // If final flush and remaining buffer has content
        if (isFinal && session.rawBuffer.trim().length > 0) {
          const cleanText = this.sanitizeForSpeech(session.rawBuffer);
          session.rawBuffer = '';
          if (cleanText.length >= 2) {
            this.enqueueChunkForPlayback(session, cleanText);
          }
        }
        break;
      }
    }
  }

  /**
   * Enqueue a detected sentence into the background synthesis pipeline and trigger player
   */
  private enqueueChunkForPlayback(
    session: NonNullable<typeof this.activeStreamSession>,
    sentenceText: string
  ): void {
    const chunkId = session.nextId++;
    const item: StreamQueueItem = {
      id: chunkId,
      text: sentenceText,
      audioPromise: this.synthesizeChunk(
        sentenceText,
        session.options,
        session.config,
        session.abortController.signal
      ),
    };

    session.queue.push(item);
    this.processStreamPlayQueue(session);
  }

  /**
   * Asynchronous Sequential Audio Playback Queue
   * Guarantees single-source audio output with zero overlap and no browser TTS clash
   */
  private async processStreamPlayQueue(
    session: NonNullable<typeof this.activeStreamSession>
  ): Promise<void> {
    if (session.isPlaying || session.isAborted) return;
    session.isPlaying = true;

    try {
      while (session.playIndex < session.queue.length && !session.isAborted) {
        const item = session.queue[session.playIndex];

        // Await background synthesized AudioBuffer
        const buffer = await item.audioPromise;
        if (session.isAborted) break;

        if (buffer) {
          this.isSpeaking = true;
          this.isLoading = false;
          this.activeMessageId = session.messageId;
          this.activeProvider = session.options.provider || 'gemini';
          this.activeVoiceName = session.options.voice || 'Kore';
          this.notify();

          // Silence any stray browser speech synthesis to ensure 100% pure neural playback
          if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
          }

          const ctx = this.getAudioContext(24000);
          await this.playBuffer(buffer, ctx);
        }

        session.playIndex++;
      }
    } catch (e) {
      console.warn('Stream playback loop error:', e);
    } finally {
      session.isPlaying = false;

      // Check if all chunks finished
      if (session.isFinished && session.playIndex >= session.queue.length) {
        this.stop();
      }
    }
  }

  /**
   * Universal Instant Speech Player for existing completed messages
   * (Uses chunked progressive synthesis for sub-second start time even on 1000+ words)
   */
  public async speakMessage(
    text: string,
    options?: VoiceOptions,
    messageId?: string,
    config: EndpointConfig = DEFAULT_ENDPOINT_CONFIG
  ): Promise<void> {
    if (this.isSpeaking && this.activeMessageId === messageId) {
      this.stop();
      return;
    }

    const cleanText = this.sanitizeForSpeech(text);
    if (!cleanText) return;

    this.startStreamSession(messageId || 'adhoc', options, config);
    this.pushStreamChunk(text);
    this.finishStream();
  }

  /**
   * Direct Browser SpeechSynthesis Fallback
   */
  public speakWithBrowserTts(text: string, messageId?: string, speed: number = 1.0): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Browser speech synthesis is not supported.'));
        return;
      }

      this.stop();
      const clean = this.sanitizeForSpeech(text);
      const utterance = new SpeechSynthesisUtterance(clean.slice(0, 3000));
      utterance.lang = 'id-ID';
      utterance.rate = Math.max(0.8, Math.min(1.5, speed));

      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find((v) => v.lang.startsWith('id') || v.lang.includes('ID'));
      if (idVoice) utterance.voice = idVoice;

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.isLoading = false;
        this.activeMessageId = messageId || null;
        this.activeProvider = 'gemini';
        this.activeVoiceName = idVoice?.name || 'Bahasa Indonesia';
        this.notify();
      };

      utterance.onend = () => {
        this.stop();
        resolve();
      };

      utterance.onerror = () => {
        this.stop();
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  public getActiveMessageId(): string | null {
    return this.activeMessageId;
  }

  public isCurrentlySpeaking(): boolean {
    return this.isSpeaking;
  }

  public isCurrentlyLoading(): boolean {
    return this.isLoading;
  }
}

export const audioService = new AudioService();
