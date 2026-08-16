/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Sparkles, 
  Bot, 
  User, 
  Copy, 
  Check, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  ExternalLink, 
  Terminal, 
  Image as ImageIcon,
  ArrowDown,
  BrainCircuit,
  Globe,
  FileText,
  MapPin,
  Camera,
  Search,
  X,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Attachment, Message, VoiceSettings } from '../types/chat';
import { ModelOption, ApiKeysConfig } from '../config/endpoints';
import { audioService } from '../services/audioService';
import { LocationCard } from './LocationCard';
import { ImageLightbox } from './ImageLightbox';
import { PlaceMapList } from './PlaceMapCard';
import { extractPlacesFromMessage } from '../utils/placeExtractor';
import { useTheme } from '../context/ThemeContext';
import { TypewriterText } from './TypewriterText';

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  activeModel: ModelOption;
  voiceSettings?: VoiceSettings;
  apiKeys?: ApiKeysConfig;
  onSelectPromptPreset: (promptText: string) => void;
  onRegenerateMessage: (messageIndex: number) => void;
  onCopyText: (text: string) => void;
  onShowToast: (title: string, type?: 'success' | 'error' | 'info') => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isLoading,
  activeModel,
  voiceSettings,
  apiKeys,
  onSelectPromptPreset,
  onRegenerateMessage,
  onCopyText,
  onShowToast,
}) => {
  const { theme } = useTheme();
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = React.useState<string | null>(null);
  const [activeSpeechId, setActiveSpeechId] = React.useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [isLoadingSpeech, setIsLoadingSpeech] = React.useState(false);
  const [showScrollBottom, setShowScrollBottom] = React.useState(false);
  const [lightboxAttachment, setLightboxAttachment] = React.useState<Attachment | null>(null);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [matchCursor, setMatchCursor] = React.useState(0);

  const matchingMessages = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return messages
      .map((m, idx) => ({ message: m, index: idx }))
      .filter(({ message }) => message.content.toLowerCase().includes(q));
  }, [messages, searchQuery]);

  const handleJumpToMatch = (dir: 'next' | 'prev') => {
    if (matchingMessages.length === 0) return;
    let nextIdx = dir === 'next' ? matchCursor + 1 : matchCursor - 1;
    if (nextIdx >= matchingMessages.length) nextIdx = 0;
    if (nextIdx < 0) nextIdx = matchingMessages.length - 1;
    setMatchCursor(nextIdx);

    const targetMsg = matchingMessages[nextIdx];
    if (targetMsg) {
      const el = document.getElementById(`message-bubble-${targetMsg.message.id || targetMsg.index}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Subscribe to audio state
  React.useEffect(() => {
    const unsub = audioService.onStateChange((state) => {
      setIsSpeaking(state.isSpeaking);
      setIsLoadingSpeech(state.isLoading);
      setActiveSpeechId(state.activeMessageId);
    });
    return unsub;
  }, []);

  // Auto-scroll on new messages
  React.useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 180);
    }
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  const handleCopyMessage = (id: string, content: string) => {
    onCopyText(content);
    setCopiedId(id);
    onShowToast('Copied to clipboard', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyCodeBlock = (codeId: string, code: string) => {
    onCopyText(code);
    setCopiedCodeId(codeId);
    onShowToast('Code copied', 'success');
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleToggleSpeech = async (msg: Message) => {
    if (isSpeaking && activeSpeechId === msg.id) {
      audioService.stop();
      return;
    }

    try {
      await audioService.speakMessage(
        msg.content,
        {
          provider: voiceSettings?.provider || 'gemini',
          voice: voiceSettings?.voiceId || 'Kore',
          speed: voiceSettings?.speed || 1.0,
          emotion: voiceSettings?.emotion || 'natural',
          apiKeys,
        },
        msg.id
      );
    } catch (err: any) {
      onShowToast(err.message || 'Real-time neural audio playback failed', 'error');
    }
  };

  return (
    <div className={`flex-1 relative flex flex-col h-full overflow-hidden ${theme === 'light' ? 'bg-white text-neutral-900' : 'bg-neutral-950 text-neutral-100'}`}>
      {/* Top Search Bar & Toggle */}
      <div className="absolute top-3 right-4 sm:right-8 z-20 flex items-center gap-2">
        {!isSearchOpen ? (
          <button
            type="button"
            onClick={() => {
              setIsSearchOpen(true);
              setTimeout(() => searchInputRef.current?.focus(), 100);
            }}
            className={`p-2 rounded-xl border shadow-sm transition-all flex items-center gap-1.5 text-xs font-medium ${
              theme === 'light'
                ? 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
            }`}
            title="Cari pesan dalam percakapan"
            aria-label="Cari pesan"
          >
            <Search className="w-4 h-4 text-sky-500" />
            <span className="hidden sm:inline">Cari Pesan</span>
          </button>
        ) : (
          <div className={`p-2 rounded-2xl border shadow-lg flex items-center gap-2 w-72 sm:w-80 animate-in fade-in zoom-in-95 duration-150 ${
            theme === 'light'
              ? 'bg-white/95 backdrop-blur-md border-neutral-300 text-neutral-900'
              : 'bg-neutral-900/95 backdrop-blur-md border-neutral-700 text-neutral-100'
          }`}>
            <Search className="w-4 h-4 text-sky-500 shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setMatchCursor(0);
              }}
              placeholder="Cari kata di pesan..."
              className="bg-transparent border-none outline-none text-xs w-full placeholder:text-neutral-400"
            />
            {searchQuery && (
              <span className="text-[10px] text-neutral-400 shrink-0">
                {matchingMessages.length > 0 ? `${matchCursor + 1}/${matchingMessages.length}` : '0/0'}
              </span>
            )}
            {matchingMessages.length > 0 && (
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleJumpToMatch('prev')}
                  className="p-1 hover:bg-neutral-700/20 rounded-md transition-colors"
                  title="Pesan sebelumnya"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleJumpToMatch('next')}
                  className="p-1 hover:bg-neutral-700/20 rounded-md transition-colors"
                  title="Pesan berikutnya"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery('');
              }}
              className="p-1 hover:bg-neutral-700/20 rounded-md transition-colors text-neutral-400 hover:text-neutral-200 ml-0.5"
              title="Tutup pencarian"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Scrollable Message List */}
      <div
        id="messages-scroll-container"
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-12 lg:px-24 py-6 space-y-6 scrollbar-thin"
      >
        {messages.length === 0 ? (
          <WelcomeHero
            activeModel={activeModel}
            onSelectPrompt={onSelectPromptPreset}
          />
        ) : (
          messages.map((msg, index) => {
            const isAssistant = msg.role === 'assistant';
            const isUser = msg.role === 'user';
            const isMsgSpeaking = isSpeaking && activeSpeechId === msg.id;
            const detectedPlaces = isAssistant ? extractPlacesFromMessage(msg.content) : [];

            return (
              <div
                key={msg.id || index}
                id={`message-bubble-${msg.id || index}`}
                className={`flex gap-3 sm:gap-4 max-w-4xl mx-auto ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {/* Assistant Avatar */}
                {isAssistant && (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md text-white mt-1">
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                )}

                {/* Message Content Container */}
                <div
                  className={`flex flex-col gap-2 min-w-0 ${
                    isUser ? 'items-end max-w-[88%] sm:max-w-[80%]' : 'flex-1 max-w-full'
                  }`}
                >
                  {/* User Attachments Preview if any */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-1 justify-end">
                      {msg.attachments.map((att) => {
                        const isImage = att.mimeType.startsWith('image/');
                        return (
                          <div
                            key={att.id}
                            className={`p-1.5 rounded-xl border flex items-center gap-2 max-w-xs shadow-xs transition-all ${
                              theme === 'light'
                                ? 'bg-neutral-100 border-neutral-300 text-neutral-800'
                                : 'bg-neutral-900/90 border-neutral-800 text-neutral-200'
                            }`}
                          >
                            {isImage ? (
                              <button
                                type="button"
                                onClick={() => setLightboxAttachment(att)}
                                className="cursor-pointer overflow-hidden rounded-lg hover:opacity-90 transition-opacity"
                                title="Click to view full image"
                              >
                                <img
                                  src={att.dataUrl}
                                  alt={att.name}
                                  className="w-12 h-12 object-cover rounded-lg"
                                />
                              </button>
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-neutral-800 text-sky-400 flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                            )}
                            <div className="flex flex-col min-w-0 pr-2">
                              <span className="text-xs font-medium truncate">{att.name}</span>
                              <span className="text-[10px] text-neutral-400">
                                {(att.size / 1024).toFixed(1)} KB &bull; {att.mimeType.split('/')[1] || 'file'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Active GPS Location Card if attached */}
                  {msg.location && (
                    <div className="w-full flex justify-end">
                      <LocationCard
                        location={msg.location}
                        onShowToast={onShowToast}
                      />
                    </div>
                  )}

                  {/* Main Bubble */}
                  <div
                    className={`p-3.5 sm:p-5 rounded-2xl transition-all leading-relaxed text-sm ${
                      isUser
                        ? theme === 'light'
                          ? 'bg-white border border-neutral-300 text-neutral-900 rounded-tr-xs shadow-md font-medium'
                          : 'bg-neutral-800 border border-neutral-700 text-neutral-100 rounded-tr-xs shadow-md font-medium'
                        : theme === 'light'
                          ? 'bg-neutral-100 border border-neutral-200 text-neutral-900 rounded-tl-xs shadow-sm'
                          : 'bg-neutral-900/90 border border-neutral-800/90 text-neutral-100 rounded-tl-xs shadow-md'
                    }`}
                  >
                    {/* Assistant Thinking Section if any */}
                    {isAssistant && msg.thinking && (
                      <div className="mb-3 p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 text-xs text-neutral-400 font-mono flex items-start gap-2">
                        <BrainCircuit className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                        <div className="flex-1 whitespace-pre-wrap">{msg.thinking}</div>
                      </div>
                    )}

                    {/* Formatted Markdown Content */}
                    <div className="break-words space-y-3 font-normal leading-relaxed">
                      {isAssistant && isLoading && index === messages.length - 1 && !msg.content ? (
                        <div className="flex items-center gap-2 py-2 text-neutral-400 text-xs italic">
                          <span className="inline-flex gap-1">
                            <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </span>
                          <span>Nova sedang merumuskan jawaban...</span>
                        </div>
                      ) : (
                        <>
                          <TypewriterText
                            content={msg.content}
                            isStreaming={isAssistant && isLoading && index === messages.length - 1}
                            renderFormatted={(text) =>
                              renderFormattedContent(text, (codeId, code) =>
                                handleCopyCodeBlock(codeId, code)
                              )
                            }
                          />
                          {isAssistant && isLoading && index === messages.length - 1 && (
                            <span className="inline-block w-2.5 h-4 ml-1 bg-sky-400 animate-cursor-blink rounded-xs align-middle" />
                          )}
                        </>
                      )}
                    </div>

                    {/* Google Maps Tourist Place Cards & Previews */}
                    {isAssistant && detectedPlaces.length > 0 && (
                      <PlaceMapList
                        places={detectedPlaces}
                        onShowToast={onShowToast}
                      />
                    )}

                    {/* Grounding Sources / Citations */}
                    {isAssistant && msg.groundingSources && msg.groundingSources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-neutral-800 flex flex-col gap-1.5">
                        <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-sky-400" />
                          <span>Sources & Search Grounding</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {msg.groundingSources.map((source, sIdx) => (
                            <a
                              key={sIdx}
                              href={source.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-sky-300 text-xs flex items-center gap-1.5 transition-colors max-w-xs truncate"
                            >
                              <span className="truncate">{source.title || source.url}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Assistant Action Toolbar */}
                  {isAssistant && (
                    <div className="flex items-center gap-1 sm:gap-2 px-1 text-xs text-neutral-400">
                      {/* Copy message */}
                      <button
                        id={`btn-copy-msg-${msg.id || index}`}
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="p-1.5 rounded-lg hover:bg-neutral-900 hover:text-neutral-200 transition-colors flex items-center gap-1"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span className="text-[11px] hidden sm:inline">
                          {copiedId === msg.id ? 'Copied' : 'Copy'}
                        </span>
                      </button>

                      {/* Read aloud Neural Voice */}
                      <button
                        id={`btn-speak-msg-${msg.id || index}`}
                        onClick={() => handleToggleSpeech(msg)}
                        className={`p-1.5 rounded-lg hover:bg-neutral-900 transition-colors flex items-center gap-1 ${
                          isMsgSpeaking 
                            ? 'text-indigo-400 font-semibold bg-indigo-950/40 border border-indigo-800/40' 
                            : isLoadingSpeech && activeSpeechId === msg.id
                            ? 'text-amber-400 animate-pulse'
                            : 'hover:text-neutral-200'
                        }`}
                        title={isMsgSpeaking ? 'Stop neural audio' : 'Play neural audio voice'}
                      >
                        {isMsgSpeaking ? (
                          <VolumeX className="w-3.5 h-3.5" />
                        ) : (
                          <Volume2 className={`w-3.5 h-3.5 ${isLoadingSpeech && activeSpeechId === msg.id ? 'animate-spin' : ''}`} />
                        )}
                        <span className="text-[11px] hidden sm:inline">
                          {isMsgSpeaking ? 'Playing...' : isLoadingSpeech && activeSpeechId === msg.id ? 'Synthesizing...' : 'Voice'}
                        </span>
                      </button>

                      {/* Regenerate */}
                      <button
                        id={`btn-regenerate-msg-${msg.id || index}`}
                        onClick={() => onRegenerateMessage(index)}
                        className="p-1.5 rounded-lg hover:bg-neutral-900 hover:text-neutral-200 transition-colors flex items-center gap-1"
                        title="Regenerate answer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="text-[11px] hidden sm:inline">Retry</span>
                      </button>

                      {/* Meta info badge */}
                      {msg.modelUsed && (
                        <span className="ml-auto text-[10px] font-mono text-neutral-400 px-2 py-0.5 rounded bg-neutral-900/60 border border-neutral-800/60">
                          {msg.modelUsed}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {isUser && (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0 text-neutral-300 mt-1">
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Shimmer loading bubble during inference */}
        {isLoading && (
          <div className="flex gap-3 sm:gap-4 max-w-4xl mx-auto justify-start">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md text-white mt-1 animate-pulse">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-xs bg-neutral-900/90 border border-neutral-800/80 shadow-md flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span className="text-xs text-neutral-400 font-medium">Nova is processing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Scroll-to-Bottom Button */}
      {showScrollBottom && (
        <button
          id="btn-scroll-to-bottom"
          onClick={scrollToBottom}
          className="absolute bottom-4 right-6 p-2.5 rounded-full bg-neutral-850 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 shadow-xl transition-all hover:scale-105 active:scale-95"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Lightbox for viewing full-size images */}
      <ImageLightbox
        attachment={lightboxAttachment}
        onClose={() => setLightboxAttachment(null)}
      />
    </div>
  );
};

interface WelcomeHeroProps {
  activeModel: ModelOption;
  onSelectPrompt: (text: string) => void;
}

const WelcomeHero: React.FC<WelcomeHeroProps> = ({ activeModel, onSelectPrompt }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-8 select-none">
      {/* Brand Icon Badge */}
      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl text-white">
          <Sparkles className="w-8 h-8" />
        </div>
        <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-300 border border-neutral-700 text-[10px] font-mono font-semibold">
          v3.7
        </span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-100 tracking-tight">
        Apa yang bisa Nova bantu hari ini?
      </h1>
      <p className="text-xs sm:text-sm text-neutral-400 mt-2 max-w-md leading-relaxed">
        Didukung model mutakhir <strong className="text-neutral-200">{activeModel.name}</strong> dengan visi multimodal, unggah berkas, lokasi GPS aktif, dan suara neural cerdas.
      </p>

      {/* Quick Starter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full mt-8 text-left">
        <button
          onClick={() => onSelectPrompt('Apa saja rekomendasi tempat wisata, kafe populer, dan kuliner terbaik di sekitar lokasi GPS saya saat ini?')}
          className="p-3.5 rounded-2xl bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800/80 hover:border-emerald-800/60 transition-all text-xs flex flex-col gap-1 group shadow-xs"
        >
          <div className="flex items-center gap-2 font-medium text-neutral-200 group-hover:text-emerald-300">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Rekomendasi Sekitar & GPS Aktif</span>
          </div>
          <span className="text-neutral-400 line-clamp-2">
            Cari tempat menarik, rute, dan info lokal berdasarkan koordinat langsung.
          </span>
        </button>

        <button
          onClick={() => onSelectPrompt('Analisis gambar yang saya unggah ini secara detail, ekstrak teks yang ada di dalamnya, dan rangkum informasi utamanya.')}
          className="p-3.5 rounded-2xl bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800/80 hover:border-sky-800/60 transition-all text-xs flex flex-col gap-1 group shadow-xs"
        >
          <div className="flex items-center gap-2 font-medium text-neutral-200 group-hover:text-sky-300">
            <Camera className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Analisis Gambar & Vision Multimodal</span>
          </div>
          <span className="text-neutral-400 line-clamp-2">
            Ekstrak teks gambar (OCR), baca diagram, dan analisa foto secara presisi.
          </span>
        </button>

        <button
          onClick={() => onSelectPrompt('Jelaskan perbedaan mendasar antara arsitektur REST dan GraphQL lengkap dengan contoh kode praktis di TypeScript.')}
          className="p-3.5 rounded-2xl bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800/80 hover:border-neutral-700 transition-all text-xs flex flex-col gap-1 group shadow-xs"
        >
          <div className="flex items-center gap-2 font-medium text-neutral-200 group-hover:text-indigo-300">
            <Terminal className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Arsitektur Sistem & Kode Program</span>
          </div>
          <span className="text-neutral-400 line-clamp-2">
            Bahas perbandingan REST vs GraphQL beserta contoh implementasi kode.
          </span>
        </button>

        <button
          onClick={() => onSelectPrompt('Tolong buatkan ringkasan terstruktur dari dokumen ini, temukan poin penting, risiko, dan langkah tindak lanjutnya.')}
          className="p-3.5 rounded-2xl bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800/80 hover:border-neutral-700 transition-all text-xs flex flex-col gap-1 group shadow-xs"
        >
          <div className="flex items-center gap-2 font-medium text-neutral-200 group-hover:text-amber-300">
            <FileText className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Bedah Dokumen & Data Mendalam</span>
          </div>
          <span className="text-neutral-400 line-clamp-2">
            Analisis berkas PDF, log data, JSON, atau catatan dengan ringkasan tajam.
          </span>
        </button>
      </div>
    </div>
  );
};

// Formatted content parser for Markdown text and syntax-highlighted code blocks
function renderFormattedContent(content: string, onCopyCode: (id: string, code: string) => void): React.ReactNode {
  if (!content) return null;

  // Split by code blocks ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  let blockIdx = 0;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Render text before code block
    if (match.index > lastIndex) {
      const textBefore = content.substring(lastIndex, match.index);
      elements.push(
        <div key={`text-${lastIndex}`} className="space-y-2">
          {renderTextSegments(textBefore)}
        </div>
      );
    }

    const lang = match[1] || 'text';
    const code = match[2].replace(/\n$/, '');
    const codeId = `code-block-${blockIdx++}`;

    elements.push(
      <div
        key={codeId}
        className="my-3 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-md"
      >
        <div className="flex items-center justify-between px-3.5 py-1.5 bg-neutral-900/90 border-b border-neutral-800 text-xs">
          <span className="font-mono text-neutral-400 font-medium text-[11px] uppercase tracking-wider">{lang}</span>
          <button
            onClick={() => onCopyCode(codeId, code)}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <Copy className="w-3 h-3" />
            <span>Copy</span>
          </button>
        </div>
        <pre className="p-4 overflow-x-auto font-mono text-xs text-sky-100/90 leading-relaxed scrollbar-thin">
          <code>{code}</code>
        </pre>
      </div>
    );

    lastIndex = match.index + match[0].length;
  }

  // Render remaining text after last code block
  if (lastIndex < content.length) {
    const remainingText = content.substring(lastIndex);
    elements.push(
      <div key={`text-${lastIndex}`} className="space-y-2">
        {renderTextSegments(remainingText)}
      </div>
    );
  }

  return elements;
}

// Render regular paragraphs, lists, bold, inline code, and headers
function renderTextSegments(text: string): React.ReactNode[] {
  const paragraphs = text.split('\n\n');

  return paragraphs.map((para, pIdx) => {
    const lines = para.split('\n');

    // Check for bullet list
    if (lines.every(l => l.trim().startsWith('- ') || l.trim().startsWith('* ') || l.trim().startsWith('• '))) {
      return (
        <ul key={pIdx} className="list-disc list-inside space-y-1 my-1.5 pl-1 text-neutral-200">
          {lines.map((line, lIdx) => (
            <li key={lIdx} className="leading-relaxed">
              {renderInlineStyles(line.replace(/^[-*•]\s+/, ''))}
            </li>
          ))}
        </ul>
      );
    }

    // Check for numbered list
    if (lines.every(l => /^\d+\.\s+/.test(l.trim()))) {
      return (
        <ol key={pIdx} className="list-decimal list-inside space-y-1 my-1.5 pl-1 text-neutral-200">
          {lines.map((line, lIdx) => (
            <li key={lIdx} className="leading-relaxed">
              {renderInlineStyles(line.replace(/^\d+\.\s+/, ''))}
            </li>
          ))}
        </ol>
      );
    }

    // Check for header # or ## or ###
    if (lines[0].startsWith('### ')) {
      return (
        <h4 key={pIdx} className="text-sm font-bold text-neutral-100 mt-2 mb-1">
          {renderInlineStyles(lines[0].replace(/^###\s+/, ''))}
        </h4>
      );
    }
    if (lines[0].startsWith('## ')) {
      return (
        <h3 key={pIdx} className="text-base font-bold text-neutral-100 mt-3 mb-1">
          {renderInlineStyles(lines[0].replace(/^##\s+/, ''))}
        </h3>
      );
    }
    if (lines[0].startsWith('# ')) {
      return (
        <h2 key={pIdx} className="text-lg font-extrabold text-neutral-100 mt-3 mb-1">
          {renderInlineStyles(lines[0].replace(/^#\s+/, ''))}
        </h2>
      );
    }

    // Regular paragraph
    return (
      <p key={pIdx} className="leading-relaxed">
        {lines.map((line, lIdx) => (
          <React.Fragment key={lIdx}>
            {renderInlineStyles(line)}
            {lIdx < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </p>
    );
  });
}

function renderInlineStyles(text: string): React.ReactNode {
  // Replace inline `code` with styled span
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return parts.map((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-neutral-800 text-sky-300 font-mono text-xs font-medium border border-neutral-700/50"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-neutral-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={idx} className="italic text-neutral-300">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}
