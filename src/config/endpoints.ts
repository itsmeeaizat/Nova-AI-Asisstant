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
  elevenlabsApiKey?: string;
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
  elevenlabsApiKey: '',
  customApiKey: '',
  customBaseUrl: 'http://localhost:11434/v1',
  customModelName: 'llama3.2',
};

export interface VoiceModelOption {
  id: string;
  name: string;
  provider: 'gemini' | 'openai' | 'elevenlabs';
  providerName: string;
  gender: 'female' | 'male' | 'neutral';
  tone: string;
  description: string;
  badge: string;
  samplePhrase: string;
}

export const AVAILABLE_VOICES: VoiceModelOption[] = [
  // 1. GOOGLE GEMINI LIVE NEURAL VOICES (gemini-3.1-flash-tts-preview)
  {
    id: 'Kore',
    name: 'Kore (Gemini Live)',
    provider: 'gemini',
    providerName: 'Google Gemini Live',
    gender: 'female',
    tone: 'Warm, natural, clear, empathetic',
    description: 'Flagship Google neural voice with conversational prosody, natural breath pauses, and contextual pacing.',
    badge: 'Gemini Live SOTA',
    samplePhrase: 'Halo! Saya siap membantu Anda mendiskusikan ide baru atau menganalisis tugas apa pun hari ini.',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr (Gemini Live)',
    provider: 'gemini',
    providerName: 'Google Gemini Live',
    gender: 'female',
    tone: 'Breezy, friendly, high clarity',
    description: 'Upbeat and articulate voice optimized for real-time dialogue and clear explanations.',
    badge: 'Expressive',
    samplePhrase: 'Saya dapat memandu Anda melalui seluruh proses langkah demi langkah dengan sangat jelas.',
  },
  {
    id: 'Puck',
    name: 'Puck (Gemini Live)',
    provider: 'gemini',
    providerName: 'Google Gemini Live',
    gender: 'male',
    tone: 'Playful, dynamic, energetic',
    description: 'Vibrant male voice with dynamic emotional inflection, great for interactive brainstorming.',
    badge: 'Dynamic',
    samplePhrase: 'Mari kita mulai dan ciptakan sesuatu yang luar biasa bersama-sama!',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir (Gemini Live)',
    provider: 'gemini',
    providerName: 'Google Gemini Live',
    gender: 'male',
    tone: 'Deep, authoritative, reassuring',
    description: 'Rich resonant timbre ideal for lectures, technical briefings, and strategic summaries.',
    badge: 'Deep Resonance',
    samplePhrase: 'Berikut adalah ringkasan eksekutif dan pertimbangan arsitektur sistem.',
  },
  {
    id: 'Charon',
    name: 'Charon (Gemini Live)',
    provider: 'gemini',
    providerName: 'Google Gemini Live',
    gender: 'male',
    tone: 'Calm, thoughtful, grounded',
    description: 'Relaxed pacing and introspective tone, optimal for deep reading and reflection.',
    badge: 'Calm',
    samplePhrase: 'Mari kita luangkan waktu untuk menganalisis bagaimana setiap komponen saling terhubung.',
  },

  // 2. OPENAI AUDIO API (TTS-1-HD / REALTIME)
  {
    id: 'alloy',
    name: 'Alloy (OpenAI)',
    provider: 'openai',
    providerName: 'OpenAI Audio API',
    gender: 'neutral',
    tone: 'Balanced, conversational, warm',
    description: 'Versatile and friendly neutral voice with human-like breathing and natural cadence.',
    badge: 'OpenAI Flagship',
    samplePhrase: 'Saya dapat membantu Anda menguraikan hal ini menjadi langkah-langkah praktis yang mudah.',
  },
  {
    id: 'echo',
    name: 'Echo (OpenAI)',
    provider: 'openai',
    providerName: 'OpenAI Audio API',
    gender: 'male',
    tone: 'Warm, rounded, gentle',
    description: 'Comfortable, human vocal presence with subtle emotional warmth.',
    badge: 'Warm Male',
    samplePhrase: 'Mari kita telusuri gagasan itu lebih dalam dan lihat potensinya.',
  },
  {
    id: 'shimmer',
    name: 'Shimmer (OpenAI)',
    provider: 'openai',
    providerName: 'OpenAI Audio API',
    gender: 'female',
    tone: 'Bright, expressive, polished',
    description: 'High-frequency brilliance with emotional expressiveness and clear diction.',
    badge: 'Expressive',
    samplePhrase: 'Pertanyaan yang sangat bagus! Mari kita pelajari poin-poin utamanya bersama.',
  },
  {
    id: 'ash',
    name: 'Ash (OpenAI Realtime)',
    provider: 'openai',
    providerName: 'OpenAI Audio API',
    gender: 'male',
    tone: 'Casual, conversational, relaxed',
    description: 'OpenAI Realtime audio voice designed for effortless casual conversation and voice notes.',
    badge: 'Realtime',
    samplePhrase: 'Halo! Saya siap kapan pun Anda ingin mengobrol atau menyelesaikan tugas.',
  },
  {
    id: 'ballad',
    name: 'Ballad (OpenAI Realtime)',
    provider: 'openai',
    providerName: 'OpenAI Audio API',
    gender: 'male',
    tone: 'Smooth, storytelling, deep warmth',
    description: 'Storyteller timbre with resonant emotional contour.',
    badge: 'Storyteller',
    samplePhrase: 'Dalam dunia teknologi dan desain, kesederhanaan adalah bentuk kecanggihan tertinggi.',
  },
  {
    id: 'coral',
    name: 'Coral (OpenAI Realtime)',
    provider: 'openai',
    providerName: 'OpenAI Audio API',
    gender: 'female',
    tone: 'Charming, friendly, lively',
    description: 'Warm and inviting voice with authentic conversational intonation.',
    badge: 'Friendly',
    samplePhrase: 'Senang bisa membantu Anda! Ada yang ingin kita diskusikan atau bangun selanjutnya?',
  },
  {
    id: 'sage',
    name: 'Sage (OpenAI Realtime)',
    provider: 'openai',
    providerName: 'OpenAI Audio API',
    gender: 'female',
    tone: 'Thoughtful, composed, professional',
    description: 'Polished consulting tone with measured cadence and clear pronunciation.',
    badge: 'Insightful',
    samplePhrase: 'Meninjau kembali dasar-dasarnya secara cermat akan selalu menunjukkan arah terbaik.',
  },
  {
    id: 'verse',
    name: 'Verse (OpenAI Realtime)',
    provider: 'openai',
    providerName: 'OpenAI Audio API',
    gender: 'neutral',
    tone: 'Dynamic, modern, crisp',
    description: 'Contemporary neutral voice engineered for real-time collaborative dialogue.',
    badge: 'Modern',
    samplePhrase: 'Mari kita sinkronkan rencana dan mulai eksekusi tahap berikutnya.',
  },

  // 3. ELEVENLABS ULTRA-REALISTIC AI VOICE ENGINE
  {
    id: '21m00Tcm4TlvDq8ikWAM', // Rachel
    name: 'Rachel (ElevenLabs)',
    provider: 'elevenlabs',
    providerName: 'ElevenLabs Engine',
    gender: 'female',
    tone: 'Ultra-realistic, calm, authentic American',
    description: 'The global benchmark for neural voice realism. Indistinguishable from human speech with natural breath and micro-inflections.',
    badge: 'ElevenLabs Top',
    samplePhrase: 'Setiap kalimat diucapkan dengan ritme alami, jeda napas yang hidup, dan kehangatan nyata.',
  },
  {
    id: 'pNInz6obpgDQGcFmaJgB', // Adam
    name: 'Adam (ElevenLabs)',
    provider: 'elevenlabs',
    providerName: 'ElevenLabs Engine',
    gender: 'male',
    tone: 'Deep, engaging, conversational narration',
    description: 'Rich, natural male voice famous for high-end audiobooks and lifelike conversational AI.',
    badge: 'Deep Natural',
    samplePhrase: 'Suara ini terdengar sangat hidup, persis seperti percakapan langsung antar manusia.',
  },
  {
    id: 'ErXwobaYiN019PkySvjV', // Antoni
    name: 'Antoni (ElevenLabs)',
    provider: 'elevenlabs',
    providerName: 'ElevenLabs Engine',
    gender: 'male',
    tone: 'Articulate, friendly, crisp European-American',
    description: 'Balanced, pleasant voice ideal for voice messages, smart assistants, and podcasting.',
    badge: 'Articulate',
    samplePhrase: 'Saya hadir untuk membantu Anda beraktivitas dengan cepat, tepat, dan menyenangkan.',
  },
  {
    id: 'EXAVITQu4vr4xnSDxMaL', // Bella
    name: 'Bella (ElevenLabs)',
    provider: 'elevenlabs',
    providerName: 'ElevenLabs Engine',
    gender: 'female',
    tone: 'Soft, intimate, emotional depth',
    description: 'Expressive female voice capable of subtle emotional changes, whispering, and gentle humor.',
    badge: 'Emotional',
    samplePhrase: 'Rasanya seperti sedang berbincang santai dari hati ke hati dengan teman dekat.',
  },
  {
    id: 'TxGEqnHWrfWFTfGW9XjX', // Josh
    name: 'Josh (ElevenLabs)',
    provider: 'elevenlabs',
    providerName: 'ElevenLabs Engine',
    gender: 'male',
    tone: 'Youthful, casual, natural American guy',
    description: 'Great for casual banter, WhatsApp-style voice notes, and modern conversational bots.',
    badge: 'Casual Pro',
    samplePhrase: 'Halo kawan! Ada yang butuh bantuan untuk proyek atau tugas hari ini?',
  },
];

export const DEFAULT_VOICE_SETTINGS = {
  provider: 'gemini' as const,
  voiceId: 'Kore',
  speed: 1.0,
  emotion: 'natural' as const,
  autoPlayReplies: false,
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
    role: 'Asisten Serba Bisa',
    icon: 'Sparkles',
    prompt: 'Anda adalah Nova, asisten AI yang sangat cerdas, ramah, artikulatif, dan berwawasan luas. Selalu gunakan Bahasa Indonesia sebagai bahasa utama/default dalam merespons seluruh pertanyaan pengguna secara jelas, alami, sopan, dan terstruktur rapi dengan markdown modern. Format kode program selalu dalam blok kode ber-syntax highlight bersih dengan tag bahasa yang tepat.',
  },
  {
    id: 'developer',
    name: 'Senior Architect',
    role: 'Pakar Full-Stack & Sistem',
    icon: 'Code',
    prompt: 'Anda adalah Principal Software Architect dan Senior Full-Stack Engineer. Berikan analisis mendalam, arsitektur sistem modern, serta kode TypeScript/Python/Rust yang kokoh, aman, bebas bug, dan berkinerja tinggi. Berikan penjelasan dalam Bahasa Indonesia yang profesional, jelas, dan solutif.',
  },
  {
    id: 'creative',
    name: 'Creative Director',
    role: 'Pakar Desain & Copywriting',
    icon: 'Palette',
    prompt: 'Anda adalah Creative Director dan pakar Copywriting kelas dunia. Hasilkan ide kreatif, narasi menarik, mikro-copy UI/UX yang memikat, dan ulasan desain estetis dalam Bahasa Indonesia yang ekspresif, elegan, dan berdampak kuat.',
  },
  {
    id: 'analyst',
    name: 'Data Strategist',
    role: 'Ringkasan Eksekutif & Logika',
    icon: 'BarChart3',
    prompt: 'Anda adalah Executive Business Analyst dan Data Strategist. Sintesis data dan dokumen, sajikan ringkasan eksekutif berpoin, sorot wawasan kunci, dan susun rekomendasi aksi konkret dengan rasio sinyal-ke-kebisingan tinggi dalam Bahasa Indonesia yang tajam.',
  },
];

export const PROMPT_PRESETS = [
  {
    title: 'Audit & Refaktor Kode',
    description: 'Analisis kode untuk optimasi performa, type safety, dan clean architecture',
    icon: 'Terminal',
    prompt: 'Tolong tinjau dan refaktor kode berikut untuk performa maksimal, keamanan tipe data (null-safety), dan arsitektur yang bersih:',
  },
  {
    title: 'Analisis Gambar & Vision Multimodal',
    description: 'Ekstrak informasi, baca teks OCR, dan bedah hierarki visual dari gambar',
    icon: 'Image',
    prompt: 'Analisis gambar/dokumen ini secara mendalam. Ekstrak teks penting, jelaskan tata letak atau diagramnya, dan berikan rekomendasi tindak lanjut.',
  },
  {
    title: 'Penjelasan Konsep & Algoritma',
    description: 'Pahami sistem kompleks atau arsitektur komputasi dengan analogi mudah',
    icon: 'BookOpen',
    prompt: 'Jelaskan konsep arsitektur sistem terdistribusi dan algoritma konsensus seperti Raft secara sederhana dengan analogi yang mudah dipahami dalam Bahasa Indonesia.',
  },
  {
    title: 'Ringkasan Eksekutif Strategis',
    description: 'Susun laporan atau ringkasan bisnis berbobot tinggi beserta metrik kunci',
    icon: 'FileText',
    prompt: 'Buatlah ringkasan eksekutif komprehensif mengenai strategi penerapan Edge AI & Large Audio Models, perbandingan biaya vs latensi, dan rekomendasi implementasi praktis.',
  },
];

export const STRICT_INDONESIAN_PROMPT_RULE = `[ATURAN WAJIB BAHASA INDONESIA]:
1. Anda HARUS SELALU menggunakan BAHASA INDONESIA dalam seluruh jawaban, penjelasan, pemecahan masalah, dan sapaan.
2. DILARANG menggunakan bahasa Inggris sebagai bahasa utama untuk sapaan atau percakapan umum.
3. Selalu berikan respon yang jelas, alami, sopan, dan terstruktur rapi dengan format Markdown modern.
4. Istilah teknis khusus atau kode program tetap dipertahankan dengan penjelasan berbahasa Indonesia.`;

export interface CustomPromptTemplate {
  id: string;
  name: string;
  badge: string;
  category: string;
  description: string;
  prompt: string;
}

export const CUSTOM_PROMPT_TEMPLATES: CustomPromptTemplate[] = [
  {
    id: 'id-standard',
    name: 'Bahasa Indonesia Standar & Ramah',
    badge: 'Rekomendasi',
    category: 'Umum',
    description: 'Respon berbahasa Indonesia yang jelas, sopan, terstruktur rapi, dan mudah dipahami.',
    prompt: `Anda adalah Nova, asisten AI cerdas dan ramah. Gunakan SELALU Bahasa Indonesia secara penuh dan baku namun tetap bersahabat dalam semua percakapan dan solusi yang Anda berikan. Sajikan jawaban dengan format Markdown yang rapi.`,
  },
  {
    id: 'id-developer',
    name: 'Pakar Full-Stack & Clean Code',
    badge: 'Teknis',
    category: 'Pemrograman',
    description: 'Solusi arsitektur software, clean code TypeScript/Python, dan penjelasan teknis mendalam berbahasa Indonesia.',
    prompt: `Anda adalah Principal Software Engineer dan Solution Architect kelas dunia. Berikan solusi teknis, contoh kode (TypeScript/Python/Go/Rust) yang modular, aman, dan type-safe, serta jelaskan arsitektur dan trade-off sistem secara mendalam dalam Bahasa Indonesia yang lugas dan solutif.`,
  },
  {
    id: 'id-analyst',
    name: 'Analis Bisnis & Riset Eksekutif',
    badge: 'Bisnis',
    category: 'Analisis & Data',
    description: 'Ringkasan eksekutif berpoin, analisis SWOT, dan rekomendasi aksi nyata berbobot tinggi.',
    prompt: `Anda adalah Executive Business Consultant dan Data Strategist. Berikan ringkasan eksekutif berpoin, telaah risiko dan peluang, serta susun rencana aksi konkret (actionable steps) dengan rasio sinyal-ke-kebisingan tinggi dalam Bahasa Indonesia formal dan profesional.`,
  },
  {
    id: 'id-educator',
    name: 'Tutor & Edukator Interaktif',
    badge: 'Edukasi',
    category: 'Pendidikan',
    description: 'Menjelaskan materi atau konsep rumit secara bertahap dengan analogi sederhana.',
    prompt: `Anda adalah dosen dan mentor edukasi yang sabar dan komunikatif. Jelaskan konsep, rumus, atau teori yang kompleks menggunakan analogi kehidupan nyata dan langkah-langkah bertahap dalam Bahasa Indonesia agar mudah dimengerti oleh siapa saja.`,
  },
  {
    id: 'id-creative',
    name: 'Copywriter & Kreator Konten',
    badge: 'Kreatif',
    category: 'Konten',
    description: 'Narasi memikat, copywriting media sosial, naskah presentasi, dan storytelling engaging.',
    prompt: `Anda adalah Creative Director dan pakar Copywriting persuasif. Hasilkan ide konten viral, naskah video/podcast, email marketing, atau artikel blog dalam Bahasa Indonesia yang ekspresif, berdaya pikat tinggi, dan enak dibaca.`,
  },
  {
    id: 'id-concise',
    name: 'Super Singkat & To-The-Point',
    badge: 'Efisiensi',
    category: 'Produktivitas',
    description: 'Jawaban langsung ke inti persoalan tanpa pembukaan atau penutup panjang.',
    prompt: `Anda adalah asisten super efisien. Berikan jawaban langsung ke inti masalah (to-the-point) dalam Bahasa Indonesia, tanpa basa-basi pembuka atau penutup yang tidak perlu. Gunakan format poin singkat jika relevan.`,
  },
];


