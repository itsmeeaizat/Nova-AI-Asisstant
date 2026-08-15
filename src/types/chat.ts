/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string; // base64 data url
  base64Data: string; // pure base64
  mimeType: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  thinking?: string;
  modelUsed?: string;
  isStreaming?: boolean;
  error?: string;
  tokensEstimated?: number;
  groundingSources?: Array<{ title: string; url: string }>;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  modelId: string;
  personaId: string;
  isPinned?: boolean;
  tags?: string[];
}

export interface GenerationSettings {
  temperature: number;
  topP: number;
  topK: number;
  thinkingLevel: 'HIGH' | 'LOW' | 'MINIMAL';
  enableWebSearch: boolean;
  speechVoice: string;
  speechSpeed: number;
}

export interface ApiLogEntry {
  id: string;
  timestamp: number;
  endpoint: string;
  method: string;
  status: number | 'PENDING' | 'FAILED';
  durationMs?: number;
  requestPayload?: unknown;
  responsePayload?: unknown;
  error?: string;
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

