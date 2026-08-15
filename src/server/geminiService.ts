/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Modality, ThinkingLevel } from "@google/genai";
import { RAW_DEVELOPER_API_KEYS, ModelProvider } from "../config/endpoints.ts";
import { ChatRequestBody, ChatResponseResult } from "../types/chat.ts";

// Helper to determine model provider
export function detectProvider(modelId: string): ModelProvider {
  if (modelId.startsWith("gemini-")) return "google";
  if (modelId.startsWith("claude-")) return "anthropic";
  if (modelId.startsWith("kimi-") || modelId.startsWith("moonshot-")) return "moonshot";
  if (modelId.startsWith("gpt-") || modelId.startsWith("o1") || modelId.startsWith("o3-")) return "openai";
  if (modelId.startsWith("deepseek-")) return "deepseek";
  if (modelId.startsWith("llama-")) return "groq";
  if (modelId.startsWith("openrouter/")) return "openrouter";
  if (modelId.startsWith("custom-")) return "custom";
  return "google";
}

// Get API Key with precedence: Client override -> Raw developer config -> Server .env
function resolveApiKey(provider: ModelProvider, clientKeys?: ChatRequestBody['apiKeys']): string {
  switch (provider) {
    case 'google':
      return (
        clientKeys?.geminiApiKey?.trim() ||
        RAW_DEVELOPER_API_KEYS.geminiApiKey?.trim() ||
        process.env.GEMINI_API_KEY?.trim() ||
        ""
      );
    case 'anthropic':
      return (
        clientKeys?.anthropicApiKey?.trim() ||
        RAW_DEVELOPER_API_KEYS.anthropicApiKey?.trim() ||
        process.env.ANTHROPIC_API_KEY?.trim() ||
        ""
      );
    case 'moonshot':
      return (
        clientKeys?.moonshotApiKey?.trim() ||
        RAW_DEVELOPER_API_KEYS.moonshotApiKey?.trim() ||
        process.env.MOONSHOT_API_KEY?.trim() ||
        process.env.KIMI_API_KEY?.trim() ||
        ""
      );
    case 'openai':
      return (
        clientKeys?.openaiApiKey?.trim() ||
        RAW_DEVELOPER_API_KEYS.openaiApiKey?.trim() ||
        process.env.OPENAI_API_KEY?.trim() ||
        ""
      );
    case 'deepseek':
      return (
        clientKeys?.deepseekApiKey?.trim() ||
        RAW_DEVELOPER_API_KEYS.deepseekApiKey?.trim() ||
        process.env.DEEPSEEK_API_KEY?.trim() ||
        ""
      );
    case 'groq':
      return (
        clientKeys?.groqApiKey?.trim() ||
        RAW_DEVELOPER_API_KEYS.groqApiKey?.trim() ||
        process.env.GROQ_API_KEY?.trim() ||
        ""
      );
    case 'openrouter':
      return (
        clientKeys?.openrouterApiKey?.trim() ||
        RAW_DEVELOPER_API_KEYS.openrouterApiKey?.trim() ||
        process.env.OPENROUTER_API_KEY?.trim() ||
        ""
      );
    case 'elevenlabs' as ModelProvider:
      return (
        clientKeys?.elevenlabsApiKey?.trim() ||
        RAW_DEVELOPER_API_KEYS.elevenlabsApiKey?.trim() ||
        process.env.ELEVENLABS_API_KEY?.trim() ||
        ""
      );
    case 'custom':
      return (
        clientKeys?.customApiKey?.trim() ||
        RAW_DEVELOPER_API_KEYS.customApiKey?.trim() ||
        process.env.CUSTOM_API_KEY?.trim() ||
        ""
      );
    default:
      return "";
  }
}

// Helper to build strict Indonesian system instruction
function buildStrictIndonesianSystemInstruction(customInstruction?: string): string {
  const mandatoryRules = `[ATURAN UTAMA & BAHASA MUTLAK]:
1. Anda adalah Nova AI, asisten kecerdasan buatan cerdas, ramah, dan profesional.
2. WAJIB dan SELALU gunakan BAHASA INDONESIA secara penuh sebagai bahasa default dalam SEMUA respon, salam pembuka (contoh: "Halo! Saya Nova. Ada yang bisa saya bantu hari ini?"), penjelasan, dan percakapan.
3. DILARANG menggunakan Bahasa Inggris untuk sapaan atau percakapan umum. Jangan pernah menyapa dengan bahasa Inggris seperti "How can I help you today?". Gunakan selalu Bahasa Indonesia seperti "Halo! Ada yang bisa saya bantu hari ini?".
4. Format jawaban menggunakan Markdown yang rapi, terstruktur, dan mudah dibaca. Istilah teknis atau sintaks pemrograman tetap dipertahankan sesuai kebutuhan dengan penjelasan berbahasa Indonesia.`;

  if (!customInstruction || !customInstruction.trim()) {
    return mandatoryRules;
  }

  return `${mandatoryRules}\n\n[Instruksi Tambahan]:\n${customInstruction.trim()}`;
}

// Helper to format message text with attached GPS location and document metadata
function formatMessageContentWithContext(msg: ChatRequestBody['messages'][0]): string {
  let text = msg.content || '';

  // Append GPS Location context if present
  if (msg.location) {
    const loc = msg.location;
    const locationSnippet = `\n\n[📍 User Active GPS Location]:
- Coordinates: ${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}
- Address: ${loc.address || 'Unknown'}
${loc.city ? `- Area: ${loc.city}${loc.state ? `, ${loc.state}` : ''}${loc.country ? `, ${loc.country}` : ''}` : ''}
- Accuracy: ±${loc.accuracy || 10} meters
- Google Maps: ${loc.mapsUrl}
(Please utilize this real-time GPS location to tailor localized recommendations, directions, nearby search, weather, or context-specific responses.)`;
    text = text ? `${text}${locationSnippet}` : locationSnippet;
  }

  return text;
}

/**
 * Handle Google Gemini API
 */
async function processGeminiRequest(body: ChatRequestBody, apiKey: string): Promise<ChatResponseResult> {
  const targetModel = body.model || "gemini-3.7-flash";

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const contents = body.messages.map((msg) => {
    const role = msg.role === 'assistant' ? 'model' : 'user';
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    if (msg.attachments && msg.attachments.length > 0) {
      for (const att of msg.attachments) {
        if (att.base64Data && att.mimeType) {
          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: att.base64Data,
            },
          });
        }
      }
    }

    const processedText = formatMessageContentWithContext(msg);
    if (processedText.trim().length > 0) {
      parts.push({ text: processedText });
    } else if (parts.length === 0) {
      parts.push({ text: " " });
    }

    return { role, parts };
  });

  const config: {
    systemInstruction?: string;
    temperature?: number;
    topP?: number;
    thinkingConfig?: { thinkingLevel: ThinkingLevel };
    tools?: Array<{ googleSearch?: Record<string, never> }>;
  } = {};

  config.systemInstruction = buildStrictIndonesianSystemInstruction(body.systemInstruction);
  if (typeof body.temperature === 'number') {
    config.temperature = body.temperature;
  }
  if (typeof body.topP === 'number') {
    config.topP = body.topP;
  }
  if (body.thinkingLevel && targetModel.includes('gemini-3')) {
    let level = ThinkingLevel.HIGH;
    if (body.thinkingLevel === 'LOW') level = ThinkingLevel.LOW;
    if (body.thinkingLevel === 'MINIMAL') level = ThinkingLevel.MINIMAL;
    config.thinkingConfig = { thinkingLevel: level };
  }
  if (body.enableWebSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  const response = await ai.models.generateContent({
    model: targetModel,
    contents,
    config,
  });

  const responseText = response.text || "";
  const groundingSources: Array<{ title: string; url: string }> = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (Array.isArray(chunks)) {
    for (const chunk of chunks) {
      if (chunk.web?.uri) {
        groundingSources.push({
          title: chunk.web.title || chunk.web.uri,
          url: chunk.web.uri,
        });
      }
    }
  }

  const estimatedTokens = Math.max(20, Math.round(responseText.length / 4));
  return {
    text: responseText,
    groundingSources: groundingSources.length > 0 ? groundingSources : undefined,
    model: targetModel,
    tokensEstimated: estimatedTokens,
  };
}

/**
 * Handle Anthropic Claude API (Claude 3.7 Sonnet, 3.5 Sonnet, Haiku, Opus)
 */
async function processAnthropicRequest(body: ChatRequestBody, apiKey: string): Promise<ChatResponseResult> {
  const targetModel = body.model || "claude-3-7-sonnet-20250219";

  const anthropicMessages = body.messages.map((msg) => {
    const role = msg.role === 'assistant' ? 'assistant' : 'user';
    const contentParts: any[] = [];

    if (msg.attachments && msg.attachments.length > 0) {
      for (const att of msg.attachments) {
        if (att.base64Data && att.mimeType.startsWith('image/')) {
          contentParts.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: att.mimeType,
              data: att.base64Data,
            },
          });
        }
      }
    }

    const processedText = formatMessageContentWithContext(msg);
    if (processedText.trim()) {
      contentParts.push({ type: 'text', text: processedText });
    } else if (contentParts.length === 0) {
      contentParts.push({ type: 'text', text: ' ' });
    }

    return { role, content: contentParts };
  });

  const payload: any = {
    model: targetModel,
    max_tokens: 4096,
    messages: anthropicMessages,
  };

  payload.system = buildStrictIndonesianSystemInstruction(body.systemInstruction);
  if (typeof body.temperature === 'number') {
    payload.temperature = body.temperature;
  }
  if (typeof body.topP === 'number') {
    payload.top_p = body.topP;
  }

  // Extended thinking for Claude 3.7 Sonnet if thinking requested
  if (targetModel.includes('3-7-sonnet') && body.thinkingLevel === 'HIGH') {
    payload.thinking = {
      type: 'enabled',
      budget_tokens: 2048,
    };
    // Claude requires max_tokens > budget_tokens and temperature must be omitted or 1
    payload.max_tokens = 6000;
    delete payload.temperature;
    delete payload.top_p;
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Anthropic API error (${res.status})`);
  }

  const data = await res.json();
  let textOutput = '';
  let thinkingOutput = '';

  if (Array.isArray(data.content)) {
    for (const part of data.content) {
      if (part.type === 'thinking') {
        thinkingOutput += part.thinking || '';
      } else if (part.type === 'text') {
        textOutput += part.text || '';
      }
    }
  }

  return {
    text: textOutput || 'No response text returned.',
    thinking: thinkingOutput || undefined,
    model: data.model || targetModel,
    tokensEstimated: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
  };
}

/**
 * Handle OpenAI Compatible Providers (Moonshot Kimi, OpenAI, DeepSeek, Groq, OpenRouter, Custom)
 */
async function processOpenAICompatibleRequest(
  body: ChatRequestBody,
  apiKey: string,
  provider: ModelProvider
): Promise<ChatResponseResult> {
  let endpointUrl = 'https://api.openai.com/v1/chat/completions';
  let targetModel = body.model || 'gpt-4o';
  let customHeaders: Record<string, string> = {};

  if (provider === 'moonshot') {
    endpointUrl = 'https://api.moonshot.cn/v1/chat/completions';
    // Map kimi-k3 -> moonshot-v1-128k or moonshot-v1-auto
    if (targetModel === 'kimi-k3') targetModel = 'moonshot-v1-128k';
    else if (targetModel === 'kimi-k1.5') targetModel = 'moonshot-v1-32k';
  } else if (provider === 'deepseek') {
    endpointUrl = 'https://api.deepseek.com/chat/completions';
  } else if (provider === 'groq') {
    endpointUrl = 'https://api.groq.com/openai/v1/chat/completions';
  } else if (provider === 'openrouter') {
    endpointUrl = 'https://openrouter.ai/api/v1/chat/completions';
    customHeaders['HTTP-Referer'] = 'https://ai.studio';
    customHeaders['X-Title'] = 'Nova AI Assistant';
  } else if (provider === 'custom') {
    const baseUrl = body.apiKeys?.customBaseUrl || process.env.CUSTOM_BASE_URL || 'http://localhost:11434/v1';
    endpointUrl = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
    targetModel = body.apiKeys?.customModelName || targetModel;
  }

  const messages: any[] = [];
  messages.push({ role: 'system', content: buildStrictIndonesianSystemInstruction(body.systemInstruction) });

  for (const msg of body.messages) {
    const role = msg.role;
    const processedText = formatMessageContentWithContext(msg);
    if (msg.attachments && msg.attachments.length > 0 && (provider === 'openai' || provider === 'custom')) {
      const contentParts: any[] = [{ type: 'text', text: processedText || 'Please analyze this attachment.' }];
      for (const att of msg.attachments) {
        if (att.base64Data && att.mimeType) {
          const imgUrl = `data:${att.mimeType};base64,${att.base64Data}`;
          contentParts.push({
            type: 'image_url',
            image_url: { url: imgUrl },
          });
        }
      }
      messages.push({ role, content: contentParts });
    } else {
      messages.push({ role, content: processedText });
    }
  }

  const payload: any = {
    model: targetModel,
    messages,
  };

  if (!targetModel.startsWith('o1') && !targetModel.startsWith('o3')) {
    if (typeof body.temperature === 'number') payload.temperature = body.temperature;
    if (typeof body.topP === 'number') payload.top_p = body.topP;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const res = await fetch(endpointUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || errData.message || `API returned HTTP ${res.status}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  const responseText = choice?.message?.content || '';
  const reasoningContent = choice?.message?.reasoning_content || undefined;

  return {
    text: responseText,
    thinking: reasoningContent,
    model: data.model || targetModel,
    tokensEstimated: data.usage?.total_tokens || Math.max(20, Math.round(responseText.length / 4)),
  };
}

/**
 * Main Multi-Model Chat Request Handler
 */
export async function processChatRequest(body: ChatRequestBody): Promise<ChatResponseResult> {
  const targetModel = body.model || "gemini-3.7-flash";
  const provider = detectProvider(targetModel);
  const apiKey = resolveApiKey(provider, body.apiKeys);

  // If no API key is available, return an intelligent guided fallback response
  if (!apiKey && provider !== 'custom') {
    const providerNames: Record<ModelProvider, string> = {
      google: 'Google Gemini (GEMINI_API_KEY)',
      anthropic: 'Anthropic Claude (ANTHROPIC_API_KEY)',
      moonshot: 'Moonshot AI / Kimi (MOONSHOT_API_KEY)',
      openai: 'OpenAI (OPENAI_API_KEY)',
      deepseek: 'DeepSeek (DEEPSEEK_API_KEY)',
      groq: 'Groq (GROQ_API_KEY)',
      openrouter: 'OpenRouter (OPENROUTER_API_KEY)',
      custom: 'Custom Endpoint',
    };

    const lastUserMessage = body.messages.filter(m => m.role === 'user').pop()?.content || "";
    return {
      text: `### 🔑 Kunci API Diperlukan untuk ${targetModel}\n\nAnda memilih model **${targetModel}** (${providerNames[provider] || provider}).\n\nUntuk mengaktifkan model ini, Anda dapat memasukkan kunci API melalui salah satu cara berikut:\n\n1. **Melalui Panel Pengaturan**: Klik ikon **⚙️ Pengaturan** di menu atas, pilih tab **Kunci API & Provider**, lalu masukkan \`${provider.toUpperCase()}_API_KEY\` Anda.\n2. **Melalui Berkas Konfigurasi / .env**: Buka berkas \`.env\` atau \`src/config/endpoints.ts\` dan simpan kunci Anda.\n\n---\n#### 💬 Pesan Anda:\n> "${lastUserMessage}"\n\n- **Model Terpilih**: \`${targetModel}\`\n- **Provider**: \`${provider}\`\n- **Fitur Multimodal & Vision**: Otomatis aktif setelah kunci API tersimpan!`,
      model: targetModel,
      tokensEstimated: 150,
    };
  }

  // Dispatch to the matching provider
  try {
    switch (provider) {
      case 'google':
        return await processGeminiRequest(body, apiKey);
      case 'anthropic':
        return await processAnthropicRequest(body, apiKey);
      case 'moonshot':
      case 'openai':
      case 'deepseek':
      case 'groq':
      case 'openrouter':
      case 'custom':
        return await processOpenAICompatibleRequest(body, apiKey, provider);
      default:
        return await processGeminiRequest(body, apiKey);
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[${provider.toUpperCase()}] Inference Error:`, errorMessage);
    throw new Error(`${provider.toUpperCase()} (${targetModel}): ${errorMessage}`);
  }
}

/**
 * Clean markdown and technical syntax for natural generative neural speech
 */
function sanitizeTextForSpeech(rawText: string): string {
  return rawText
    .replace(/```[\s\S]*?```/g, ' [code snippet omitted] ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_#~>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface SpeechRequestOptions {
  text: string;
  provider?: 'gemini' | 'openai' | 'elevenlabs';
  voice?: string;
  speed?: number;
  emotion?: string;
  clientKeys?: ChatRequestBody['apiKeys'];
}

export interface SpeechResponseResult {
  audioBase64: string;
  mimeType: string;
  provider: 'gemini' | 'openai' | 'elevenlabs';
  voiceUsed: string;
  sampleRate?: number;
}

/**
 * Text-to-Speech synthesis handler (Gemini Live, OpenAI Audio API, ElevenLabs)
 */
export async function processSpeechRequest(
  options: SpeechRequestOptions | string,
  legacyVoice: string = 'Kore',
  legacyKeys?: ChatRequestBody['apiKeys']
): Promise<SpeechResponseResult> {
  // Normalize options
  const opts: SpeechRequestOptions = typeof options === 'string'
    ? { text: options, voice: legacyVoice, clientKeys: legacyKeys }
    : options;

  const rawText = opts.text || '';
  const cleanText = sanitizeTextForSpeech(rawText);
  if (!cleanText) {
    throw new Error("Text content is empty or contains no speakable characters.");
  }

  // Truncate to reasonable length for instant low-latency neural generation
  const speechInput = cleanText.slice(0, 2500);
  const targetProvider = opts.provider || (
    opts.voice?.startsWith('21m') || opts.voice?.startsWith('pNIn') || opts.voice?.startsWith('ErX') || opts.voice?.startsWith('EXA') || opts.voice?.startsWith('TxG')
      ? 'elevenlabs'
      : ['alloy', 'echo', 'shimmer', 'ash', 'ballad', 'coral', 'sage', 'verse', 'nova', 'onyx', 'fable'].includes(opts.voice?.toLowerCase() || '')
      ? 'openai'
      : 'gemini'
  );

  // 1. ELEVENLABS ULTRA-REALISTIC GENERATIVE VOICE
  if (targetProvider === 'elevenlabs') {
    const elevenKey = resolveApiKey('elevenlabs' as ModelProvider, opts.clientKeys);
    if (elevenKey) {
      try {
        const voiceId = opts.voice && opts.voice.length > 10 ? opts.voice : '21m00Tcm4TlvDq8ikWAM'; // Rachel default
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': elevenKey,
          },
          body: JSON.stringify({
            text: speechInput,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.85,
              style: opts.emotion === 'excited' ? 0.6 : opts.emotion === 'calm' ? 0.3 : 0.45,
              use_speaker_boost: true,
            },
          }),
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody.detail?.message || `ElevenLabs API error (${response.status})`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Audio = buffer.toString('base64');

        return {
          audioBase64: base64Audio,
          mimeType: 'audio/mp3',
          provider: 'elevenlabs',
          voiceUsed: voiceId,
        };
      } catch (err: unknown) {
        console.warn('ElevenLabs speech generation fallback to Gemini Live:', err);
      }
    }
  }

  // 2. OPENAI AUDIO API (TTS-1-HD / REALTIME AUDIO VOICES)
  if (targetProvider === 'openai') {
    const openaiKey = resolveApiKey('openai', opts.clientKeys);
    if (openaiKey) {
      try {
        const allowedVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer', 'ash', 'ballad', 'coral', 'sage', 'verse'];
        const chosenVoice = opts.voice && allowedVoices.includes(opts.voice.toLowerCase()) ? opts.voice.toLowerCase() : 'alloy';

        const response = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'tts-1-hd',
            input: speechInput,
            voice: chosenVoice,
            speed: typeof opts.speed === 'number' ? Math.max(0.5, Math.min(2.0, opts.speed)) : 1.0,
          }),
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody.error?.message || `OpenAI Audio API error (${response.status})`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Audio = buffer.toString('base64');

        return {
          audioBase64: base64Audio,
          mimeType: 'audio/mp3',
          provider: 'openai',
          voiceUsed: chosenVoice,
        };
      } catch (err: unknown) {
        console.warn('OpenAI Audio speech generation fallback to Gemini Live:', err);
      }
    }
  }

  // 3. GOOGLE GEMINI LIVE NEURAL AUDIO (gemini-3.1-flash-tts-preview)
  const geminiKey = resolveApiKey('google', opts.clientKeys);
  if (!geminiKey) {
    throw new Error("GEMINI_API_KEY is required for Gemini Live Neural Audio generation.");
  }

  const ai = new GoogleGenAI({ apiKey: geminiKey });
  const allowedGeminiVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
  const selectedVoice = opts.voice && allowedGeminiVoices.includes(opts.voice) ? opts.voice : 'Kore';

  // Condition the prompt with natural human conversational delivery instructions
  const emotionDirective = opts.emotion === 'excited'
    ? 'Speak in an enthusiastic, upbeat, and energetic human voice: '
    : opts.emotion === 'calm'
    ? 'Speak in a calm, soothing, and thoughtful conversational voice: '
    : opts.emotion === 'warm'
    ? 'Speak in a warm, friendly, empathetic, and natural tone: '
    : opts.emotion === 'whisper'
    ? 'Speak in a soft, gentle whisper tone: '
    : 'Speak with a natural, conversational human tone with realistic breath pauses and clear intonation: ';

  const conditionedPrompt = `${emotionDirective}${speechInput}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: conditionedPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data returned from Gemini Live TTS model.");
    }

    return {
      audioBase64: base64Audio,
      mimeType: 'audio/pcm;rate=24000',
      sampleRate: 24000,
      provider: 'gemini',
      voiceUsed: selectedVoice,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Gemini Live TTS Error:", errorMessage);
    throw new Error(`Real-Time Neural Speech generation failed: ${errorMessage}`);
  }
}
