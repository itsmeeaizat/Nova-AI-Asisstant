/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Nova AI Assistant - API Endpoint & Architecture Configuration
 * 
 * This file serves as the centralized, modular configuration for all backend 
 * communication endpoints, base URLs, and model routing.
 * Developers can modify endpoint paths or attach custom external proxy URLs here.
 */

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
  timeoutMs: 45000,
  maxRetries: 2,
};

export interface ModelOption {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  description: string;
  supportsVision: boolean;
  supportsAudio: boolean;
  supportsThinking: boolean;
  isDefault?: boolean;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash',
    tagline: 'High-speed reasoning & multimodal',
    badge: 'Recommended',
    description: 'Fastest next-generation model with multimodal understanding, web grounding, and adaptive reasoning.',
    supportsVision: true,
    supportsAudio: true,
    supportsThinking: true,
    isDefault: true,
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash Latest',
    tagline: 'Ultra-low latency conversational',
    badge: 'Fast',
    description: 'Optimized for rapid dialogue, code generation, summarization, and quick questions.',
    supportsVision: true,
    supportsAudio: true,
    supportsThinking: false,
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    tagline: 'Advanced reasoning & STEM analysis',
    badge: 'Pro Reasoning',
    description: 'Deep mathematical analysis, multi-step problem solving, architecture design, and complex code audits.',
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
