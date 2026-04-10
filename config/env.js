import dotenv from 'dotenv';

dotenv.config();

const bool = (v, fallback = false) => {
  if (v == null) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
};

export const env = {
  port: Number(process.env.PORT || 8080),
  nodeEnv: process.env.NODE_ENV || 'development',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  openaiTextModel: process.env.OPENAI_TEXT_MODEL || 'gpt-5.4-mini',
  openaiTtsModel: process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts',
  openaiSttModel: process.env.OPENAI_STT_MODEL || 'gpt-4o-mini-transcribe',
  openaiTtsVoice: process.env.OPENAI_TTS_VOICE || 'alloy',
  freeDailyLimit: Number(process.env.FREE_DAILY_LIMIT || 3),
  premiumDailySoftLimit: Number(process.env.PREMIUM_DAILY_SOFT_LIMIT || 50),
  enablePremiumSoftLimit: bool(process.env.ENABLE_PREMIUM_SOFT_LIMIT, true),
  enableFallback: bool(process.env.ENABLE_FALLBACK, true),
  allowOrigins: process.env.ALLOW_ORIGINS || '*'
};

if (!env.openaiApiKey) {
  console.warn('⚠️ OPENAI_API_KEY is missing. Routes that call OpenAI will use fallback only.');
}
