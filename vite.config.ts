import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import { processChatRequest, processSpeechRequest } from './src/server/geminiService';
import { AVAILABLE_MODELS } from './src/config/endpoints';

function apiServerPlugin(): Plugin {
  return {
    name: 'api-server-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api')) {
          return next();
        }

        // Set CORS & JSON headers
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }

        const url = new URL(req.url, 'http://localhost:3000');

        // Health check endpoint
        if (url.pathname === '/api/health' && req.method === 'GET') {
          res.statusCode = 200;
          return res.end(JSON.stringify({
            status: 'online',
            service: 'Nova AI Assistant Server',
            hasApiKey: Boolean(process.env.GEMINI_API_KEY),
            timestamp: Date.now(),
          }));
        }

        // Models list endpoint
        if (url.pathname === '/api/models' && req.method === 'GET') {
          res.statusCode = 200;
          return res.end(JSON.stringify({
            models: AVAILABLE_MODELS,
            defaultModel: 'gemini-3.7-flash',
          }));
        }

        // Helper to parse JSON body
        const readBody = (): Promise<any> => {
          return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
              if (body.length > 50 * 1024 * 1024) {
                // 50MB payload limit
                reject(new Error('Payload too large'));
              }
            });
            req.on('end', () => {
              try {
                resolve(body ? JSON.parse(body) : {});
              } catch (e) {
                reject(e);
              }
            });
            req.on('error', reject);
          });
        };

        // Chat inference endpoint
        if (url.pathname === '/api/chat' && req.method === 'POST') {
          try {
            const body = await readBody();
            const result = await processChatRequest(body);
            res.statusCode = 200;
            return res.end(JSON.stringify({
              success: true,
              data: result,
            }));
          } catch (err: any) {
            console.error('Chat endpoint error:', err);
            res.statusCode = 500;
            return res.end(JSON.stringify({
              success: false,
              error: err.message || 'Internal Server Error',
            }));
          }
        }

        // Speech TTS endpoint
        if (url.pathname === '/api/speech' && req.method === 'POST') {
          try {
            const body = await readBody();
            const { text, voice } = body;
            if (!text) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ success: false, error: 'Text is required for TTS' }));
            }
            const result = await processSpeechRequest(text, voice || 'Kore');
            res.statusCode = 200;
            return res.end(JSON.stringify({
              success: true,
              data: result,
            }));
          } catch (err: any) {
            console.error('Speech endpoint error:', err);
            res.statusCode = 500;
            return res.end(JSON.stringify({
              success: false,
              error: err.message || 'TTS Error',
            }));
          }
        }

        // Default 404 for unknown /api/*
        res.statusCode = 404;
        return res.end(JSON.stringify({ success: false, error: 'Endpoint not found' }));
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
