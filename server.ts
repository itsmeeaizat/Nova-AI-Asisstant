/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { processChatRequest, processChatStreamRequest, processSpeechRequest } from './src/server/geminiService.ts';
import { AVAILABLE_MODELS } from './src/config/endpoints.ts';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to sanitize key
function isValidKey(k?: string): boolean {
  if (!k) return false;
  const trimmed = k.trim();
  return (
    trimmed.length > 0 &&
    trimmed !== 'MY_GEMINI_API_KEY' &&
    trimmed !== 'MY_APP_URL' &&
    !trimmed.startsWith('YOUR_') &&
    !trimmed.startsWith('<') &&
    trimmed !== 'undefined' &&
    trimmed !== 'null'
  );
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Nova Multi-Model AI Assistant Server',
    hasApiKey: isValidKey(process.env.GEMINI_API_KEY),
    providersConfigured: {
      google: isValidKey(process.env.GEMINI_API_KEY),
      anthropic: isValidKey(process.env.ANTHROPIC_API_KEY),
      moonshot: isValidKey(process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY),
      openai: isValidKey(process.env.OPENAI_API_KEY),
      deepseek: isValidKey(process.env.DEEPSEEK_API_KEY),
      groq: isValidKey(process.env.GROQ_API_KEY),
      openrouter: isValidKey(process.env.OPENROUTER_API_KEY),
      elevenlabs: isValidKey(process.env.ELEVENLABS_API_KEY),
      custom: Boolean(process.env.CUSTOM_BASE_URL),
    },
    timestamp: Date.now(),
  });
});

app.get('/api/models', (req, res) => {
  res.json({
    models: AVAILABLE_MODELS,
    defaultModel: 'gemini-3.7-flash',
  });
});

// Standard Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const result = await processChatRequest(req.body);
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Chat endpoint error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
  }
});

// Real-Time Server-Sent Events (SSE) Streaming Endpoint
app.post('/api/chat/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  try {
    const finalResult = await processChatStreamRequest(req.body, (chunk) => {
      res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk.text || '', thinking: chunk.thinking, groundingSources: chunk.groundingSources })}\n\n`);
    });

    res.write(`data: ${JSON.stringify({ type: 'done', data: finalResult })}\n\n`);
    res.end();
  } catch (err: any) {
    console.error('Chat stream endpoint error:', err);
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message || 'Streaming failed' })}\n\n`);
    res.end();
  }
});

app.post('/api/speech', async (req, res) => {
  try {
    const { text, voice, provider, speed, emotion, apiKeys } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'Text is required for Real-Time Neural Speech' });
    }
    const result = await processSpeechRequest({
      text,
      voice,
      provider,
      speed,
      emotion,
      clientKeys: apiKeys,
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Speech endpoint error:', err);
    res.status(500).json({ success: false, error: err.message || 'Generative Neural Audio Error' });
  }
});

// Serve static assets in production
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Nova AI server running on port ${PORT}`);
});
