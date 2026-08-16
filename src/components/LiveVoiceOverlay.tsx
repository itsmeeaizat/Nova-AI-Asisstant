/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Settings2,
  RefreshCw,
  Radio,
  Sliders,
  ChevronDown,
  Layers
} from 'lucide-react';
import { audioService, AudioState } from '../services/audioService';
import { AVAILABLE_VOICES, VoiceModelOption, ApiKeysConfig, ModelOption } from '../config/endpoints';
import { VoiceSettings } from '../types/chat';

interface LiveVoiceOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  activeModel: ModelOption;
  voiceSettings: VoiceSettings;
  onUpdateVoiceSettings: (settings: VoiceSettings) => void;
  onSendMessage: (text: string) => Promise<string | undefined>;
  apiKeys: ApiKeysConfig;
  onOpenSettings?: (tab?: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const LiveVoiceOverlay: React.FC<LiveVoiceOverlayProps> = ({
  isOpen,
  onClose,
  activeModel,
  voiceSettings,
  onUpdateVoiceSettings,
  onSendMessage,
  apiKeys,
  onOpenSettings,
  onShowToast,
}) => {
  const [audioState, setAudioState] = React.useState<AudioState>(audioService.getState());
  const [frequencies, setFrequencies] = React.useState<number[]>([10, 20, 15, 30, 25, 40, 20, 15]);
  const [isListening, setIsListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState('');
  const [latestAiResponse, setLatestAiResponse] = React.useState<string>('');
  const [statusMessage, setStatusMessage] = React.useState<string>('Tap the microphone to start talking');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [showVoicePicker, setShowVoicePicker] = React.useState(false);

  const recognitionRef = React.useRef<any>(null);

  // Subscribe to audio state & frequency data
  React.useEffect(() => {
    const unsubState = audioService.onStateChange(setAudioState);
    const unsubFreq = audioService.onFrequencyData((rawFreqs) => {
      // Pick 8 representative bars from the 32 bins
      const sample = [
        rawFreqs[1] || 10,
        rawFreqs[3] || 15,
        rawFreqs[5] || 25,
        rawFreqs[7] || 35,
        rawFreqs[9] || 40,
        rawFreqs[11] || 30,
        rawFreqs[13] || 20,
        rawFreqs[15] || 10,
      ];
      setFrequencies(sample);
    });
    return () => {
      unsubState();
      unsubFreq();
    };
  }, []);

  // Web Speech API for real-time speech-to-text
  React.useEffect(() => {
    if (!isOpen) {
      stopListening();
      audioService.stop();
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'id-ID, en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setStatusMessage('Mendengarkan suara Anda...');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setStatusMessage('Izin mikrofon ditolak. Mohon izinkan akses mikrofon di browser Anda.');
        } else {
          setStatusMessage('Mikrofon jeda. Ketuk tombol mikrofon untuk berbicara.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isOpen]);

  const startListening = () => {
    audioService.stop();
    setTranscript('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // May already be started
      }
    } else {
      setStatusMessage('Pengenalan suara tidak didukung di peramban ini.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  };

  const handleToggleMic = () => {
    if (isListening) {
      stopListening();
      if (transcript.trim()) {
        handleProcessSpeechInput(transcript);
      }
    } else {
      startListening();
    }
  };

  const handleProcessSpeechInput = async (spokenText: string) => {
    if (!spokenText.trim() || isProcessing) return;
    setIsProcessing(true);
    setStatusMessage(`Sedang memproses respons suara bersama ${activeModel.name}...`);

    try {
      const responseText = await onSendMessage(spokenText);
      if (responseText) {
        setLatestAiResponse(responseText);
        setStatusMessage('Merespons melalui suara percakapan...');
      }
    } catch (err: any) {
      setStatusMessage(`Gagal: ${err.message || 'Gagal memproses suara'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Current selected voice meta
  const currentVoice = AVAILABLE_VOICES.find(v => v.id === voiceSettings.voiceId) || AVAILABLE_VOICES[0];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        id="live-voice-overlay-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-2xl flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden"
      >
        {/* Top Bar Navigation */}
        <div className="flex items-center justify-between z-10 w-full max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Gemini Live Neural Mode</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>{activeModel.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenSettings && (
              <button
                id="live-voice-settings-btn"
                onClick={() => {
                  onClose();
                  onOpenSettings('voice');
                }}
                className="p-2.5 rounded-full bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-all text-xs flex items-center gap-2"
                title="Voice Settings"
              >
                <Sliders className="w-4 h-4" />
                <span className="hidden sm:inline">Voice Engine</span>
              </button>
            )}

            <button
              id="live-voice-close-btn"
              onClick={() => {
                stopListening();
                audioService.stop();
                onClose();
              }}
              className="p-2.5 rounded-full bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all"
              title="Exit Live Mode"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Stage: Neural Dynamic Audio Orb & Frequency Visualizer */}
        <div className="flex-1 flex flex-col items-center justify-center relative my-auto py-8">
          {/* Pulsing Animated Ambient Glowing Rings */}
          <div className="relative flex items-center justify-center">
            {/* Outer pulsating aurora rings */}
            <motion.div
              animate={{
                scale: audioState.isSpeaking ? [1, 1.35, 1] : isListening ? [1, 1.2, 1] : [1, 1.05, 1],
                opacity: audioState.isSpeaking ? [0.4, 0.8, 0.4] : isListening ? [0.3, 0.6, 0.3] : [0.15, 0.25, 0.15],
              }}
              transition={{ repeat: Infinity, duration: audioState.isSpeaking ? 1.5 : 2.5, ease: 'easeInOut' }}
              className={`absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-3xl ${
                voiceSettings.provider === 'elevenlabs'
                  ? 'bg-amber-500/20'
                  : voiceSettings.provider === 'openai'
                  ? 'bg-emerald-500/20'
                  : 'bg-indigo-500/25'
              }`}
            />

            {/* Middle Rotating Neural Halo */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
              className={`w-52 h-52 sm:w-64 sm:h-64 rounded-full border-2 border-dashed ${
                audioState.isSpeaking
                  ? 'border-indigo-400/40'
                  : isListening
                  ? 'border-emerald-400/40'
                  : 'border-neutral-800'
              } flex items-center justify-center p-4`}
            >
              {/* Inner Glowing Core */}
              <motion.div
                animate={{
                  scale: audioState.isSpeaking
                    ? 1 + (frequencies.reduce((a, b) => a + b, 0) / 800)
                    : isListening
                    ? [0.95, 1.05, 0.95]
                    : 1,
                }}
                transition={{ duration: 0.15 }}
                className={`w-full h-full rounded-full flex flex-col items-center justify-center relative shadow-2xl transition-colors duration-500 ${
                  audioState.isSpeaking
                    ? 'bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400 shadow-indigo-500/50'
                    : isListening
                    ? 'bg-gradient-to-tr from-emerald-600 via-teal-500 to-green-400 shadow-emerald-500/50'
                    : isProcessing
                    ? 'bg-gradient-to-tr from-purple-600 via-pink-500 to-indigo-500 shadow-purple-500/50'
                    : 'bg-gradient-to-tr from-neutral-900 via-neutral-800 to-neutral-900 border border-neutral-700'
                }`}
              >
                {audioState.isSpeaking ? (
                  <Volume2 className="w-12 h-12 text-white animate-pulse" />
                ) : isListening ? (
                  <Mic className="w-12 h-12 text-white animate-bounce" />
                ) : isProcessing ? (
                  <RefreshCw className="w-12 h-12 text-white animate-spin" />
                ) : (
                  <Radio className="w-12 h-12 text-neutral-400" />
                )}
              </motion.div>
            </motion.div>
          </div>

          {/* Real-Time Waveform Frequency Bars */}
          <div className="flex items-center gap-1.5 mt-8 h-12">
            {frequencies.map((val, idx) => {
              const height = audioState.isSpeaking
                ? Math.max(8, Math.min(48, (val / 255) * 48))
                : isListening
                ? Math.max(6, Math.min(36, (val / 255) * 36))
                : 6;

              return (
                <motion.div
                  key={idx}
                  animate={{ height }}
                  transition={{ duration: 0.08 }}
                  className={`w-1.5 rounded-full transition-colors ${
                    audioState.isSpeaking
                      ? 'bg-indigo-400 shadow-sm shadow-indigo-400/50'
                      : isListening
                      ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                      : 'bg-neutral-800'
                  }`}
                />
              );
            })}
          </div>

          {/* Dynamic Status Pill */}
          <div className="mt-6 text-center max-w-lg px-4">
            <h2 className="text-base font-semibold text-neutral-100 flex items-center justify-center gap-2">
              {audioState.isSpeaking ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  <span>Speaking with {currentVoice.name}</span>
                </>
              ) : isListening ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Listening...</span>
                </>
              ) : isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />
                  <span>Generating Response...</span>
                </>
              ) : (
                <span>{statusMessage}</span>
              )}
            </h2>

            {/* Spoken Transcript Live Preview */}
            {transcript && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-sm text-neutral-300 italic bg-neutral-900/80 px-4 py-2 rounded-xl border border-neutral-800"
              >
                "{transcript}"
              </motion.p>
            )}

            {/* Latest AI Speech text snippet */}
            {latestAiResponse && !isListening && !transcript && (
              <p className="mt-3 text-xs text-neutral-400 line-clamp-2 max-w-md mx-auto">
                {latestAiResponse}
              </p>
            )}
          </div>
        </div>

        {/* Bottom Control Deck */}
        <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-4 z-10">
          {/* Quick Voice Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setShowVoicePicker(!showVoicePicker)}
              className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-300 hover:text-white transition-all shadow-lg"
            >
              <span className={`w-2 h-2 rounded-full ${
                voiceSettings.provider === 'elevenlabs' ? 'bg-amber-400' :
                voiceSettings.provider === 'openai' ? 'bg-emerald-400' : 'bg-indigo-400'
              }`} />
              <span className="font-medium">{currentVoice.name}</span>
              <span className="text-neutral-500">({currentVoice.providerName})</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {/* Dropdown voice options */}
            <AnimatePresence>
              {showVoicePicker && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-80 max-h-72 overflow-y-auto bg-neutral-900 border border-neutral-800 rounded-2xl p-2 shadow-2xl z-50 divide-y divide-neutral-800/60 custom-scrollbar"
                >
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Select Neural Voice Engine
                  </div>
                  {AVAILABLE_VOICES.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        onUpdateVoiceSettings({
                          ...voiceSettings,
                          provider: v.provider,
                          voiceId: v.id,
                        });
                        setShowVoicePicker(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-2 ${
                        voiceSettings.voiceId === v.id
                          ? 'bg-neutral-800 text-white font-medium'
                          : 'hover:bg-neutral-800/50 text-neutral-300'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-semibold">{v.name}</div>
                        <div className="text-[10px] text-neutral-400">{v.tone}</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-950 text-neutral-400 border border-neutral-800">
                        {v.badge}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Main Action Push-To-Talk / Mic Button */}
          <div className="flex items-center gap-6">
            {/* Stop audio button */}
            {audioState.isSpeaking && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => audioService.stop()}
                className="p-4 rounded-full bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-400 transition-all shadow-lg"
                title="Stop Speaking"
              >
                <VolumeX className="w-6 h-6" />
              </motion.button>
            )}

            {/* Central Mic Toggle */}
            <motion.button
              id="live-voice-main-mic-btn"
              whileTap={{ scale: 0.92 }}
              onClick={handleToggleMic}
              className={`p-6 sm:p-7 rounded-full transition-all shadow-2xl flex items-center justify-center ${
                isListening
                  ? 'bg-red-500 text-white shadow-red-500/50 ring-4 ring-red-500/30 animate-pulse'
                  : 'bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 hover:opacity-95 text-white shadow-indigo-500/40 ring-4 ring-indigo-500/20'
              }`}
            >
              {isListening ? (
                <MicOff className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </motion.button>

            {/* Manual Send Trigger if speech was transcribed */}
            {transcript && !isListening && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => handleProcessSpeechInput(transcript)}
                className="p-4 rounded-full bg-indigo-500/20 border border-indigo-500/30 hover:bg-indigo-500/30 text-indigo-400 transition-all shadow-lg"
                title="Send Speech Prompt"
              >
                <Sparkles className="w-6 h-6" />
              </motion.button>
            )}
          </div>

          <p className="text-[11px] text-neutral-400 text-center font-normal">
            Real-Time Generative Neural Audio • Powered by {voiceSettings.provider === 'elevenlabs' ? 'ElevenLabs' : voiceSettings.provider === 'openai' ? 'OpenAI Audio API' : 'Gemini Live'}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
