import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { canConsume, consume } from '../services/usageService.js';
import { generateConversationReply } from '../services/conversationService.js';
import { makeConversationFallback } from '../services/fallbackService.js';
import { createSpeech, createTranscription } from '../services/openaiClient.js';
import { env } from '../config/env.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const replySchema = z.object({
  body: z.object({
    mode: z.string().min(1).max(50),
    goal: z.string().max(50).optional().nullable(),
    roleplay: z.string().max(50).optional().nullable(),
    userMessage: z.string().min(1).max(2000),
    history: z.array(z.object({ role: z.enum(['user', 'assistant', 'system']), content: z.string().min(1).max(4000) })).default([])
  })
});

const ttsSchema = z.object({
  body: z.object({
    text: z.string().min(1).max(4096),
    voice: z.string().optional(),
    instructions: z.string().max(4096).optional()
  })
});

export const conversationRouter = Router();

conversationRouter.post('/api/conversation/reply', validate(replySchema), async (req, res, next) => {
  try {
    const { mode, goal, roleplay, userMessage, history } = req.validated.body;
    const userId = req.userId;
    const isPremium = req.isPremium;

    const usage = canConsume({ userId, isPremium });
    if (!usage.ok) {
      return res.status(429).json({
        ok: false,
        code: usage.code,
        error: usage.code === 'DAILY_LIMIT'
          ? 'You reached today\'s free usage limit.'
          : 'You reached today\'s fair-use premium limit. Please try again later.'
      });
    }

    let result;
    try {
      result = await generateConversationReply({ mode, goal, roleplay, userMessage, history });
    } catch (error) {
      if (!env.enableFallback) throw error;
      result = makeConversationFallback({ mode, roleplay, userMessage });
    }

    consume({ userId, isPremium });
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

conversationRouter.post('/api/tts', validate(ttsSchema), async (req, res, next) => {
  try {
    const { text, voice, instructions } = req.validated.body;
    const buffer = await createSpeech({ text, voice, instructions });
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

conversationRouter.post('/api/conversation/pronunciation', upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, code: 'MISSING_AUDIO', error: 'audio file is required' });
    }

    const transcript = String(req.body.transcript || '').trim();
    const transcribed = await createTranscription({
      buffer: req.file.buffer,
      filename: req.file.originalname || 'speech.m4a',
      language: 'en',
      prompt: transcript || 'Short learner spoken English.'
    });

    const finalText = transcript || transcribed.text || '';
    const words = finalText.split(/\s+/).filter(Boolean);
    const hardWords = words.filter((w) => w.length >= 7).slice(0, 4);
    const score = Math.max(55, Math.min(90, 58 + Math.min(words.length, 10) * 3));

    res.json({
      score,
      hardWords,
      tip: 'Try speaking slightly slower and stress longer words more clearly.',
      transcript: transcribed.text || finalText
    });
  } catch (error) {
    next(error);
  }
});
