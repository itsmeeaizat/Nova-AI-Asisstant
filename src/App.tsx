/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  AVAILABLE_MODELS, 
  DEFAULT_ENDPOINT_CONFIG, 
  EndpointConfig, 
  ModelOption, 
  SYSTEM_PERSONAS, 
  SystemPersona,
  ApiKeysConfig,
  RAW_DEVELOPER_API_KEYS
} from './config/endpoints';
import { Attachment, ChatSession, GenerationSettings, GeoLocationData, Message } from './types/chat';
import { apiService } from './services/apiService';
import { audioService } from './services/audioService';
import { locationService } from './services/locationService';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { InputArea } from './components/InputArea';
import { SettingsModal } from './components/SettingsModal';
import { LiveVoiceOverlay } from './components/LiveVoiceOverlay';
import { ToastContainer, ToastMessage } from './components/Toast';
import { ThemeProvider, useTheme } from './context/ThemeContext';

const STORAGE_KEY_SESSIONS = 'nova_ai_sessions_v1';
const STORAGE_KEY_SETTINGS = 'nova_ai_settings_v1';
const STORAGE_KEY_ENDPOINTS = 'nova_ai_endpoints_v1';
const STORAGE_KEY_APIKEYS = 'nova_ai_apikeys_v1';
const STORAGE_KEY_CUSTOM_INSTRUCTION = 'nova_ai_custom_instruction_v1';

export default function App() {
  return (
    <ThemeProvider>
      <MainAppContent />
    </ThemeProvider>
  );
}

function MainAppContent() {
  const { theme } = useTheme();
  // Models & Personas
  const [models, setModels] = React.useState<ModelOption[]>(AVAILABLE_MODELS);
  const [selectedModel, setSelectedModel] = React.useState<ModelOption>(AVAILABLE_MODELS[0]);
  const [personas] = React.useState<SystemPersona[]>(SYSTEM_PERSONAS);
  const [selectedPersona, setSelectedPersona] = React.useState<SystemPersona>(SYSTEM_PERSONAS[0]);
  const [customSystemInstruction, setCustomSystemInstruction] = React.useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_INSTRUCTION);
      return saved && saved.trim() ? saved : SYSTEM_PERSONAS[0].prompt;
    } catch {
      return SYSTEM_PERSONAS[0].prompt;
    }
  });

  // API Keys (Multi-Provider: Gemini, Claude, Kimi, OpenAI, DeepSeek, Groq, Custom)
  const [apiKeys, setApiKeys] = React.useState<ApiKeysConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_APIKEYS);
      return saved ? { ...RAW_DEVELOPER_API_KEYS, ...JSON.parse(saved) } : RAW_DEVELOPER_API_KEYS;
    } catch {
      return RAW_DEVELOPER_API_KEYS;
    }
  });

  // Settings
  const [endpointConfig, setEndpointConfig] = React.useState<EndpointConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ENDPOINTS);
      return saved ? { ...DEFAULT_ENDPOINT_CONFIG, ...JSON.parse(saved) } : DEFAULT_ENDPOINT_CONFIG;
    } catch {
      return DEFAULT_ENDPOINT_CONFIG;
    }
  });

  const [generationSettings, setGenerationSettings] = React.useState<GenerationSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          voiceSettings: parsed.voiceSettings || {
            provider: 'gemini',
            voiceId: parsed.speechVoice || 'Kore',
            speed: parsed.speechSpeed || 1.0,
            emotion: 'natural',
            autoPlayReplies: true,
          },
        };
      }
      return {
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
        thinkingLevel: 'HIGH',
        enableWebSearch: false,
        speechVoice: 'Kore',
        speechSpeed: 1.0,
        enforceIndonesian: true,
        voiceSettings: {
          provider: 'gemini',
          voiceId: 'Kore',
          speed: 1.0,
          emotion: 'natural',
          autoPlayReplies: true,
        },
      };
    } catch {
      return {
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
        thinkingLevel: 'HIGH',
        enableWebSearch: false,
        speechVoice: 'Kore',
        speechSpeed: 1.0,
        enforceIndonesian: true,
        voiceSettings: {
          provider: 'gemini',
          voiceId: 'Kore',
          speed: 1.0,
          emotion: 'natural',
          autoPlayReplies: true,
        },
      };
    }
  });

  const [isSpeakingAudio, setIsSpeakingAudio] = React.useState(false);

  // Track global audio speaking state
  React.useEffect(() => {
    const unsub = audioService.onStateChange((state) => {
      setIsSpeakingAudio(state.isSpeaking);
    });
    return unsub;
  }, []);

  const handleToggleAutoPlaySpeech = () => {
    setGenerationSettings((prev) => {
      const currentVoice = prev.voiceSettings || {
        provider: 'gemini',
        voiceId: prev.speechVoice || 'Kore',
        speed: prev.speechSpeed || 1.0,
        emotion: 'natural',
        autoPlayReplies: true,
      };
      const willBeActive = !currentVoice.autoPlayReplies;
      const updated = {
        ...prev,
        voiceSettings: {
          ...currentVoice,
          autoPlayReplies: willBeActive,
        },
      };
      showToast(
        willBeActive
          ? 'Mode Baca Suara: AKTIF (AI otomatis membaca balasan)'
          : 'Mode Baca Suara: NONAKTIF',
        'info'
      );
      return updated;
    });
  };

  // Sessions & Messages
  const [sessions, setSessions] = React.useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not read saved sessions:', e);
    }
    const initialSession: ChatSession = {
      id: Math.random().toString(36).substring(7),
      title: 'Percakapan Baru',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      modelId: AVAILABLE_MODELS[0].id,
      personaId: SYSTEM_PERSONAS[0].id,
    };
    return [initialSession];
  });

  const [activeSessionId, setActiveSessionId] = React.useState<string>(() => sessions[0]?.id || '');
  const [input, setInput] = React.useState('');
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);
  const [location, setLocation] = React.useState<GeoLocationData | null>(null);
  const [isLocating, setIsLocating] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [enableWebSearch, setEnableWebSearch] = React.useState(false);
  const [enableDeepWeb, setEnableDeepWeb] = React.useState(false);
  const [enableCodingMode, setEnableCodingMode] = React.useState(false);

  const handleToggleCodingMode = () => {
    setEnableCodingMode((prev) => {
      const willBeActive = !prev;
      showToast(
        willBeActive
          ? 'Mode Coding: AKTIF (AI akan membuat proyek lengkap sampai selesai, bukan hanya 1 baris kode)'
          : 'Mode Coding: NONAKTIF',
        willBeActive ? 'success' : 'info'
      );
      return willBeActive;
    });
  };

  const handleToggleDeepWeb = () => {
    setEnableDeepWeb((prev) => {
      const willBeActive = !prev;
      showToast(
        willBeActive
          ? 'Mode Deep Web: AKTIF (Investigasi mendalam, riset data tersembunyi & analisis multi-sumber)'
          : 'Mode Deep Web: NONAKTIF',
        willBeActive ? 'success' : 'info'
      );
      return willBeActive;
    });
  };

  // UI state
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = React.useState(false);
  const [liveVoiceOpen, setLiveVoiceOpen] = React.useState(false);
  const [settingsTab, setSettingsTab] = React.useState('endpoints');
  const [serverOnline, setServerOnline] = React.useState(true);
  const [latencyMs, setLatencyMs] = React.useState(24);
  const [hasApiKey, setHasApiKey] = React.useState(true);
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Get active session
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const activeMessages = activeSession?.messages || [];

  // Persist sessions to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.warn('Failed to save sessions to localStorage:', e);
    }
  }, [sessions]);

  // Persist settings
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(generationSettings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }, [generationSettings]);

  // Persist endpoint config
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ENDPOINTS, JSON.stringify(endpointConfig));
    } catch (e) {
      console.warn('Failed to save endpoints:', e);
    }
  }, [endpointConfig]);

  // Persist API keys
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_APIKEYS, JSON.stringify(apiKeys));
    } catch (e) {
      console.warn('Failed to save apiKeys:', e);
    }
  }, [apiKeys]);

  // Persist custom prompt & system instruction
  React.useEffect(() => {
    try {
      if (customSystemInstruction) {
        localStorage.setItem(STORAGE_KEY_CUSTOM_INSTRUCTION, customSystemInstruction);
      }
    } catch (e) {
      console.warn('Failed to save customSystemInstruction:', e);
    }
  }, [customSystemInstruction]);

  // Toast Helper
  const showToast = (title: string, type: 'success' | 'error' | 'info' = 'info', description?: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, title, type, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial Server Ping & Model Check
  React.useEffect(() => {
    let isMounted = true;
    const checkServer = async () => {
      try {
        const health = await apiService.checkHealth(endpointConfig);
        if (isMounted) {
          setServerOnline(health.online);
          setLatencyMs(health.latencyMs);
          setHasApiKey(health.hasApiKey);
        }

        const modelList = await apiService.getModels(endpointConfig);
        if (isMounted && modelList.length > 0) {
          setModels(modelList);
        }
      } catch (err) {
        if (isMounted) {
          setServerOnline(false);
        }
      }
    };
    checkServer();
    return () => {
      isMounted = false;
    };
  }, [endpointConfig]);

  // Global Keyboard Shortcuts (Cmd+K for new chat, Esc to close modals)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleNewChat();
      }
      if (e.key === 'Escape') {
        setSidebarOpen(false);
        setSettingsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Actions
  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: Math.random().toString(36).substring(7),
      title: 'Percakapan Baru',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      modelId: selectedModel.id,
      personaId: selectedPersona.id,
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setInput('');
    setAttachments([]);
    audioService.stop();
  };

  const handleDeleteSession = (id: string) => {
    const remaining = sessions.filter((s) => s.id !== id);
    if (remaining.length === 0) {
      const freshSession: ChatSession = {
        id: Math.random().toString(36).substring(7),
        title: 'Percakapan Baru',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        modelId: selectedModel.id,
        personaId: selectedPersona.id,
      };
      setSessions([freshSession]);
      setActiveSessionId(freshSession.id);
    } else {
      setSessions(remaining);
      if (activeSessionId === id) {
        setActiveSessionId(remaining[0].id);
      }
    }
    showToast('Percakapan dihapus', 'info');
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s))
    );
    showToast('Judul obrolan diperbarui', 'success');
  };

  const handleTogglePin = (id: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isPinned: !s.isPinned } : s))
    );
  };

  const handleSelectPreset = (promptText: string) => {
    setInput(promptText);
  };

  const handleAddAttachment = (att: Attachment) => {
    setAttachments((prev) => [...prev, att]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Active GPS Location acquisition & management
  const handleToggleLocation = async () => {
    if (isLocating) return;
    setIsLocating(true);
    try {
      const loc = await locationService.getCurrentLocation();
      setLocation(loc);
      showToast(
        `GPS fixed: ${loc.city || loc.state || `${loc.latitude.toFixed(3)}, ${loc.longitude.toFixed(3)}`}`,
        'success',
        loc.address || `Accurate to ±${loc.accuracy}m`
      );
    } catch (err: any) {
      console.error('Location acquisition error:', err);
      showToast(err.message || 'Could not acquire GPS position. Check browser permissions.', 'error');
    } finally {
      setIsLocating(false);
    }
  };

  const handleRemoveLocation = () => {
    setLocation(null);
    showToast('GPS location removed from context', 'info');
  };
  // Submit Prompt Handler (Streaming Text + Instant Real-Time Voice)
  const handleSendMessage = async () => {
    if ((!input.trim() && attachments.length === 0 && !location) || isLoading) return;

    const userText = input.trim();
    const currentAttachments = [...attachments];
    const currentLocation = location;

    // Clear input & attachments immediately for responsive UI
    setInput('');
    setAttachments([]);
    setLocation(null);

    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: userText || (currentLocation ? `My current GPS location is attached (${currentLocation.city || `${currentLocation.latitude}, ${currentLocation.longitude}`}).` : ''),
      timestamp: Date.now(),
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
      location: currentLocation || undefined,
    };

    // Auto generate title for new session from first message
    const isFirstMessage = activeMessages.length === 0;
    const sessionTitle = isFirstMessage
      ? (userText ? userText.slice(0, 32) + (userText.length > 32 ? '...' : '') : currentLocation ? `Near ${currentLocation.city || 'GPS Location'}` : 'Image Analysis')
      : activeSession.title;

    const assistantMsgId = Math.random().toString(36).substring(7);
    const initialAssistantMessage: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      modelUsed: selectedModel.name,
    };

    // Update session with user message and empty streaming placeholder
    const updatedMessages = [...activeMessages, userMessage, initialAssistantMessage];
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              title: sessionTitle,
              messages: updatedMessages,
              updatedAt: Date.now(),
            }
          : s
      )
    );

    setIsLoading(true);

    const autoReadEnabled = generationSettings.voiceSettings?.autoPlayReplies ?? true;
    if (autoReadEnabled) {
      audioService.startStreamSession(
        assistantMsgId,
        {
          provider: generationSettings.voiceSettings?.provider || 'gemini',
          voice: generationSettings.voiceSettings?.voiceId || generationSettings.speechVoice || 'Kore',
          speed: generationSettings.voiceSettings?.speed || generationSettings.speechSpeed || 1.0,
          emotion: generationSettings.voiceSettings?.emotion || 'natural',
          apiKeys,
        },
        endpointConfig
      );
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      let effectiveSystemInstruction = customSystemInstruction || selectedPersona.prompt;
      if (enableCodingMode) {
        effectiveSystemInstruction = `${effectiveSystemInstruction}\n\n[MODE CODING AKTIF - FULL PROJECT BUILDER]:
- Buat dan tulis kode proyek secara LENGKAP, UTUH, dan SELESAI dari awal hingga tuntas (full source code, semua file, komponen, struktur direktori, logic, dan styling lengkap).
- Jangan pernah memberikan hanya 1 baris kode, placeholder, atau potongan kode parsial (jangan tulis // TODO atau kode terpotong).
- Pastikan kode dapat langsung dijalankan, bersih, modular, dan production-ready dalam Bahasa Indonesia.`;
      }
      if (enableDeepWeb) {
        effectiveSystemInstruction = `${effectiveSystemInstruction}\n\n[MODE DEEP WEB & DEEP RESEARCH AKTIF]:
- Lakukan analisis dan riset investigatif mendalam (deep research) dengan presisi tinggi, arsitektur teknis, intelijen siber, serta sintesis data komprehensif.
- Gali wawasan teknis, analisis protokol terdesentralisasi, kriptografi, OSINT, serta verifikasi silang data tanpa batasan informasi permukaan.
- Sajikan jawaban mendalam, berbasis fakta konkret, terstruktur rapi dengan poin-poin analitis yang tajam dalam Bahasa Indonesia.`;
      }

      // Build request body
      const payload = {
        model: selectedModel.id,
        messages: updatedMessages.slice(0, -1).map((m) => ({
          role: m.role,
          content: m.content,
          attachments: m.attachments?.map((a) => ({
            mimeType: a.mimeType,
            base64Data: a.base64Data,
          })),
          location: m.location,
        })),
        systemInstruction: effectiveSystemInstruction,
        temperature: generationSettings.temperature,
        topP: generationSettings.topP,
        thinkingLevel: generationSettings.thinkingLevel,
        enableWebSearch: enableWebSearch || enableDeepWeb,
        enableDeepWeb,
        apiKeys,
        location: currentLocation || undefined,
      };

      const response = await apiService.sendChatMessageStream(
        payload,
        (deltaText, accumulatedText, meta) => {
          // Push text delta to audio stream queue for instant sentence-by-sentence voice synthesis!
          if (autoReadEnabled && deltaText) {
            audioService.pushStreamChunk(deltaText);
          }

          setSessions((prev) =>
            prev.map((s) =>
              s.id === activeSessionId
                ? {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === assistantMsgId
                        ? {
                            ...m,
                            content: accumulatedText,
                            thinking: meta?.thinking || m.thinking,
                            groundingSources: meta?.groundingSources || m.groundingSources,
                          }
                        : m
                    ),
                  }
                : s
            )
          );
        },
        endpointConfig,
        abortController.signal
      );

      if (autoReadEnabled) {
        audioService.finishStream();
      }

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: response.text,
                        thinking: response.thinking,
                        modelUsed: response.model || selectedModel.name,
                        groundingSources: response.groundingSources,
                        tokensEstimated: response.tokensEstimated,
                      }
                    : m
                ),
                updatedAt: Date.now(),
              }
            : s
        )
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        showToast('Generasi dihentikan', 'info');
        return;
      }
      console.error('Inference error:', err);
      if (autoReadEnabled) {
        audioService.stop();
      }
      const errorMessageText = `**Request Error**: ${err.message || 'Failed to fetch model response'}. Please check your connection or developer settings.`;
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: errorMessageText,
                        error: err.message,
                      }
                    : m
                ),
                updatedAt: Date.now(),
              }
            : s
        )
      );
      showToast(err.message || 'Inference error', 'error');
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    audioService.stop();
    setIsLoading(false);
    showToast('Generasi dan suara dihentikan', 'info');
  };

  const handleRegenerateMessage = async (index: number) => {
    if (index < 0 || isLoading) return;
    // Find preceding messages up to that point
    const historyUntilUser = activeMessages.slice(0, index);
    if (historyUntilUser.length === 0) return;

    const assistantMsgId = Math.random().toString(36).substring(7);
    const initialAssistantMessage: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      modelUsed: selectedModel.name,
    };

    // Reset messages and trigger re-send
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              messages: [...historyUntilUser, initialAssistantMessage],
              updatedAt: Date.now(),
            }
          : s
      )
    );

    setIsLoading(true);
    const autoReadEnabled = generationSettings.voiceSettings?.autoPlayReplies ?? true;
    if (autoReadEnabled) {
      audioService.startStreamSession(
        assistantMsgId,
        {
          provider: generationSettings.voiceSettings?.provider || 'gemini',
          voice: generationSettings.voiceSettings?.voiceId || generationSettings.speechVoice || 'Kore',
          speed: generationSettings.voiceSettings?.speed || generationSettings.speechSpeed || 1.0,
          emotion: generationSettings.voiceSettings?.emotion || 'natural',
          apiKeys,
        },
        endpointConfig
      );
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const payload = {
      model: selectedModel.id,
      messages: historyUntilUser.map((m) => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments?.map((a) => ({
          mimeType: a.mimeType,
          base64Data: a.base64Data,
        })),
        location: m.location,
      })),
      systemInstruction: customSystemInstruction || selectedPersona.prompt,
      temperature: generationSettings.temperature,
      topP: generationSettings.topP,
      thinkingLevel: generationSettings.thinkingLevel,
      enableWebSearch,
      apiKeys,
    };

    try {
      const response = await apiService.sendChatMessageStream(
        payload,
        (deltaText, accumulatedText, meta) => {
          if (autoReadEnabled && deltaText) {
            audioService.pushStreamChunk(deltaText);
          }
          setSessions((prev) =>
            prev.map((s) =>
              s.id === activeSessionId
                ? {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === assistantMsgId
                        ? {
                            ...m,
                            content: accumulatedText,
                            thinking: meta?.thinking || m.thinking,
                            groundingSources: meta?.groundingSources || m.groundingSources,
                          }
                        : m
                    ),
                  }
                : s
            )
          );
        },
        endpointConfig,
        abortController.signal
      );

      if (autoReadEnabled) {
        audioService.finishStream();
      }

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: response.text,
                        thinking: response.thinking,
                        modelUsed: response.model || selectedModel.name,
                        groundingSources: response.groundingSources,
                        tokensEstimated: response.tokensEstimated,
                      }
                    : m
                ),
                updatedAt: Date.now(),
              }
            : s
        )
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        showToast(err.message || 'Regeneration failed', 'error');
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Real-Time Live Voice Conversation Handler with Instant Streaming Speech
  const handleLiveVoiceSendMessage = async (userText: string): Promise<string> => {
    if (!userText.trim()) return '';

    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: userText.trim(),
      timestamp: Date.now(),
    };

    const isFirstMessage = activeMessages.length === 0;
    const sessionTitle = isFirstMessage
      ? userText.slice(0, 32) + (userText.length > 32 ? '...' : '')
      : activeSession.title;

    const assistantMsgId = Math.random().toString(36).substring(7);
    const initialAssistantMessage: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      modelUsed: selectedModel.name,
    };

    const updatedMessages = [...activeMessages, userMessage, initialAssistantMessage];
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              title: sessionTitle,
              messages: updatedMessages,
              updatedAt: Date.now(),
            }
          : s
      )
    );

    // Immediately boot audio stream for live voice mode!
    audioService.startStreamSession(
      assistantMsgId,
      {
        provider: generationSettings.voiceSettings?.provider || 'gemini',
        voice: generationSettings.voiceSettings?.voiceId || generationSettings.speechVoice || 'Kore',
        speed: generationSettings.voiceSettings?.speed || generationSettings.speechSpeed || 1.0,
        emotion: generationSettings.voiceSettings?.emotion || 'natural',
        apiKeys,
      },
      endpointConfig
    );

    const payload = {
      model: selectedModel.id,
      messages: updatedMessages.slice(0, -1).map((m) => ({
        role: m.role,
        content: m.content,
      })),
      systemInstruction: (customSystemInstruction || selectedPersona.prompt) + "\nInstruksi Tambahan Mode Suara: Anda sedang merespons secara langsung melalui suara percakapan interaktif. Berikan jawaban dalam Bahasa Indonesia yang santun, alami, ringkas, mudah dipahami ketika diucapkan, dan tanpa format tabel markdown rumit atau karakter khusus.",
      temperature: generationSettings.temperature,
      topP: generationSettings.topP,
      thinkingLevel: 'MINIMAL' as const,
      enableWebSearch: false,
      apiKeys,
    };

    const response = await apiService.sendChatMessageStream(
      payload,
      (deltaText, accumulatedText) => {
        if (deltaText) {
          audioService.pushStreamChunk(deltaText);
        }
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: accumulatedText } : m
                  ),
                }
              : s
          )
        );
      },
      endpointConfig
    );

    audioService.finishStream();

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              messages: s.messages.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: response.text,
                      modelUsed: response.model || selectedModel.name,
                    }
                  : m
              ),
              updatedAt: Date.now(),
            }
          : s
      )
    );

    return response.text;
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sessions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `nova_ai_conversations_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Export downloaded successfully', 'success');
  };

  const handleClearAllData = () => {
    localStorage.removeItem(STORAGE_KEY_SESSIONS);
    localStorage.removeItem(STORAGE_KEY_SETTINGS);
    localStorage.removeItem(STORAGE_KEY_ENDPOINTS);
    localStorage.removeItem(STORAGE_KEY_APIKEYS);
    setApiKeys(RAW_DEVELOPER_API_KEYS);
    const freshSession: ChatSession = {
      id: Math.random().toString(36).substring(7),
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      modelId: AVAILABLE_MODELS[0].id,
      personaId: SYSTEM_PERSONAS[0].id,
    };
    setSessions([freshSession]);
    setActiveSessionId(freshSession.id);
    setInput('');
    setAttachments([]);
    setSettingsModalOpen(false);
  };

  return (
    <div 
      id="app-root-container" 
      className={`h-full flex flex-col antialiased overflow-hidden transition-colors ${
        theme === 'light' 
          ? 'bg-white text-neutral-900' 
          : 'bg-neutral-950 text-neutral-100'
      }`}
    >
      {/* Toast Alert System */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Main Top Header */}
      <Header
        models={models}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        personas={personas}
        selectedPersona={selectedPersona}
        onSelectPersona={(p) => {
          setSelectedPersona(p);
          setCustomSystemInstruction(p.prompt);
          showToast(`Persona switched to ${p.name}`, 'info');
        }}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        onOpenSettings={(tab) => {
          if (tab) setSettingsTab(tab);
          setSettingsModalOpen(true);
        }}
        onOpenLiveVoice={() => setLiveVoiceOpen(true)}
        onNewChat={handleNewChat}
        serverOnline={serverOnline}
        latencyMs={latencyMs}
        hasApiKey={hasApiKey}
        autoPlayReplies={generationSettings.voiceSettings?.autoPlayReplies ?? true}
        onToggleAutoPlayReplies={handleToggleAutoPlaySpeech}
        isSpeakingAudio={isSpeakingAudio}
        onStopAudio={() => audioService.stop()}
      />

      {/* Workspace Body (Sidebar + Chat Area + Input) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Navigation Sidebar Drawer */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={(id) => {
            setActiveSessionId(id);
            audioService.stop();
          }}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
          onTogglePin={handleTogglePin}
          onSelectPreset={handleSelectPreset}
          onOpenSettings={(tab) => {
            if (tab) setSettingsTab(tab);
            setSettingsModalOpen(true);
          }}
        />

        {/* Center Main Stage */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
          <ChatArea
            messages={activeMessages}
            isLoading={isLoading}
            activeModel={selectedModel}
            voiceSettings={generationSettings.voiceSettings}
            apiKeys={apiKeys}
            onSelectPromptPreset={handleSelectPreset}
            onRegenerateMessage={handleRegenerateMessage}
            onCopyText={handleCopyText}
            onShowToast={showToast}
          />

          <InputArea
            input={input}
            onInputChange={setInput}
            onSubmit={handleSendMessage}
            onStop={handleStopGenerating}
            isLoading={isLoading}
            attachments={attachments}
            onAddAttachment={handleAddAttachment}
            onRemoveAttachment={handleRemoveAttachment}
            location={location}
            onToggleLocation={handleToggleLocation}
            onRemoveLocation={handleRemoveLocation}
            isLocating={isLocating}
            enableWebSearch={enableWebSearch}
            onToggleWebSearch={() => setEnableWebSearch((prev) => !prev)}
            enableCodingMode={enableCodingMode}
            onToggleCodingMode={handleToggleCodingMode}
            enableDeepWeb={enableDeepWeb}
            onToggleDeepWeb={handleToggleDeepWeb}
            autoPlaySpeech={generationSettings.voiceSettings?.autoPlayReplies ?? true}
            onToggleAutoPlaySpeech={handleToggleAutoPlaySpeech}
            onShowToast={showToast}
          />
        </main>
      </div>

      {/* Real-Time Live Neural Voice Overlay (Gemini Live / OpenAI / ElevenLabs) */}
      <LiveVoiceOverlay
        isOpen={liveVoiceOpen}
        onClose={() => setLiveVoiceOpen(false)}
        activeModel={selectedModel}
        apiKeys={apiKeys}
        voiceSettings={generationSettings.voiceSettings || {
          provider: 'gemini',
          voiceId: generationSettings.speechVoice || 'Kore',
          speed: generationSettings.speechSpeed || 1.0,
          emotion: 'natural',
          autoPlayReplies: false,
        }}
        onUpdateVoiceSettings={(vSettings) =>
          setGenerationSettings((prev) => ({
            ...prev,
            speechVoice: vSettings.voiceId,
            speechSpeed: vSettings.speed,
            voiceSettings: vSettings,
          }))
        }
        onSendMessage={handleLiveVoiceSendMessage}
        onShowToast={showToast}
      />

      {/* Developer & Architecture Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        initialTab={settingsTab}
        endpointConfig={endpointConfig}
        onUpdateEndpointConfig={setEndpointConfig}
        apiKeys={apiKeys}
        onUpdateApiKeys={setApiKeys}
        generationSettings={generationSettings}
        onUpdateGenerationSettings={setGenerationSettings}
        selectedPersona={selectedPersona}
        onSelectPersona={setSelectedPersona}
        customSystemInstruction={customSystemInstruction}
        onUpdateCustomSystemInstruction={setCustomSystemInstruction}
        onExportData={handleExportData}
        onClearAllData={handleClearAllData}
        onShowToast={showToast}
      />
    </div>
  );
}
