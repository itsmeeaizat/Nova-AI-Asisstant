/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioService {
  private currentAudio: HTMLAudioElement | null = null;
  private currentAudioUrl: string | null = null;
  private speechUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private activeMessageId: string | null = null;
  private stateListeners: Array<(state: { isSpeaking: boolean; activeMessageId: string | null }) => void> = [];

  public onStateChange(listener: (state: { isSpeaking: boolean; activeMessageId: string | null }) => void): () => void {
    this.stateListeners.push(listener);
    return () => {
      this.stateListeners = this.stateListeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    this.stateListeners.forEach(fn => fn({
      isSpeaking: this.isSpeaking,
      activeMessageId: this.activeMessageId,
    }));
  }

  public stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if (this.currentAudioUrl) {
      URL.revokeObjectURL(this.currentAudioUrl);
      this.currentAudioUrl = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.activeMessageId = null;
    this.notify();
  }

  public async playBase64Audio(base64Data: string, messageId?: string): Promise<void> {
    this.stop();
    try {
      const binary = atob(base64Data);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      this.currentAudioUrl = url;

      const audio = new Audio(url);
      this.currentAudio = audio;
      this.isSpeaking = true;
      this.activeMessageId = messageId || null;
      this.notify();

      audio.onended = () => {
        this.stop();
      };
      audio.onerror = () => {
        this.stop();
      };

      await audio.play();
    } catch (err) {
      console.error('Audio playback error:', err);
      this.stop();
      throw err;
    }
  }

  public speakBrowserTts(text: string, messageId?: string, speed: number = 1.0): Promise<void> {
    return new Promise((resolve, reject) => {
      this.stop();
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return reject(new Error('Browser speech synthesis is not supported.'));
      }

      // Clean markdown characters from spoken text
      const cleanText = text
        .replace(/```[\s\S]*?```/g, 'Code block omitted.')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/[#*_~>]/g, '')
        .trim();

      if (!cleanText) {
        return resolve();
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      this.speechUtterance = utterance;
      utterance.rate = Math.max(0.5, Math.min(2.0, speed));
      utterance.pitch = 1.0;

      // Select a natural voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel')) && v.lang.startsWith('en')) || voices.find(v => v.lang.startsWith('en'));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      this.isSpeaking = true;
      this.activeMessageId = messageId || null;
      this.notify();

      utterance.onend = () => {
        this.isSpeaking = false;
        this.activeMessageId = null;
        this.notify();
        resolve();
      };

      utterance.onerror = (e) => {
        this.isSpeaking = false;
        this.activeMessageId = null;
        this.notify();
        reject(e);
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
}

export const audioService = new AudioService();
