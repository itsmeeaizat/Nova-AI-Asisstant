/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Menu, 
  Sparkles, 
  Settings, 
  Sliders, 
  Activity, 
  ChevronDown, 
  Bot,
  Plus,
  Radio,
  Volume2,
  Sun,
  Moon
} from 'lucide-react';
import { ModelOption, SystemPersona } from '../config/endpoints';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  models: ModelOption[];
  selectedModel: ModelOption;
  onSelectModel: (model: ModelOption) => void;
  personas: SystemPersona[];
  selectedPersona: SystemPersona;
  onSelectPersona: (persona: SystemPersona) => void;
  onToggleSidebar: () => void;
  onOpenSettings: (initialTab?: string) => void;
  onOpenLiveVoice?: () => void;
  onNewChat: () => void;
  serverOnline: boolean;
  latencyMs: number;
  hasApiKey: boolean;
  autoPlayReplies?: boolean;
  onToggleAutoPlayReplies?: () => void;
  isSpeakingAudio?: boolean;
  onStopAudio?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  models,
  selectedModel,
  onSelectModel,
  personas,
  selectedPersona,
  onSelectPersona,
  onToggleSidebar,
  onOpenSettings,
  onOpenLiveVoice,
  onNewChat,
  serverOnline,
  latencyMs,
  hasApiKey,
  autoPlayReplies,
  onToggleAutoPlayReplies,
  isSpeakingAudio,
  onStopAudio,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [modelDropdownOpen, setModelDropdownOpen] = React.useState(false);
  const [personaDropdownOpen, setPersonaDropdownOpen] = React.useState(false);

  const modelDropdownRef = React.useRef<HTMLDivElement>(null);
  const personaDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
      if (personaDropdownRef.current && !personaDropdownRef.current.contains(e.target as Node)) {
        setPersonaDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header 
      id="main-header" 
      className={`h-14 sm:h-16 border-b px-3 sm:px-6 flex items-center justify-between z-30 shrink-0 select-none transition-colors ${
        theme === 'light' 
          ? 'bg-white/90 border-neutral-200 text-neutral-900 shadow-xs' 
          : 'bg-neutral-950/80 border-neutral-800/80 text-neutral-100 backdrop-blur-md'
      }`}
    >
      {/* Left section: Sidebar toggle & Brand / Model picker */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <button
          id="btn-toggle-sidebar"
          onClick={onToggleSidebar}
          className="p-2 sm:p-2.5 rounded-xl text-neutral-300 hover:text-neutral-100 hover:bg-neutral-900 active:bg-neutral-800 transition-colors flex items-center justify-center"
          aria-label="Toggle navigation sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          id="btn-new-chat-mobile"
          onClick={onNewChat}
          className="sm:hidden p-2 rounded-xl text-neutral-300 hover:text-neutral-100 hover:bg-neutral-900 transition-colors"
          aria-label="New chat"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Model Selector Dropdown */}
        <div ref={modelDropdownRef} className="relative">
          <button
            id="btn-model-selector"
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-800 text-left transition-all text-neutral-100 group"
            aria-expanded={modelDropdownOpen}
            aria-label="Select AI Model"
          >
            <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-semibold tracking-tight leading-none truncate max-w-[120px] sm:max-w-[170px]">
                  {selectedModel.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-200 transition-transform" />
              </div>
            </div>
          </button>

          {modelDropdownOpen && (
            <div
              id="model-dropdown-menu"
              className="absolute left-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-[75vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-neutral-800/80 mb-2">
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Select AI Model & Provider
                </span>
                <button
                  onClick={() => {
                    setModelDropdownOpen(false);
                    onOpenSettings('apikeys');
                  }}
                  className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
                >
                  <Settings className="w-3 h-3" />
                  <span>Configure Keys</span>
                </button>
              </div>

              <div className="space-y-1.5 overflow-y-auto scrollbar-thin pr-1 flex-1">
                {models.map((m) => {
                  const isSelected = m.id === selectedModel.id;
                  return (
                    <button
                      key={m.id}
                      id={`model-option-${m.id}`}
                      onClick={() => {
                        onSelectModel(m);
                        setModelDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl flex items-start gap-3 transition-colors ${
                        isSelected 
                          ? 'bg-neutral-800 text-white font-medium border border-neutral-700/60' 
                          : 'text-neutral-300 hover:bg-neutral-850 hover:text-white'
                      }`}
                    >
                      <Bot className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-sky-400' : 'text-neutral-400'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs sm:text-sm font-medium">{m.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                            m.provider === 'anthropic' 
                              ? 'bg-amber-950/70 text-amber-300 border border-amber-800/50'
                              : m.provider === 'moonshot'
                              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/50'
                              : m.provider === 'openai'
                              ? 'bg-emerald-900/40 text-emerald-200 border border-emerald-700/40'
                              : m.provider === 'deepseek'
                              ? 'bg-blue-950/70 text-blue-300 border border-blue-800/50'
                              : m.provider === 'groq'
                              ? 'bg-orange-950/70 text-orange-300 border border-orange-800/50'
                              : 'bg-sky-950/70 text-sky-300 border border-sky-800/50'
                          }`}>
                            {m.badge || m.providerName}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">{m.tagline}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Persona quick switch (desktop) */}
        <div ref={personaDropdownRef} className="relative hidden md:block">
          <button
            id="btn-persona-selector"
            onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800/80 text-xs text-neutral-300 hover:text-neutral-100 transition-colors group"
            title="Pilih Karakter Persona AI"
          >
            <span className="text-xs">
              {selectedPersona.id === 'gen_z' ? '⚡' : selectedPersona.id === 'anak_kecil' ? '🧸' : selectedPersona.id === 'introvert' ? '🌙' : selectedPersona.id === 'developer' ? '💻' : selectedPersona.id === 'creative' ? '🎨' : selectedPersona.id === 'analyst' ? '📊' : '🤖'}
            </span>
            <span className="font-medium text-neutral-200">{selectedPersona.name}</span>
            <ChevronDown className="w-3 h-3 text-neutral-400 group-hover:text-neutral-200" />
          </button>

          {personaDropdownOpen && (
            <div
              id="persona-dropdown-menu"
              className="absolute left-0 top-full mt-2 w-72 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-2 py-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center justify-between border-b border-neutral-800/80 mb-1">
                <span>Preset Persona AI</span>
                <span className="text-[10px] text-emerald-400 font-medium">🇮🇩 Bahasa ID</span>
              </div>
              <div className="space-y-1">
                {personas.map((p) => {
                  const isSelected = p.id === selectedPersona.id;
                  const emoji = p.id === 'gen_z' ? '⚡' : p.id === 'anak_kecil' ? '🧸' : p.id === 'introvert' ? '🌙' : p.id === 'developer' ? '💻' : p.id === 'creative' ? '🎨' : p.id === 'analyst' ? '📊' : '🤖';
                  return (
                    <button
                      key={p.id}
                      id={`persona-option-${p.id}`}
                      onClick={() => {
                        onSelectPersona(p);
                        setPersonaDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl transition-colors text-xs flex flex-col gap-0.5 ${
                        isSelected 
                          ? 'bg-neutral-800 text-white font-medium border border-neutral-700/60' 
                          : 'text-neutral-300 hover:bg-neutral-850'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">{emoji}</span>
                          <span className="font-semibold text-neutral-100">{p.name}</span>
                        </div>
                        {p.badge && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-neutral-950 border border-neutral-800 text-neutral-400 font-medium">
                            {p.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-neutral-400 line-clamp-1">{p.role}</span>
                    </button>
                  );
                })}
              </div>
              <div className="pt-1.5 mt-1.5 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setPersonaDropdownOpen(false);
                    onOpenSettings('persona');
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-sky-400 hover:bg-neutral-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Kustomisasi Prompt & Persona...</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right section: System Status, Live Voice, Endpoints / Parameters, Settings */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Auto-Read Voice Toggle Button */}
        {onToggleAutoPlayReplies && (
          <button
            id="btn-toggle-autoread-voice"
            onClick={isSpeakingAudio && onStopAudio ? onStopAudio : onToggleAutoPlayReplies}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-xs ${
              isSpeakingAudio
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                : autoPlayReplies
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/30'
                : 'bg-neutral-900/60 text-neutral-400 border-neutral-800/80 hover:text-neutral-200 hover:bg-neutral-850'
            }`}
            title={
              isSpeakingAudio
                ? 'Sedang membacakan respon... Klik untuk menghentikan suara'
                : autoPlayReplies
                ? 'Mode Baca Suara: AKTIF (AI otomatis membaca setiap respon). Klik untuk menonaktifkan.'
                : 'Mode Baca Suara: NONAKTIF. Klik untuk mengaktifkan baca suara otomatis.'
            }
            aria-label="Toggle Auto-Read AI Replies"
          >
            {isSpeakingAudio ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
                <span className="hidden md:inline text-[11px] text-rose-300">Stop Suara</span>
              </>
            ) : (
              <>
                <Volume2 className={`w-3.5 h-3.5 ${autoPlayReplies ? 'text-indigo-400' : 'text-neutral-400'}`} />
                <span className="hidden md:inline text-[11px]">
                  {autoPlayReplies ? 'Baca Suara: ON' : 'Baca Suara: OFF'}
                </span>
              </>
            )}
          </button>
        )}

        {/* Live Neural Voice / Gemini Live Overlay Trigger */}
        {onOpenLiveVoice && (
          <button
            id="btn-open-live-voice"
            onClick={onOpenLiveVoice}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-800/60 hover:bg-indigo-900/80 text-indigo-300 hover:text-white transition-all text-xs font-semibold shadow-xs group"
            title="Start Gemini Live / Neural Real-Time Voice Conversation"
          >
            <Radio className="w-3.5 h-3.5 text-indigo-400 group-hover:animate-pulse" />
            <span className="hidden sm:inline">Live Voice</span>
          </button>
        )}

        {/* Latency & Health Indicator */}
        <button
          id="btn-health-indicator"
          onClick={() => onOpenSettings('telemetry')}
          className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg bg-neutral-900/60 border border-neutral-800/80 hover:bg-neutral-900 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
          title={`Server: ${serverOnline ? 'Connected' : 'Offline'} | Latency: ${latencyMs}ms`}
        >
          <span className={`w-2 h-2 rounded-full ${serverOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
          <span className="hidden sm:inline font-mono text-[11px]">
            {serverOnline ? `${latencyMs}ms` : 'Offline'}
          </span>
          <Activity className="w-3.5 h-3.5 text-neutral-400 hidden sm:inline" />
        </button>

        {/* Inference settings button */}
        <button
          id="btn-open-inference-params"
          onClick={() => onOpenSettings('parameters')}
          className="p-2 sm:p-2.5 rounded-xl text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900 transition-colors"
          aria-label="Inference parameters"
          title="Inference & Model Parameters"
        >
          <Sliders className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </button>

        {/* Theme Toggle Button (Light / Dark) */}
        <button
          id="btn-toggle-theme"
          onClick={toggleTheme}
          className={`p-2 sm:p-2.5 rounded-xl transition-colors ${
            theme === 'light'
              ? 'text-neutral-700 hover:bg-neutral-100'
              : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900'
          }`}
          aria-label="Toggle theme (Light / Dark)"
          title={theme === 'light' ? 'Ganti ke Mode Gelap' : 'Ganti ke Tema Putih (Light Mode)'}
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-neutral-700" />
          ) : (
            <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400" />
          )}
        </button>

        {/* Global Developer & Architecture Settings Button */}
        <button
          id="btn-open-settings"
          onClick={() => onOpenSettings('endpoints')}
          className="p-2 sm:p-2.5 rounded-xl text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900 transition-colors relative"
          aria-label="Architecture & Developer Settings"
          title="Architecture, Endpoints & Settings"
        >
          <Settings className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          {!hasApiKey && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400"></span>
          )}
        </button>
      </div>
    </header>
  );
};
