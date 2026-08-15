/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Nova AI Assistant - API Endpoint, Model Catalog & Architecture Configuration
 * 
 * This file serves as the centralized, modular configuration for all backend 
 * communication endpoints, supported AI providers (Gemini, Claude, Kimi, OpenAI, DeepSeek, Groq),
 * and API key configurations.
 * 
 * Developers can set API keys directly in this raw file, in the `.env` file, 
 * or dynamically inside the app's Settings Panel.
 */

export type ModelProvider = 
  | 'google' 
  | 'anthropic' 
  | 'moonshot' 
  | 'openai' 
  | 'deepseek' 
  | 'groq' 
  | 'openrouter' 
  | 'custom';

export interface EndpointConfig {
  baseUrl: string;
  chatEndpoint: string;
  visionEndpoint: string;
  speechEndpoint: string;
  modelsEndpoint: string;
  healthEndpoint: string;
  timeoutMs: number;
  maxRetries: number;
}

export const DEFAULT_ENDPOINT_CONFIG: EndpointConfig = {
  baseUrl: '/api',
  chatEndpoint: '/chat',
  visionEndpoint: '/vision',
  speechEndpoint: '/speech',
  modelsEndpoint: '/models',
  healthEndpoint: '/health',
  timeoutMs: 60000,
  maxRetries: 2,
};

export interface ApiKeysConfig {
  geminiApiKey?: string;
  anthropicApiKey?: string;
  moonshotApiKey?: string;
  openaiApiKey?: string;
  deepseekApiKey?: string;
  groqApiKey?: string;
  openrouterApiKey?: string;
  customApiKey?: string;
  customBaseUrl?: string;
  customModelName?: string;
}

/**
 * RAW / HARDCODED API KEYS CONFIGURATION
 * Developers can optionally paste or override raw keys directly here in code:
 */
export const RAW_DEVELOPER_API_KEYS: ApiKeysConfig = {
  geminiApiKey: '',
  anthropicApiKey: '',
  moonshotApiKey: '',
  openaiApiKey: '',
  deepseekApiKey: '',
  groqApiKey: '',
  openrouterApiKey: '',
  customApiKey: '',
  customBaseUrl: 'http://localhost:11434/v1',
  customModelName: 'llama3.2',
};

export interface ModelOption {
  id: string;
  name: string;
  provider: ModelProvider;
  providerName: string;
  tagline: string;
  badge: string;
  description: string;
  contextWindow?: string;
  supportsVision: boolean;
  supportsAudio: boolean;
  supportsThinking: boolean;
  isDefault?: boolean;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  // GOOGLE GEMINI SERIES
  {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash',
    provider: 'google',
    providerName: 'Google AI',
    tagline: 'Adaptive reasoning & high-speed multimodal',
    badge: 'Recommended',
    description: 'Flagship model with hybrid step-by-step thinking, web grounding, and multimodal reasoning.',
    contextWindow: '1M tokens',
    supportsVision: true,
    supportsAudio: true,
    supportsThinking: true,
    isDefault: true,
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    provider: 'google',
    providerName: 'Google AI',
    tagline: 'Deep STEM reasoning & coding audits',
    badge: 'Pro Reasoning',
    description: 'Deep mathematical analysis, multi-step problem solving, architecture design, and complex code audits.',
    contextWindow: '2M tokens',
    supportsVision: true,
    supportsAudio: false,
    supportsThinking: true,
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash Latest',
    provider: 'google',
    providerName: 'Google AI',
    tagline: 'Ultra-low latency conversational engine',
    badge: 'Ultra Fast',
    description: 'Optimized for instant dialogue, code generation, summarization, and quick questions.',
    contextWindow: '1M tokens',
    supportsVision: true,
    supportsAudio: true,
    supportsThinking: false,
  },

  // ANTHROPIC CLAUDE SERIES
  {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet',
    provider: 'anthropic',
    providerName: 'Anthropic',
    tagline: 'Hybrid reasoning & exceptional code synthesis',
    badge: 'New SOTA',
    description: 'Anthropic’s most intelligent hybrid model with extended thinking mode and unmatched software engineering capabilities.',
    contextWindow: '200k tokens',
    supportsVision: true,
    supportsAudio: false,
    supportsThinking: true,
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    providerName: 'Anthropic',
    tagline: 'Industry benchmark for coding & vision',
    badge: 'Top Pick',
    description: 'Superior coding, multi-step reasoning, and visual diagram interpretation.',
    contextWindow: '200k tokens',
    supportsVision: true,
    supportsAudio: false,
    supportsThinking: false,
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    providerName: 'Anthropic',
    tagline: 'Lightning fast & cost-efficient intelligence',
    badge: 'Fast',
    description: 'Blazing fast inference speed matching previous generation frontier models.',
    contextWindow: '200k tokens',
    supportsVision: true,
    supportsAudio: false,
    supportsThinking: false,
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    providerName: 'Anthropic',
    tagline: 'Deep comprehension for complex prose',
    badge: 'Deep Prose',
    description: 'High contextual fluency for extensive writing, philosophical analysis, and nuanced document synthesis.',
    contextWindow: '200k tokens',
    supportsVision: true,
    supportsAudio: false,
    supportsThinking: false,
  },

  // MOONSHOT AI / KIMI SERIES
  {
    id: 'kimi-k3',
    name: 'Kimi K3 (Moonshot v1 128k)',
    provider: 'moonshot',
    providerName: 'Moonshot AI / Kimi',
    tagline: 'Ultra long context reasoning & Chinese/English bilingual',
    badge: 'Kimi K3',
    description: 'Frontier Moonshot Kimi model with massive 128k token context window, deep research comprehension, and bilingual synthesis.',
    contextWindow: '128k tokens',
    supportsVision: false,
    supportsAudio: false,
    supportsThinking: true,
  },
  {
    id: 'kimi-k1.5',
    name: 'Kimi K1.5 (Moonshot v1 32k)',
    provider: 'moonshot',
    providerName: 'Moonshot AI / Kimi',
    tagline: 'Fast long-context document analysis',
    badge: 'Kimi 32k',
    description: 'High-speed 32,000 token context window tailored for PDF parsing, contracts, and multi-file codebases.',
    contextWindow: '32k tokens',
    supportsVision: false,
    supportsAudio: false,
    supportsThinking: false,
  },

  // OPENAI SERIES
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    providerName: 'OpenAI',
    tagline: 'Omnimodel with high multimodal precision',
    badge: 'Omni',
    description: 'OpenAI’s flagship omnimodel with strong general intelligence, vision, and multilingual abilities.',
    contextWindow: '128k tokens',
    supportsVision: true,
    supportsAudio: false,
    supportsThinking: false,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    providerName: 'OpenAI',
    tagline: 'Fast, lightweight & highly capable',
    badge: 'Mini',
    description: 'Cost-efficient and fast model suitable for everyday inquiries, classification, and drafting.',
    contextWindow: '128k tokens',
    supportsVision: true,
    supportsAudio: false,
    supportsThinking: false,
  },
  {
    id: 'o3-mini',
    name: 'OpenAI o3-mini',
    provider: 'openai',
    providerName: 'OpenAI',
    tagline: 'High-speed STEM & coding reasoning',
    badge: 'Reasoning',
    description: 'Specialized reasoning model delivering top-tier performance for coding and competitive math.',
    contextWindow: '200k tokens',
    supportsVision: false,
    supportsAudio: false,
    supportsThinking: true,
  },

  // DEEPSEEK SERIES
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek R1',
    provider: 'deepseek',
    providerName: 'DeepSeek',
    tagline: 'Open-weight deep reasoning & chain-of-thought',
    badge: 'R1 Reasoning',
    description: 'DeepSeek R1 reasoning model outputting comprehensive step-by-step thinking processes for coding and logic.',
    contextWindow: '64k tokens',
    supportsVision: false,
    supportsAudio: false,
    supportsThinking: true,
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'deepseek',
    providerName: 'DeepSeek',
    tagline: 'High performance general architecture & coding',
    badge: 'DeepSeek V3',
    description: 'DeepSeek V3 MoE model with 671B total parameters offering rapid responses and coding acumen.',
    contextWindow: '64k tokens',
    supportsVision: false,
    supportsAudio: false,
    supportsThinking: false,
  },

  // OPEN SOURCE / GROQ / CUSTOM
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B (Groq)',
    provider: 'groq',
    providerName: 'Meta / Groq',
    tagline: 'Blazing fast 500+ tokens/sec on LPUs',
    badge: '500 tok/s',
    description: 'Meta’s latest Llama 3.3 70B running on Groq LPU hardware for near-instantaneous output.',
    contextWindow: '128k tokens',
    supportsVision: false,
    supportsAudio: false,
    supportsThinking: false,
  },
  {
    id: 'custom-openai-compatible',
    name: 'Custom Endpoint / Ollama',
    provider: 'custom',
    providerName: 'Self-Hosted / Custom',
    tagline: 'Connect local Ollama, LM Studio, vLLM, or custom proxy',
    badge: 'Custom URL',
    description: 'Connect any OpenAI-compatible API endpoint (Ollama, LM Studio, OpenRouter, vLLM, private proxies).',
    contextWindow: 'Configurable',
    supportsVision: true,
    supportsAudio: false,
    supportsThinking: true,
  },
];

export interface SystemPersona {
  id: string;
  name: string;
  role: string;
  icon: string;
  prompt: string;
}

export const SYSTEM_PERSONAS: SystemPersona[] = [
  {
    id: 'general',
    name: 'Nova Core',
    role: 'Balanced General Assistant',
    icon: 'Sparkles',
    prompt: 'You are Nova, an exceptionally intelligent, helpful, articulate, and empathetic AI assistant. Provide concise, well-structured, modern markdown answers. Always format code in cleanly highlighted code blocks with language tags.',
  },
  {
    id: 'developer',
    name: 'Senior Architect',
    role: 'Full-Stack & Systems Expert',
    icon: 'Code',
    prompt: 'You are a Principal Software Architect and Senior Full-Stack Engineer. Provide robust, bug-free TypeScript/Python/Rust code, state design patterns, security best practices, and performance considerations.',
  },
  {
    id: 'creative',
    name: 'Creative Director',
    role: 'Design & Copywriting Specialist',
    icon: 'Palette',
    prompt: 'You are a world-class creative director and copywriter. Deliver captivating prose, refined UX microcopy, imaginative storytelling, and aesthetic design critiques.',
  },
  {
    id: 'analyst',
    name: 'Data Strategist',
    role: 'Executive Summary & Logic',
    icon: 'BarChart3',
    prompt: 'You are an executive business analyst and research strategist. Synthesize data, present bulleted executive summaries, highlight key takeaways, and outline actionable next steps with high signal-to-noise ratio.',
  },
];

export const PROMPT_PRESETS = [
  {
    title: 'Code Audit & Refactor',
    description: 'Analyze code for bottlenecks, type safety, and clean architecture',
    icon: 'Terminal',
    prompt: 'Please review and refactor this code for optimal performance, null safety, and clean modern architecture:',
  },
  {
    title: 'Multimodal Vision QA',
    description: 'Upload an image or diagram to extract insights or transcribe UI',
    icon: 'Image',
    prompt: 'Analyze this image in detail. Extract any text, explain UI layout hierarchies, and suggest UX improvements.',
  },
  {
    title: 'Explain Complex Topic',
    description: 'Break down complex algorithms or systems simply with analogies',
    icon: 'BookOpen',
    prompt: 'Explain the internal architecture and working principles of distributed consensus algorithms like Raft in simple terms with analogies.',
  },
  {
    title: 'Executive Briefing',
    description: 'Draft a high-impact briefing document with key metrics',
    icon: 'FileText',
    prompt: 'Draft an executive briefing summarizing modern edge AI deployment strategies, cost-latency trade-offs, and recommended security guardrails.',
  },
];

