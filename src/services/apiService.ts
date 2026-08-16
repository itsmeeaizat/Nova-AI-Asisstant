/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DEFAULT_ENDPOINT_CONFIG, EndpointConfig, AVAILABLE_MODELS, ModelOption } from '../config/endpoints';
import { ApiLogEntry, ChatRequestBody, ChatResponseResult } from '../types/chat';

class ApiService {
  private logs: ApiLogEntry[] = [];
  private logListeners: Array<(logs: ApiLogEntry[]) => void> = [];

  public getLogs(): ApiLogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
    this.notifyLogListeners();
  }

  public onLogsChange(listener: (logs: ApiLogEntry[]) => void): () => void {
    this.logListeners.push(listener);
    return () => {
      this.logListeners = this.logListeners.filter(l => l !== listener);
    };
  }

  private addLog(entry: ApiLogEntry): void {
    this.logs.unshift(entry);
    if (this.logs.length > 50) {
      this.logs.pop();
    }
    this.notifyLogListeners();
  }

  private notifyLogListeners(): void {
    this.logListeners.forEach(fn => fn([...this.logs]));
  }

  public async checkHealth(config: EndpointConfig = DEFAULT_ENDPOINT_CONFIG): Promise<{ online: boolean; hasApiKey: boolean; latencyMs: number }> {
    const startTime = performance.now();
    const url = `${config.baseUrl}${config.healthEndpoint}`;
    const logId = Math.random().toString(36).substring(7);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const latencyMs = Math.round(performance.now() - startTime);
      if (!response.ok) {
        throw new Error(`Health check failed with status: ${response.status}`);
      }

      const data = await response.json();
      this.addLog({
        id: logId,
        timestamp: Date.now(),
        endpoint: url,
        method: 'GET',
        status: response.status,
        durationMs: latencyMs,
        responsePayload: data,
      });

      return {
        online: true,
        hasApiKey: Boolean(data.hasApiKey),
        latencyMs,
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      this.addLog({
        id: logId,
        timestamp: Date.now(),
        endpoint: url,
        method: 'GET',
        status: 'FAILED',
        durationMs: latencyMs,
        error: err.message,
      });

      return {
        online: false,
        hasApiKey: false,
        latencyMs,
      };
    }
  }

  public async getModels(config: EndpointConfig = DEFAULT_ENDPOINT_CONFIG): Promise<ModelOption[]> {
    const url = `${config.baseUrl}${config.modelsEndpoint}`;
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.models && Array.isArray(data.models)) {
          return data.models;
        }
      }
    } catch (err) {
      console.warn('Falling back to local models list:', err);
    }
    return AVAILABLE_MODELS;
  }

  public async sendChatMessage(
    body: ChatRequestBody,
    config: EndpointConfig = DEFAULT_ENDPOINT_CONFIG
  ): Promise<ChatResponseResult> {
    const url = `${config.baseUrl}${config.chatEndpoint}`;
    const logId = Math.random().toString(36).substring(7);
    const startTime = performance.now();

    this.addLog({
      id: logId,
      timestamp: Date.now(),
      endpoint: url,
      method: 'POST',
      status: 'PENDING',
      requestPayload: {
        model: body.model,
        messagesCount: body.messages.length,
        hasSystemInstruction: Boolean(body.systemInstruction),
        attachmentsCount: body.messages.reduce((acc, m) => acc + (m.attachments?.length || 0), 0),
      },
    });

    let attempts = 0;
    const maxRetries = config.maxRetries || 1;

    while (attempts <= maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs || 45000);

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const latencyMs = Math.round(performance.now() - startTime);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server returned ${response.status}`);
        }

        const resData = await response.json();
        if (!resData.success) {
          throw new Error(resData.error || 'Server error during inference');
        }

        this.addLog({
          id: logId,
          timestamp: Date.now(),
          endpoint: url,
          method: 'POST',
          status: response.status,
          durationMs: latencyMs,
          responsePayload: {
            textPreview: (resData.data?.text || '').slice(0, 150) + '...',
            model: resData.data?.model,
          },
        });

        return resData.data;
      } catch (err: any) {
        attempts++;
        if (attempts > maxRetries) {
          const latencyMs = Math.round(performance.now() - startTime);
          this.addLog({
            id: logId,
            timestamp: Date.now(),
            endpoint: url,
            method: 'POST',
            status: 'FAILED',
            durationMs: latencyMs,
            error: err.message,
          });
          throw err;
        }
        // Small exponential delay before retry
        await new Promise(r => setTimeout(r, 800 * attempts));
      }
    }

    throw new Error('Chat request failed after retries.');
  }

  /**
   * Real-Time Stream Chat Message (Server-Sent Events)
   * Delivers token/chunk deltas instantly to client as they are generated by Gemini / LLM
   */
  public async sendChatMessageStream(
    body: ChatRequestBody,
    onChunk: (deltaText: string, accumulatedText: string, metadata?: { groundingSources?: any[]; thinking?: string; model?: string }) => void,
    config: EndpointConfig = DEFAULT_ENDPOINT_CONFIG,
    abortSignal?: AbortSignal
  ): Promise<ChatResponseResult> {
    const url = `${config.baseUrl}${config.chatStreamEndpoint || '/chat/stream'}`;
    const logId = Math.random().toString(36).substring(7);
    const startTime = performance.now();

    this.addLog({
      id: logId,
      timestamp: Date.now(),
      endpoint: url,
      method: 'POST',
      status: 'STREAMING',
      requestPayload: {
        model: body.model,
        messagesCount: body.messages.length,
        hasSystemInstruction: Boolean(body.systemInstruction),
      },
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(body),
        signal: abortSignal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Stream request returned ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulatedText = '';
      let finalResult: ChatResponseResult | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);
            if (data.type === 'chunk' && typeof data.text === 'string') {
              accumulatedText += data.text;
              onChunk(data.text, accumulatedText, {
                groundingSources: data.groundingSources,
                thinking: data.thinking,
              });
            } else if (data.type === 'done' && data.data) {
              finalResult = data.data;
            } else if (data.type === 'error') {
              throw new Error(data.error || 'Stream error occurred');
            }
          } catch (e: any) {
            if (e.message?.includes('Stream error')) throw e;
            // Ignore parse errors on partial frames
          }
        }
      }

      const latencyMs = Math.round(performance.now() - startTime);
      this.addLog({
        id: logId,
        timestamp: Date.now(),
        endpoint: url,
        method: 'POST',
        status: 200,
        durationMs: latencyMs,
        responsePayload: {
          textLength: accumulatedText.length,
          model: finalResult?.model || body.model,
        },
      });

      return (
        finalResult || {
          text: accumulatedText,
          model: body.model || 'gemini-3.7-flash',
          tokensEstimated: Math.max(20, Math.round(accumulatedText.length / 4)),
        }
      );
    } catch (err: any) {
      console.warn('Streaming fetch failed, gracefully falling back to standard sendChatMessage:', err);
      const fallbackResult = await this.sendChatMessage(body, config);
      onChunk(fallbackResult.text, fallbackResult.text, {
        groundingSources: fallbackResult.groundingSources,
        thinking: fallbackResult.thinking,
        model: fallbackResult.model,
      });
      return fallbackResult;
    }
  }

  public async generateSpeech(
    text: string,
    options?: {
      voice?: string;
      provider?: 'gemini' | 'openai' | 'elevenlabs';
      speed?: number;
      emotion?: string;
      apiKeys?: any;
    } | string,
    config: EndpointConfig = DEFAULT_ENDPOINT_CONFIG
  ): Promise<{ audioBase64: string; mimeType?: string; provider?: string; voiceUsed?: string }> {
    const url = `${config.baseUrl}${config.speechEndpoint}`;
    const logId = Math.random().toString(36).substring(7);
    const startTime = performance.now();

    const payload = typeof options === 'string'
      ? { text, voice: options }
      : { text, ...options };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const latencyMs = Math.round(performance.now() - startTime);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Speech request returned ${response.status}`);
      }

      const resData = await response.json();
      if (!resData.success || !resData.data?.audioBase64) {
        throw new Error(resData.error || 'Neural speech generation failed');
      }

      this.addLog({
        id: logId,
        timestamp: Date.now(),
        endpoint: url,
        method: 'POST',
        status: response.status,
        durationMs: latencyMs,
        responsePayload: {
          audioLength: resData.data.audioBase64.length,
          provider: resData.data.provider,
          voiceUsed: resData.data.voiceUsed,
        },
      });

      return resData.data;
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      this.addLog({
        id: logId,
        timestamp: Date.now(),
        endpoint: url,
        method: 'POST',
        status: 'FAILED',
        durationMs: latencyMs,
        error: err.message,
      });
      throw err;
    }
  }
}

export const apiService = new ApiService();
