/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  X, 
  Database, 
  Sliders, 
  Activity, 
  Shield, 
  Trash2, 
  Download, 
  Check, 
  Copy, 
  RefreshCw, 
  Terminal,
  Cpu,
  Volume2
} from 'lucide-react';
import { EndpointConfig, SystemPersona, SYSTEM_PERSONAS } from '../config/endpoints';
import { ApiLogEntry, GenerationSettings } from '../types/chat';
import { apiService } from '../services/apiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: string;
  endpointConfig: EndpointConfig;
  onUpdateEndpointConfig: (cfg: EndpointConfig) => void;
  generationSettings: GenerationSettings;
  onUpdateGenerationSettings: (settings: GenerationSettings) => void;
  selectedPersona: SystemPersona;
  onSelectPersona: (persona: SystemPersona) => void;
  customSystemInstruction: string;
  onUpdateCustomSystemInstruction: (val: string) => void;
  onExportData: () => void;
  onClearAllData: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'endpoints',
  endpointConfig,
  onUpdateEndpointConfig,
  generationSettings,
  onUpdateGenerationSettings,
  selectedPersona,
  onSelectPersona,
  customSystemInstruction,
  onUpdateCustomSystemInstruction,
  onExportData,
  onClearAllData,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = React.useState<string>(initialTab);
  const [logs, setLogs] = React.useState<ApiLogEntry[]>([]);
  const [isPinging, setIsPinging] = React.useState(false);
  const [pingResult, setPingResult] = React.useState<{ online: boolean; latency: number; hasApiKey: boolean } | null>(null);
  const [copiedLogs, setCopiedLogs] = React.useState(false);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  React.useEffect(() => {
    setLogs(apiService.getLogs());
    const unsub = apiService.onLogsChange((newLogs) => setLogs(newLogs));
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsPinging(true);
    setPingResult(null);
    try {
      const res = await apiService.checkHealth(endpointConfig);
      setPingResult({
        online: res.online,
        latency: res.latencyMs,
        hasApiKey: res.hasApiKey,
      });
      onShowToast(res.online ? `Connected (${res.latencyMs}ms)` : 'Server offline', res.online ? 'success' : 'error');
    } catch (err: any) {
      setPingResult({ online: false, latency: 0, hasApiKey: false });
      onShowToast(err.message || 'Connection test failed', 'error');
    } finally {
      setIsPinging(false);
    }
  };

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(JSON.stringify(logs, null, 2));
    setCopiedLogs(true);
    onShowToast('API logs copied as JSON', 'success');
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  return (
    <div
      id="settings-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150 select-none"
    >
      <div
        id="settings-modal-card"
        className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-800 flex items-center justify-center text-sky-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-100 leading-none">Settings & Architecture</h2>
              <p className="text-xs text-neutral-400 mt-0.5">Configure endpoints, parameters, and telemetry</p>
            </div>
          </div>
          <button
            id="btn-close-settings-modal"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 sm:px-6 pt-2 border-b border-neutral-800 flex gap-1 overflow-x-auto scrollbar-none shrink-0 bg-neutral-900/50">
          <TabButton
            id="tab-btn-endpoints"
            active={activeTab === 'endpoints'}
            onClick={() => setActiveTab('endpoints')}
            icon={<Database className="w-4 h-4" />}
            label="Endpoints & Architecture"
          />
          <TabButton
            id="tab-btn-parameters"
            active={activeTab === 'parameters'}
            onClick={() => setActiveTab('parameters')}
            icon={<Sliders className="w-4 h-4" />}
            label="Model Parameters"
          />
          <TabButton
            id="tab-btn-persona"
            active={activeTab === 'persona'}
            onClick={() => setActiveTab('persona')}
            icon={<Shield className="w-4 h-4" />}
            label="Personas & Instructions"
          />
          <TabButton
            id="tab-btn-telemetry"
            active={activeTab === 'telemetry'}
            onClick={() => setActiveTab('telemetry')}
            icon={<Activity className="w-4 h-4" />}
            label="API Telemetry"
            badge={logs.length > 0 ? String(logs.length) : undefined}
          />
          <TabButton
            id="tab-btn-data"
            active={activeTab === 'data'}
            onClick={() => setActiveTab('data')}
            icon={<Cpu className="w-4 h-4" />}
            label="Data & Storage"
          />
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 scrollbar-thin">
          {/* TAB 1: ENDPOINTS & ARCHITECTURE */}
          {activeTab === 'endpoints' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-200">Server Health & Connection</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Test live connectivity and latency with the backend API routes.
                  </p>
                </div>
                <button
                  id="btn-test-api-ping"
                  onClick={handleTestConnection}
                  disabled={isPinging}
                  className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-neutral-950 font-semibold text-xs transition-all flex items-center gap-1.5 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                  <span>{isPinging ? 'Testing...' : 'Test Connection'}</span>
                </button>
              </div>

              {pingResult && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
                    pingResult.online
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-800 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${pingResult.online ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                    <span>Status: {pingResult.online ? 'Online & Healthy' : 'Offline / Error'}</span>
                  </div>
                  <div className="flex items-center gap-4 font-mono">
                    <span>Latency: {pingResult.latency}ms</span>
                    <span>API Key: {pingResult.hasApiKey ? 'Configured' : 'Missing (Preview mode)'}</span>
                  </div>
                </div>
              )}

              {/* Endpoint Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Configured API Endpoints
                </h4>

                <div className="space-y-2">
                  <EndpointRow
                    method="POST"
                    path={`${endpointConfig.baseUrl}${endpointConfig.chatEndpoint}`}
                    description="Chat completion & multimodal vision inference via Gemini"
                  />
                  <EndpointRow
                    method="POST"
                    path={`${endpointConfig.baseUrl}${endpointConfig.speechEndpoint}`}
                    description="Text-to-Speech audio synthesis with Gemini TTS models"
                  />
                  <EndpointRow
                    method="GET"
                    path={`${endpointConfig.baseUrl}${endpointConfig.modelsEndpoint}`}
                    description="Retrieve available models list and capabilities"
                  />
                  <EndpointRow
                    method="GET"
                    path={`${endpointConfig.baseUrl}${endpointConfig.healthEndpoint}`}
                    description="Health check and service status ping"
                  />
                </div>
              </div>

              {/* Base URL and timeout overrides */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-medium text-neutral-300 block mb-1.5">
                    API Base URL Prefix
                  </label>
                  <input
                    type="text"
                    value={endpointConfig.baseUrl}
                    onChange={(e) =>
                      onUpdateEndpointConfig({ ...endpointConfig, baseUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-300 block mb-1.5">
                    Timeout (Milliseconds)
                  </label>
                  <input
                    type="number"
                    value={endpointConfig.timeoutMs}
                    onChange={(e) =>
                      onUpdateEndpointConfig({
                        ...endpointConfig,
                        timeoutMs: parseInt(e.target.value, 10) || 30000,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INFERENCE PARAMETERS */}
          {activeTab === 'parameters' && (
            <div className="space-y-5">
              {/* Temperature */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-neutral-200">
                    Temperature ({generationSettings.temperature.toFixed(2)})
                  </label>
                  <span className="text-[11px] text-neutral-400">
                    {generationSettings.temperature < 0.4
                      ? 'Precise & Deterministic'
                      : generationSettings.temperature > 1.0
                      ? 'Highly Creative'
                      : 'Balanced'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.05"
                  value={generationSettings.temperature}
                  onChange={(e) =>
                    onUpdateGenerationSettings({
                      ...generationSettings,
                      temperature: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-sky-400"
                />
              </div>

              {/* Top P */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-neutral-200">
                    Top-P Nucleus Sampling ({generationSettings.topP.toFixed(2)})
                  </label>
                  <span className="text-[11px] text-neutral-400">Diversity control</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={generationSettings.topP}
                  onChange={(e) =>
                    onUpdateGenerationSettings({
                      ...generationSettings,
                      topP: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-sky-400"
                />
              </div>

              {/* Thinking Level */}
              <div>
                <label className="text-xs font-medium text-neutral-200 block mb-2">
                  Gemini 3 Reasoning / Thinking Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['HIGH', 'LOW', 'MINIMAL'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() =>
                        onUpdateGenerationSettings({
                          ...generationSettings,
                          thinkingLevel: lvl,
                        })
                      }
                      className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                        generationSettings.thinkingLevel === lvl
                          ? 'bg-sky-500/20 border-sky-500/60 text-sky-300 font-semibold'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-neutral-400 mt-1.5">
                  HIGH enables deep multi-step step-by-step reasoning tokens for math and architecture.
                </p>
              </div>

              {/* TTS Voice Selector */}
              <div className="pt-2 border-t border-neutral-800">
                <label className="text-xs font-medium text-neutral-200 block mb-2 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Speech Voice & Speed</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['Kore', 'Zephyr', 'Puck', 'Fenrir', 'Charon'].map((voice) => (
                    <button
                      key={voice}
                      type="button"
                      onClick={() =>
                        onUpdateGenerationSettings({
                          ...generationSettings,
                          speechVoice: voice,
                        })
                      }
                      className={`p-2 rounded-xl border text-xs transition-all ${
                        generationSettings.speechVoice === voice
                          ? 'bg-neutral-800 border-sky-500/50 text-sky-300 font-medium'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {voice}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SYSTEM PERSONAS & INSTRUCTIONS */}
          {activeTab === 'persona' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
                  Preset System Personas
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SYSTEM_PERSONAS.map((p) => {
                    const isSelected = p.id === selectedPersona.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onSelectPersona(p);
                          onUpdateCustomSystemInstruction(p.prompt);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-neutral-800 border-sky-500/60 text-white shadow-xs'
                            : 'bg-neutral-950 border-neutral-800/80 text-neutral-300 hover:bg-neutral-850'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-xs">{p.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                        </div>
                        <p className="text-[11px] text-neutral-400 line-clamp-2">{p.role}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-200 block mb-1.5">
                  Active System Instruction
                </label>
                <textarea
                  rows={4}
                  value={customSystemInstruction}
                  onChange={(e) => onUpdateCustomSystemInstruction(e.target.value)}
                  placeholder="Enter custom instructions for Nova's behavior and tone..."
                  className="w-full p-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 leading-relaxed focus:outline-none focus:border-sky-500 scrollbar-thin"
                />
              </div>
            </div>
          )}

          {/* TAB 4: API TELEMETRY & LOGS */}
          {activeTab === 'telemetry' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Recent API Invocations ({logs.length})
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyLogs}
                    className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 flex items-center gap-1 transition-colors"
                  >
                    {copiedLogs ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLogs ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                  <button
                    onClick={() => apiService.clearLogs()}
                    className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-rose-950/60 hover:text-rose-300 text-xs text-neutral-400 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {logs.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-400 border border-dashed border-neutral-800 rounded-2xl">
                  No API calls logged yet. Send a prompt to view telemetry.
                </div>
              ) : (
                <div className="space-y-2 font-mono text-xs max-h-72 overflow-y-auto scrollbar-thin">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-850 flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.2 rounded font-bold ${
                              log.status === 200
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                                : log.status === 'PENDING'
                                ? 'bg-amber-950 text-amber-400'
                                : 'bg-rose-950 text-rose-400'
                            }`}
                          >
                            {log.status}
                          </span>
                          <span className="text-neutral-300 font-semibold">{log.method}</span>
                          <span className="text-neutral-400 truncate max-w-xs">{log.endpoint}</span>
                        </div>
                        {log.durationMs !== undefined && (
                          <span className="text-neutral-400">{log.durationMs}ms</span>
                        )}
                      </div>
                      {log.error && <p className="text-[11px] text-rose-400 break-words">{log.error}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: DATA & STORAGE */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-200">Export Conversation Data</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Download all chat sessions and message histories as a structured JSON backup.
                  </p>
                </div>
                <button
                  id="btn-export-backup-json"
                  onClick={onExportData}
                  className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-xs font-medium flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Backup (JSON)</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-rose-300">Clear Local Storage</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Permanently wipe all cached conversations, settings, and telemetry from this browser session.
                  </p>
                </div>
                <button
                  id="btn-wipe-all-data"
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all conversations and reset settings?')) {
                      onClearAllData();
                      onShowToast('All data cleared', 'info');
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Wipe All Data</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface TabButtonProps {
  id: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}

const TabButton: React.FC<TabButtonProps> = ({ id, active, onClick, icon, label, badge }) => (
  <button
    id={id}
    type="button"
    onClick={onClick}
    className={`px-3.5 py-2.5 rounded-t-xl text-xs font-medium transition-colors flex items-center gap-2 shrink-0 border-b-2 ${
      active
        ? 'border-sky-500 text-neutral-100 bg-neutral-800/40'
        : 'border-transparent text-neutral-400 hover:text-neutral-200'
    }`}
  >
    {icon}
    <span>{label}</span>
    {badge && (
      <span className="px-1.5 py-0.2 rounded-full bg-neutral-800 text-[10px] text-sky-400 font-mono">
        {badge}
      </span>
    )}
  </button>
);

interface EndpointRowProps {
  method: string;
  path: string;
  description: string;
}

const EndpointRow: React.FC<EndpointRowProps> = ({ method, path, description }) => (
  <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-850 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
    <div className="flex items-center gap-2 font-mono">
      <span
        className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
          method === 'POST' ? 'bg-sky-950 text-sky-400 border border-sky-800/60' : 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
        }`}
      >
        {method}
      </span>
      <span className="text-neutral-200 font-semibold">{path}</span>
    </div>
    <span className="text-[11px] text-neutral-400">{description}</span>
  </div>
);
