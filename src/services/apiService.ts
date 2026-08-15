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
