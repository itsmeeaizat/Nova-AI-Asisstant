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

  constructor() {
    // Lazy AudioContext initialization
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
    // Send immediate initial state
    listener(this.getState());
    return () => {
      this.stateListeners = this.stateListeners.filter(l => l !== listener);
    };
  }

  public onFrequencyData(listener: (frequencies: Uint8Array) => void): () => void {
    this.frequencyListeners.push(listener);
    return () => {
      this.frequencyListeners = this.frequencyListeners.filter(l => l !== listener);
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
    this.stateListeners.forEach(fn => fn(state));
  }

  private startFrequencyTracker(analyser: AnalyserNode) {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const update = () => {
      if (!this.isSpeaking) {
        // Send flat zero array
        dataArray.fill(0);
        this.frequencyListeners.forEach(fn => fn(dataArray));
        return;
      }
      analyser.getByteFrequencyData(dataArray);
      this.frequencyListeners.forEach(fn => fn(dataArray));
      this.animFrameId = requestAnimationFrame(update);
    };

    update();
  }

  public stop(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.currentSourceNode) {
      try {
        this.currentSourceNode.stop();
        this.currentSourceNode.disconnect();
      } catch (e) {
        // Ignore if already stopped
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

    this.isSpeaking = false;
    this.isLoading = false;
    this.activeMessageId = null;
    this.activeProvider = null;
    this.activeVoiceName = null;
    this.notify();
  }

  /**
   * Play PCM 16-bit 24kHz raw audio returned by Gemini Live
   */
  private async playPcm24k(base64Data: string, messageId?: string, voiceName?: string): Promise<void> {
    this.stop();
    const ctx = this.getAudioContext(24000);

    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Convert 16-bit PCM little endian into float32
    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }

    const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
    audioBuffer.getChannelData(0).set(float32Array);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);
    analyser.connect(ctx.destination);

    this.currentSourceNode = source;
    this.analyserNode = analyser;
    this.isSpeaking = true;
    this.isLoading = false;
    this.activeMessageId = messageId || null;
    this.activeProvider = 'gemini';
    this.activeVoiceName = voiceName || 'Kore';
    this.notify();
    this.startFrequencyTracker(analyser);

    source.onended = () => {
      if (this.currentSourceNode === source) {
        this.stop();
      }
    };

    source.start(0);
  }

  /**
   * Play Standard MP3 / WAV encoded audio returned by OpenAI Audio API or ElevenLabs
   */
  private async playEncodedAudio(
    base64Data: string,
    mimeType: string = 'audio/mp3',
    messageId?: string,
    provider: 'openai' | 'elevenlabs' = 'openai',
    voiceName?: string
  ): Promise<void> {
    this.stop();

    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: mimeType });
    const url = URL.createObjectURL(blob);
    this.currentAudioUrl = url;

    const audio = new Audio(url);
    this.currentAudio = audio;

    // Attach Web Audio analyzer for real-time waveform reactions
    try {
      const ctx = this.getAudioContext();
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      this.analyserNode = analyser;
      this.startFrequencyTracker(analyser);
    } catch (e) {
      // Audio element still works normally if MediaElementSource is restricted
    }

    this.isSpeaking = true;
    this.isLoading = false;
    this.activeMessageId = messageId || null;
    this.activeProvider = provider;
    this.activeVoiceName = voiceName || 'Voice';
    this.notify();

    audio.onended = () => {
      this.stop();
    };

    audio.onerror = (e) => {
      console.error('Audio playback error:', e);
      this.stop();
    };

    await audio.play();
  }

  /**
   * Universal Generative Neural Speech Player
   * Fetches Real-Time Neural Speech from Gemini Live, OpenAI Audio API, or ElevenLabs
   */
  public async speakMessage(
    text: string,
    options?: {
      voice?: string;
      provider?: 'gemini' | 'openai' | 'elevenlabs';
      speed?: number;
      emotion?: string;
      apiKeys?: any;
    },
    messageId?: string,
    config: EndpointConfig = DEFAULT_ENDPOINT_CONFIG
  ): Promise<void> {
    if (this.isSpeaking && this.activeMessageId === messageId) {
      // Toggle pause/stop if clicking the same speaking message
      this.stop();
      return;
    }

    this.stop();
    this.isLoading = true;
    this.activeMessageId = messageId || null;
    this.notify();

    // Sanitize markdown, code blocks, bullet points and symbols for natural spoken speech
    const cleanSpeechText = text
      .replace(/```[\s\S]*?```/g, ' [potongan kode pemrograman] ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*#_~>|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    try {
      const res = await apiService.generateSpeech(cleanSpeechText || text, options, config);

      if (!res.audioBase64) {
        throw new Error('No audio data received from generative speech engine.');
      }

      if (res.mimeType?.includes('pcm') || res.provider === 'gemini') {
        await this.playPcm24k(res.audioBase64, messageId, res.voiceUsed || options?.voice);
      } else {
        await this.playEncodedAudio(
          res.audioBase64,
          res.mimeType || 'audio/mp3',
          messageId,
          (res.provider as 'openai' | 'elevenlabs') || 'openai',
          res.voiceUsed || options?.voice
        );
      }
    } catch (err) {
      console.warn('Generative Neural Speech failed, falling back to Web Speech API:', err);
      // Seamless fallback to browser speech synthesis (Indonesian supported)
      try {
        await this.speakWithBrowserTts(cleanSpeechText || text, messageId, options?.speed);
      } catch (fallbackErr) {
        console.error('Browser TTS fallback failed:', fallbackErr);
        this.stop();
        throw err;
      }
    }
  }

  /**
   * Browser SpeechSynthesis Fallback (Works instantly without API key / offline)
   */
  public speakWithBrowserTts(text: string, messageId?: string, speed: number = 1.0): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Browser speech synthesis is not supported.'));
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text.slice(0, 3000));
      utterance.lang = 'id-ID';
      utterance.rate = Math.max(0.8, Math.min(1.5, speed));

      // Attempt to pick an Indonesian voice if available
      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find(v => v.lang.startsWith('id') || v.lang.includes('ID'));
      if (idVoice) {
        utterance.voice = idVoice;
      }

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

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        this.stop();
        resolve(); // resolve gracefully
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
