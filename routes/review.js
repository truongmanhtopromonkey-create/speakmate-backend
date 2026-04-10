import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { canConsume, consume } from '../services/usageService.js';
import { generateReview } from '../services/reviewService.js';
import { makeReviewFallback } from '../services/fallbackService.js';
import { env } from '../config/env.js';

const schema = z.object({
  body: z.object({
    transcript: z.string().min(1).max(2000),
    topicTitle: z.string().min(1).max(200)
  })
});

export const reviewRouter = Router();

reviewRouter.post('/api/review-speaking', validate(schema), async (req, res, next) => {
  try {
    const { transcript, topicTitle } = req.validated.body;
    const userId = req.userId;
    const isPremium = req.isPremium;

    const usage = canConsume({ userId, isPremium });
    if (!usage.ok) {
      return res.status(429).json({
        ok: false,
        code: usage.code,
        error: usage.code === 'DAILY_LIMIT'
          ? 'You reached today\'s free usage limit.'
          : 'You reached today\'s fair-use premium limit. Please try again later.',
        meta: { userId, isPremium, used: usage.used, limit: usage.limit }
      });
    }

    let result;
    try {
      result = await generateReview({ transcript, topicTitle, isPremium });
    } catch (error) {
      if (!env.enableFallback) throw error;
      result = makeReviewFallback({ transcript, topicTitle, isPremium });
    }

    consume({ userId, isPremium });
    return res.json(result);
  } catch (error) {
    next(error);
  }
});
