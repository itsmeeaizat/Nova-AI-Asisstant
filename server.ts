/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { processChatRequest, processSpeechRequest } from './src/server/geminiService.ts';
import { AVAILABLE_MODELS } from './src/config/endpoints.ts';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Nova Multi-Model AI Assistant Server',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    providersConfigured: {
      google: Boolean(process.env.GEMINI_API_KEY),
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
      moonshot: Boolean(process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY),
      openai: Boolean(process.env.OPENAI_API_KEY),
      deepseek: Boolean(process.env.DEEPSEEK_API_KEY),
      groq: Boolean(process.env.GROQ_API_KEY),
      openrouter: Boolean(process.env.OPENROUTER_API_KEY),
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

app.post('/api/chat', async (req, res) => {
  try {
    const result = await processChatRequest(req.body);
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Chat endpoint error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
  }
});

app.post('/api/speech', async (req, res) => {
  try {
    const { text, voice } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'Text is required for TTS' });
    }
    const result = await processSpeechRequest(text, voice || 'Kore');
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Speech endpoint error:', err);
    res.status(500).json({ success: false, error: err.message || 'TTS Error' });
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
