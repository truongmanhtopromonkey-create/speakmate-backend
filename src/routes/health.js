import { Router } from 'express';
import { env } from '../config/env.js';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'speakflow-backend-production',
    env: env.nodeEnv,
    hasOpenAIKey: Boolean(env.openaiApiKey),
    textModel: env.openaiTextModel,
    ttsModel: env.openaiTtsModel,
    sttModel: env.openaiSttModel
  });
});

healthRouter.get('/api/config', (_req, res) => {
  res.json({
    ok: true,
    freeDailyLimit: env.freeDailyLimit,
    premiumDailySoftLimit: env.enablePremiumSoftLimit ? env.premiumDailySoftLimit : null,
    premiumSoftLimitEnabled: env.enablePremiumSoftLimit
  });
});
