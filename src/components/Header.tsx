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
  Plus
} from 'lucide-react';
import { ModelOption, SystemPersona } from '../config/endpoints';

interface HeaderProps {
  models: ModelOption[];
  selectedModel: ModelOption;
  onSelectModel: (model: ModelOption) => void;
  personas: SystemPersona[];
  selectedPersona: SystemPersona;
  onSelectPersona: (persona: SystemPersona) => void;
  onToggleSidebar: () => void;
  onOpenSettings: (initialTab?: string) => void;
  onNewChat: () => void;
  serverOnline: boolean;
  latencyMs: number;
  hasApiKey: boolean;
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
  onNewChat,
  serverOnline,
  latencyMs,
  hasApiKey,
}) => {
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
    <header id="main-header" className="h-14 sm:h-16 border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between z-30 shrink-0 select-none">
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
              className="absolute left-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="px-2 py-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Select Model
              </div>
              <div className="space-y-1">
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
                          {m.badge && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-neutral-800 text-neutral-300 border border-neutral-700/50">
                              {m.badge}
                            </span>
                          )}
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800/80 text-xs text-neutral-300 hover:text-neutral-100 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="font-medium text-neutral-300">{selectedPersona.name}</span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>

          {personaDropdownOpen && (
            <div
              id="persona-dropdown-menu"
              className="absolute left-0 top-full mt-2 w-64 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-2 z-50"
            >
              <div className="px-2 py-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Assistant Persona
              </div>
              <div className="space-y-1">
                {personas.map((p) => {
                  const isSelected = p.id === selectedPersona.id;
                  return (
                    <button
                      key={p.id}
                      id={`persona-option-${p.id}`}
                      onClick={() => {
                        onSelectPersona(p);
                        setPersonaDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl transition-colors text-xs flex flex-col ${
                        isSelected ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-300 hover:bg-neutral-850'
                      }`}
                    >
                      <span className="font-medium">{p.name}</span>
                      <span className="text-[11px] text-neutral-400">{p.role}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right section: System Status, Endpoints / Parameters, Settings */}
      <div className="flex items-center gap-1.5 sm:gap-2">
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
