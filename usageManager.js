import crypto from "crypto";

const memoryStore = {
  users: new Map(),
  cache: new Map(),
};

const CONFIG = {
  freeDailyLimit: 3,
  premiumDailyLimit: 40,
  premiumHourlyLimit: 12,
  cooldownSeconds: 8,
  cacheMinutes: 15,
};

export function getUsageConfig() {
  return CONFIG;
}

export function getUserKey(req) {
  const explicitUserId = req.headers["x-user-id"];
  if (explicitUserId && typeof explicitUserId === "string") {
    return explicitUserId;
  }

  const forwardedFor = req.headers["x-forwarded-for"];
  const ip =
    typeof forwardedFor === "string"
      ? forwardedFor.split(",")[0].trim()
      : req.ip || "unknown";

  return `ip:${ip}`;
}

export function getCurrentUsage(userKey) {
  const user = ensureUser(userKey);
  cleanupUser(user);

  return {
    dailyCount: user.daily.length,
    hourlyCount: user.hourly.length,
    lastRequestAt: user.lastRequestAt,
  };
}

export function checkUsage({ userKey, isPremium }) {
  const user = ensureUser(userKey);
  cleanupUser(user);

  const now = Date.now();

  if (user.lastRequestAt) {
    const diffSec = (now - user.lastRequestAt) / 1000;
    if (diffSec < CONFIG.cooldownSeconds) {
      return {
        ok: false,
        status: 429,
        code: "COOLDOWN",
        message: `Please wait ${Math.ceil(CONFIG.cooldownSeconds - diffSec)} seconds before trying again.`,
      };
    }
  }

  const dailyLimit = isPremium ? CONFIG.premiumDailyLimit : CONFIG.freeDailyLimit;

  if (user.daily.length >= dailyLimit) {
    return {
      ok: false,
      status: 429,
      code: "DAILY_LIMIT",
      message: isPremium
        ? "You reached today's fair usage limit for premium."
        : "You reached today's free usage limit.",
    };
  }

  if (isPremium && user.hourly.length >= CONFIG.premiumHourlyLimit) {
    return {
      ok: false,
      status: 429,
      code: "HOURLY_LIMIT",
      message: "You reached the hourly premium usage limit. Please try again later.",
    };
  }

  return { ok: true };
}

export function recordUsage(userKey) {
  const user = ensureUser(userKey);
  cleanupUser(user);

  const now = Date.now();
  user.daily.push(now);
  user.hourly.push(now);
  user.lastRequestAt = now;
}

export function buildTranscriptCacheKey({ userKey, topicTitle, transcript }) {
  const normalized = `${userKey}|${topicTitle}|${normalizeTranscript(transcript)}`;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

export function getCachedResult(cacheKey) {
  const item = memoryStore.cache.get(cacheKey);
  if (!item) return null;

  const now = Date.now();
  if (item.expiresAt < now) {
    memoryStore.cache.delete(cacheKey);
    return null;
  }

  return item.value;
}

export function setCachedResult(cacheKey, value) {
  const expiresAt = Date.now() + CONFIG.cacheMinutes * 60 * 1000;
  memoryStore.cache.set(cacheKey, { value, expiresAt });
}

function ensureUser(userKey) {
  if (!memoryStore.users.has(userKey)) {
    memoryStore.users.set(userKey, {
      daily: [],
      hourly: [],
      lastRequestAt: null,
    });
  }
  return memoryStore.users.get(userKey);
}

function cleanupUser(user) {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  user.hourly = user.hourly.filter(ts => ts > oneHourAgo);
  user.daily = user.daily.filter(ts => ts > oneDayAgo);
}

function normalizeTranscript(text) {
  return String(text)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
