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
  Volume2,
  Key,
  Eye,
  EyeOff,
  ExternalLink,
  Sparkles,
  Server,
  FileCode
} from 'lucide-react';
import { ApiKeysConfig, EndpointConfig, SystemPersona, SYSTEM_PERSONAS, RAW_DEVELOPER_API_KEYS } from '../config/endpoints';
import { ApiLogEntry, GenerationSettings } from '../types/chat';
import { apiService } from '../services/apiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: string;
  endpointConfig: EndpointConfig;
  onUpdateEndpointConfig: (cfg: EndpointConfig) => void;
  apiKeys: ApiKeysConfig;
  onUpdateApiKeys: (keys: ApiKeysConfig) => void;
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
  initialTab = 'apikeys',
  endpointConfig,
  onUpdateEndpointConfig,
  apiKeys,
  onUpdateApiKeys,
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
  const [pingResult, setPingResult] = React.useState<{ online: boolean; latency: number; hasApiKey: boolean; providers?: Record<string, boolean> } | null>(null);
  const [copiedLogs, setCopiedLogs] = React.useState(false);
  const [copiedEnv, setCopiedEnv] = React.useState(false);
  const [visibleKeys, setVisibleKeys] = React.useState<Record<string, boolean>>({});

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

  const toggleKeyVisibility = (provider: string) => {
    setVisibleKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

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
      onShowToast(res.online ? `Server Connected (${res.latencyMs}ms)` : 'Server offline', res.online ? 'success' : 'error');
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

  const handleCopyEnvTemplate = () => {
    const template = `# AI Studio / Nova AI Assistant Environment Configuration
GEMINI_API_KEY="${apiKeys.geminiApiKey || ''}"
ANTHROPIC_API_KEY="${apiKeys.anthropicApiKey || ''}"
MOONSHOT_API_KEY="${apiKeys.moonshotApiKey || ''}"
OPENAI_API_KEY="${apiKeys.openaiApiKey || ''}"
DEEPSEEK_API_KEY="${apiKeys.deepseekApiKey || ''}"
GROQ_API_KEY="${apiKeys.groqApiKey || ''}"
OPENROUTER_API_KEY="${apiKeys.openrouterApiKey || ''}"
CUSTOM_API_KEY="${apiKeys.customApiKey || ''}"
CUSTOM_BASE_URL="${apiKeys.customBaseUrl || 'http://localhost:11434/v1'}"
`;
    navigator.clipboard.writeText(template);
    setCopiedEnv(true);
    onShowToast('.env configuration copied to clipboard', 'success');
    setTimeout(() => setCopiedEnv(false), 2000);
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
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-100 leading-none">Settings & AI Models</h2>
              <p className="text-xs text-neutral-400 mt-0.5">Configure API keys, model parameters, endpoints, and telemetry</p>
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
            id="tab-btn-apikeys"
            active={activeTab === 'apikeys'}
            onClick={() => setActiveTab('apikeys')}
            icon={<Key className="w-4 h-4" />}
            label="API Keys & Providers"
          />
          <TabButton
            id="tab-btn-parameters"
            active={activeTab === 'parameters'}
            onClick={() => setActiveTab('parameters')}
            icon={<Sliders className="w-4 h-4" />}
            label="Inference & Voice"
          />
          <TabButton
            id="tab-btn-persona"
            active={activeTab === 'persona'}
            onClick={() => setActiveTab('persona')}
            icon={<Shield className="w-4 h-4" />}
            label="Personas & Instructions"
          />
          <TabButton
            id="tab-btn-endpoints"
            active={activeTab === 'endpoints'}
            onClick={() => setActiveTab('endpoints')}
            icon={<Database className="w-4 h-4" />}
            label="Endpoints & Architecture"
          />
          <TabButton
            id="tab-btn-telemetry"
            active={activeTab === 'telemetry'}
            onClick={() => setActiveTab('telemetry')}
            icon={<Activity className="w-4 h-4" />}
            label="Telemetry"
            badge={logs.length > 0 ? String(logs.length) : undefined}
          />
          <TabButton
            id="tab-btn-data"
            active={activeTab === 'data'}
            onClick={() => setActiveTab('data')}
            icon={<Cpu className="w-4 h-4" />}
            label="Storage"
          />
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 scrollbar-thin">
          
          {/* TAB: API KEYS & PROVIDERS */}
          {activeTab === 'apikeys' && (
            <div className="space-y-6">
              {/* Notice Banner */}
              <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                    <span>Multi-Provider Key Configuration</span>
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                    Set keys dynamically in this panel, or in the workspace raw files (<code className="text-sky-300 font-mono">.env</code> or <code className="text-sky-300 font-mono">src/config/endpoints.ts</code>).
                  </p>
                </div>
                <button
                  id="btn-copy-env-snippet"
                  onClick={handleCopyEnvTemplate}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEnv ? 'Copied .env' : 'Copy .env snippet'}</span>
                </button>
              </div>

              {/* Provider Key Inputs Grid */}
              <div className="space-y-4">
                {/* 1. Google Gemini */}
                <ApiKeyInputCard
                  id="input-key-gemini"
                  title="Google Gemini (3.7 Flash, 3.1 Pro, Flash)"
                  badge="Google AI"
                  badgeColor="bg-sky-950/70 text-sky-300 border-sky-800/50"
                  envVarName="GEMINI_API_KEY"
                  value={apiKeys.geminiApiKey || ''}
                  onChange={(val) => onUpdateApiKeys({ ...apiKeys, geminiApiKey: val })}
                  isVisible={Boolean(visibleKeys['gemini'])}
                  onToggleVisible={() => toggleKeyVisibility('gemini')}
                  portalUrl="https://aistudio.google.com/app/apikey"
                  portalLabel="Get Gemini Key"
                  placeholder="AIzaSy..."
                />

                {/* 2. Anthropic Claude */}
                <ApiKeyInputCard
                  id="input-key-anthropic"
                  title="Anthropic Claude (3.7 Sonnet, 3.5 Sonnet, Haiku, Opus)"
                  badge="Anthropic"
                  badgeColor="bg-amber-950/70 text-amber-300 border-amber-800/50"
                  envVarName="ANTHROPIC_API_KEY"
                  value={apiKeys.anthropicApiKey || ''}
                  onChange={(val) => onUpdateApiKeys({ ...apiKeys, anthropicApiKey: val })}
                  isVisible={Boolean(visibleKeys['anthropic'])}
                  onToggleVisible={() => toggleKeyVisibility('anthropic')}
                  portalUrl="https://console.anthropic.com/settings/keys"
                  portalLabel="Anthropic Console"
                  placeholder="sk-ant-api03-..."
                />

                {/* 3. Moonshot AI / Kimi */}
                <ApiKeyInputCard
                  id="input-key-moonshot"
                  title="Moonshot AI / Kimi (Kimi K3 128k, K1.5 32k)"
                  badge="Kimi / Moonshot"
                  badgeColor="bg-emerald-950/70 text-emerald-300 border-emerald-800/50"
                  envVarName="MOONSHOT_API_KEY"
                  value={apiKeys.moonshotApiKey || ''}
                  onChange={(val) => onUpdateApiKeys({ ...apiKeys, moonshotApiKey: val })}
                  isVisible={Boolean(visibleKeys['moonshot'])}
                  onToggleVisible={() => toggleKeyVisibility('moonshot')}
                  portalUrl="https://platform.moonshot.cn/console/api-keys"
                  portalLabel="Moonshot Console"
                  placeholder="sk-..."
                />

                {/* 4. OpenAI */}
                <ApiKeyInputCard
                  id="input-key-openai"
                  title="OpenAI (GPT-4o, GPT-4o Mini, o1, o3-mini)"
                  badge="OpenAI"
                  badgeColor="bg-emerald-900/40 text-emerald-200 border-emerald-700/40"
                  envVarName="OPENAI_API_KEY"
                  value={apiKeys.openaiApiKey || ''}
                  onChange={(val) => onUpdateApiKeys({ ...apiKeys, openaiApiKey: val })}
                  isVisible={Boolean(visibleKeys['openai'])}
                  onToggleVisible={() => toggleKeyVisibility('openai')}
                  portalUrl="https://platform.openai.com/api-keys"
                  portalLabel="OpenAI Platform"
                  placeholder="sk-proj-..."
                />

                {/* 5. DeepSeek */}
                <ApiKeyInputCard
                  id="input-key-deepseek"
                  title="DeepSeek (DeepSeek R1 Reasoning, DeepSeek V3)"
                  badge="DeepSeek"
                  badgeColor="bg-blue-950/70 text-blue-300 border-blue-800/50"
                  envVarName="DEEPSEEK_API_KEY"
                  value={apiKeys.deepseekApiKey || ''}
                  onChange={(val) => onUpdateApiKeys({ ...apiKeys, deepseekApiKey: val })}
                  isVisible={Boolean(visibleKeys['deepseek'])}
                  onToggleVisible={() => toggleKeyVisibility('deepseek')}
                  portalUrl="https://platform.deepseek.com/api_keys"
                  portalLabel="DeepSeek Platform"
                  placeholder="sk-..."
                />

                {/* 6. Groq / OpenRouter */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ApiKeyInputCard
                    id="input-key-groq"
                    title="Groq (Llama 3.3 70B 500tok/s)"
                    badge="Groq"
                    badgeColor="bg-orange-950/70 text-orange-300 border-orange-800/50"
                    envVarName="GROQ_API_KEY"
                    value={apiKeys.groqApiKey || ''}
                    onChange={(val) => onUpdateApiKeys({ ...apiKeys, groqApiKey: val })}
                    isVisible={Boolean(visibleKeys['groq'])}
                    onToggleVisible={() => toggleKeyVisibility('groq')}
                    portalUrl="https://console.groq.com/keys"
                    portalLabel="Groq Console"
                    placeholder="gsk_..."
                  />

                  <ApiKeyInputCard
                    id="input-key-openrouter"
                    title="OpenRouter (Universal Router)"
                    badge="OpenRouter"
                    badgeColor="bg-purple-950/70 text-purple-300 border-purple-800/50"
                    envVarName="OPENROUTER_API_KEY"
                    value={apiKeys.openrouterApiKey || ''}
                    onChange={(val) => onUpdateApiKeys({ ...apiKeys, openrouterApiKey: val })}
                    isVisible={Boolean(visibleKeys['openrouter'])}
                    onToggleVisible={() => toggleKeyVisibility('openrouter')}
                    portalUrl="https://openrouter.ai/keys"
                    portalLabel="OpenRouter"
                    placeholder="sk-or-v1-..."
                  />
                </div>

                {/* 7. Custom Endpoint / Ollama / Local */}
                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-850 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-sky-400" />
                      <span className="text-xs font-semibold text-neutral-200">Custom / Self-Hosted Endpoint (Ollama / vLLM)</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-neutral-800 text-neutral-300 border border-neutral-700">
                      OpenAI Compatible
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-medium text-neutral-400 block mb-1">Base URL</label>
                      <input
                        type="text"
                        value={apiKeys.customBaseUrl || ''}
                        placeholder="http://localhost:11434/v1"
                        onChange={(e) => onUpdateApiKeys({ ...apiKeys, customBaseUrl: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 font-mono focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-neutral-400 block mb-1">Model Name</label>
                      <input
                        type="text"
                        value={apiKeys.customModelName || ''}
                        placeholder="llama3.2"
                        onChange={(e) => onUpdateApiKeys({ ...apiKeys, customModelName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 font-mono focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: INFERENCE & VOICE PARAMETERS */}
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
                  Extended Reasoning / Thinking Level (Gemini 3, Claude 3.7, DeepSeek R1, Kimi K3)
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
                  HIGH enables step-by-step reasoning tokens for Claude 3.7 Sonnet, DeepSeek R1, and Gemini 3 Pro.
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

          {/* TAB: SYSTEM PERSONAS & INSTRUCTIONS */}
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

          {/* TAB: ENDPOINTS & ARCHITECTURE */}
          {activeTab === 'endpoints' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-200">Server Health & Latency Test</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Test live connectivity with the backend multi-model routing endpoints.
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
                    <span>Status: {pingResult.online ? 'Online & Multi-Model Ready' : 'Offline / Error'}</span>
                  </div>
                  <div className="flex items-center gap-4 font-mono">
                    <span>Latency: {pingResult.latency}ms</span>
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
                    description="Multi-model chat completion & vision (Gemini, Claude, Kimi, OpenAI, DeepSeek, Groq)"
                  />
                  <EndpointRow
                    method="POST"
                    path={`${endpointConfig.baseUrl}${endpointConfig.speechEndpoint}`}
                    description="Text-to-Speech audio synthesis with Gemini TTS models"
                  />
                  <EndpointRow
                    method="GET"
                    path={`${endpointConfig.baseUrl}${endpointConfig.modelsEndpoint}`}
                    description="Retrieve available models catalogue and specs"
                  />
                  <EndpointRow
                    method="GET"
                    path={`${endpointConfig.baseUrl}${endpointConfig.healthEndpoint}`}
                    description="Health check and active provider status ping"
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
                        timeoutMs: parseInt(e.target.value, 10) || 45000,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: API TELEMETRY & LOGS */}
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

          {/* TAB: DATA & STORAGE */}
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
                    Permanently wipe all cached conversations, saved API keys, and settings from this browser session.
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

interface ApiKeyInputCardProps {
  id: string;
  title: string;
  badge: string;
  badgeColor: string;
  envVarName: string;
  value: string;
  onChange: (val: string) => void;
  isVisible: boolean;
  onToggleVisible: () => void;
  portalUrl: string;
  portalLabel: string;
  placeholder?: string;
}

const ApiKeyInputCard: React.FC<ApiKeyInputCardProps> = ({
  id,
  title,
  badge,
  badgeColor,
  envVarName,
  value,
  onChange,
  isVisible,
  onToggleVisible,
  portalUrl,
  portalLabel,
  placeholder,
}) => (
  <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-850 space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-neutral-200">{title}</span>
        <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono border ${badgeColor}`}>
          {badge}
        </span>
      </div>
      <a
        href={portalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
      >
        <span>{portalLabel}</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>

    <div className="relative flex items-center">
      <input
        id={id}
        type={isVisible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || `Enter ${envVarName}...`}
        className="w-full pr-10 pl-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 font-mono focus:outline-none focus:border-sky-500 transition-colors"
      />
      <button
        type="button"
        onClick={onToggleVisible}
        className="absolute right-2.5 text-neutral-400 hover:text-neutral-200 transition-colors"
        aria-label={isVisible ? 'Hide key' : 'Show key'}
      >
        {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
    <div className="flex items-center justify-between text-[10px] text-neutral-400">
      <span>Raw env var: <code className="font-mono text-neutral-300">{envVarName}</code></span>
      <span>{value ? '✓ Key stored in session' : 'Uses .env or simulated fallback'}</span>
    </div>
  </div>
);

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
