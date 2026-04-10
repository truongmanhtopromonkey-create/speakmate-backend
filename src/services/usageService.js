import path from 'path';
import { env } from '../config/env.js';
import { JSONFileStore } from '../utils/jsonFileStore.js';

const store = new JSONFileStore(path.join(process.cwd(), 'src', 'data', 'usage.json'), {});

const dayKey = () => new Date().toISOString().slice(0, 10);

export function getUsage(userId) {
  const raw = store.read();
  const today = dayKey();
  const byUser = raw[userId] || {};
  const record = byUser[today] || { free: 0, premium: 0 };
  return { today, ...record };
}

export function canConsume({ userId, isPremium }) {
  const raw = store.read();
  const today = dayKey();
  const byUser = raw[userId] || {};
  const record = byUser[today] || { free: 0, premium: 0 };

  if (!isPremium) {
    return { ok: record.free < env.freeDailyLimit, used: record.free, limit: env.freeDailyLimit, code: 'DAILY_LIMIT' };
  }

  if (env.enablePremiumSoftLimit && record.premium >= env.premiumDailySoftLimit) {
    return { ok: false, used: record.premium, limit: env.premiumDailySoftLimit, code: 'PREMIUM_SOFT_LIMIT' };
  }

  return {
    ok: true,
    used: isPremium ? record.premium : record.free,
    limit: isPremium ? env.premiumDailySoftLimit : env.freeDailyLimit,
    code: null
  };
}

export function consume({ userId, isPremium }) {
  const raw = store.read();
  const today = dayKey();
  raw[userId] ||= {};
  raw[userId][today] ||= { free: 0, premium: 0 };

  if (isPremium) raw[userId][today].premium += 1;
  else raw[userId][today].free += 1;

  store.write(raw);
  return raw[userId][today];
}
