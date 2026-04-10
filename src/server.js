import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { apiRouter } from './routes/index.js';
import { requestContext } from './middleware/requestContext.js';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: env.allowOrigins === '*' ? true : env.allowOrigins.split(',').map(s => s.trim()) }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(pinoHttp({ logger }));
app.use(requestContext);

app.use(apiRouter);

app.use((err, req, res, _next) => {
  req.log?.error?.(err);
  const message = typeof err?.message === 'string' ? err.message : 'Internal server error';
  res.status(err?.status || 500).json({
    ok: false,
    code: 'INTERNAL_ERROR',
    error: env.nodeEnv === 'production' ? 'Server is temporarily unavailable.' : message
  });
});

app.listen(env.port, () => {
  logger.info({ port: env.port }, 'SpeakFlow backend listening');
});
