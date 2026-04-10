import { Router } from 'express';
import { healthRouter } from './health.js';
import { reviewRouter } from './review.js';
import { conversationRouter } from './conversation.js';

export const apiRouter = Router();
apiRouter.use(healthRouter);
apiRouter.use(reviewRouter);
apiRouter.use(conversationRouter);
