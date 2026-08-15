/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Modality, ThinkingLevel } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface ChatRequestBody {
  model?: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    attachments?: Array<{
      mimeType: string;
      base64Data: string;
    }>;
  }>;
  systemInstruction?: string;
  temperature?: number;
  topP?: number;
  thinkingLevel?: 'HIGH' | 'LOW' | 'MINIMAL';
  enableWebSearch?: boolean;
}

export interface ChatResponseResult {
  text: string;
  thinking?: string;
  groundingSources?: Array<{ title: string; url: string }>;
  model: string;
  tokensEstimated?: number;
}

export async function processChatRequest(body: ChatRequestBody): Promise<ChatResponseResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const targetModel = body.model || "gemini-3.7-flash";

  if (!apiKey) {
    // Provide a helpful, high-quality fallback message when running in offline preview or without API key
    const lastUserMessage = body.messages.filter(m => m.role === 'user').pop()?.content || "";
    return {
      text: `Hello! I am **Nova AI Assistant**. To enable live cloud inference with Google Gemini 3.7, ensure your \`GEMINI_API_KEY\` is configured in the AI Studio environment or Settings panel.\n\nHere is a local preview response to your query:\n> "${lastUserMessage}"\n\n- **Architecture**: Modular server-client architecture with robust error boundaries.\n- **Multimodal**: Supports image OCR and vision analysis.\n- **Voice**: Full speech dictation and audio synthesis integrated.\n\nFeel free to explore the settings, presets, and conversation threads!`,
      model: targetModel,
      tokensEstimated: 120,
    };
  }

  const ai = getAiClient();

  // Format contents for generateContent
  // Build multimodal parts from message history and attachments
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

    if (msg.content && msg.content.trim().length > 0) {
      parts.push({ text: msg.content });
    } else if (parts.length === 0) {
      parts.push({ text: " " });
    }

    return {
      role,
      parts,
    };
  });

  // Prepare config
  const config: {
    systemInstruction?: string;
    temperature?: number;
    topP?: number;
    thinkingConfig?: { thinkingLevel: ThinkingLevel };
    tools?: Array<{ googleSearch?: Record<string, never> }>;
  } = {};

  if (body.systemInstruction) {
    config.systemInstruction = body.systemInstruction;
  }

  if (typeof body.temperature === 'number') {
    config.temperature = body.temperature;
  }

  if (typeof body.topP === 'number') {
    config.topP = body.topP;
  }

  // Thinking level configuration for Gemini 3 series
  if (body.thinkingLevel && targetModel.includes('gemini-3')) {
    let level = ThinkingLevel.HIGH;
    if (body.thinkingLevel === 'LOW') level = ThinkingLevel.LOW;
    if (body.thinkingLevel === 'MINIMAL') level = ThinkingLevel.MINIMAL;
    config.thinkingConfig = { thinkingLevel: level };
  }

  // Google Search Grounding if enabled
  if (body.enableWebSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  try {
    const response = await ai.models.generateContent({
      model: targetModel,
      contents,
      config,
    });

    const responseText = response.text || "";
    
    // Extract grounding sources if available
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
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Gemini API Error:", errorMessage);
    throw new Error(`Inference failed: ${errorMessage}`);
  }
}

export async function processSpeechRequest(text: string, voiceName: string = 'Kore'): Promise<{ audioBase64: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required for Gemini TTS generation.");
  }

  const ai = getAiClient();
  const selectedVoice = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'].includes(voiceName) ? voiceName : 'Kore';

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: text.slice(0, 1000) }] }],
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
      throw new Error("No audio payload returned from Gemini TTS model.");
    }

    return { audioBase64: base64Audio };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Gemini TTS Error:", errorMessage);
    throw new Error(`TTS synthesis error: ${errorMessage}`);
  }
}
