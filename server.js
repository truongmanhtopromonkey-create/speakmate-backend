import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import OpenAI from "openai";
import {
  getUserKey,
  checkUsage,
  recordUsage,
  buildTranscriptCacheKey,
  getCachedResult,
  setCachedResult,
  getCurrentUsage,
  getUsageConfig,
} from "./usageManager.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";

app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || "*",
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "SpeakMate Backend",
    version: "1.0.0",
  });
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    model: MODEL,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/usage-status", (req, res) => {
  const userKey = getUserKey(req);
  const isPremium = isPremiumRequest(req);
  const usage = getCurrentUsage(userKey);
  const config = getUsageConfig();

  res.json({
    ok: true,
    userKey,
    isPremium,
    usage,
    limits: {
      daily: isPremium ? config.premiumDailyLimit : config.freeDailyLimit,
      hourly: isPremium ? config.premiumHourlyLimit : null,
      cooldownSeconds: config.cooldownSeconds,
    },
  });
});

app.post("/api/review-speaking", async (req, res) => {
  try {
    const { transcript, topicTitle } = req.body ?? {};

    if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
      return res.status(400).json({
        ok: false,
        error: "Missing or invalid transcript",
      });
    }

    const topic = typeof topicTitle === "string" ? topicTitle : "General Speaking";
    const userKey = getUserKey(req);
    const isPremium = isPremiumRequest(req);

    const usageCheck = checkUsage({ userKey, isPremium });
    if (!usageCheck.ok) {
      return res.status(usageCheck.status).json({
        ok: false,
        code: usageCheck.code,
        error: usageCheck.message,
      });
    }

    const cacheKey = buildTranscriptCacheKey({
      userKey,
      topicTitle: topic,
      transcript,
    });

    const cached = getCachedResult(cacheKey);
    if (cached) {
      return res.json({
        ...cached,
        meta: {
          cached: true,
          isPremium,
        },
      });
    }

    const prompt = buildCoachingPrompt({
      topicTitle: topic,
      transcript: transcript.trim(),
    });

    const response = await client.responses.create({
      model: MODEL,
      reasoning: { effort: "low" },
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "You are a supportive English speaking coach for a mobile app. Praise first, then correct clearly and simply.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: prompt,
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "speakmate_coaching_result",
          strict: true,
          schema: coachingJsonSchema,
        },
      },
    });

    const raw = response.output_text;
    const parsed = JSON.parse(raw);

    recordUsage(userKey);
    setCachedResult(cacheKey, parsed);

    return res.json({
      ...parsed,
      meta: {
        cached: false,
        isPremium,
      },
    });
  } catch (error) {
    console.error("review-speaking error:", error);

    return res.status(500).json({
      ok: false,
      error: "Failed to review speaking transcript",
      details: error?.message || "Unknown server error",
    });
  }
});

app.post("/api/review-speaking-mock", async (req, res) => {
  const { transcript, topicTitle } = req.body ?? {};

  return res.json({
    correctedText:
      "Hi, my name is Minh. I work as a designer. I like playing football and listening to music.",
    aiScore: 78,
    pronunciationScore: 72,
    grammarScore: 80,
    fluencyScore: 74,
    vocabularyScore: 76,
    summary: "Good effort. Your answer is understandable and on topic.",
    overallRating: "Good",
    praise: [
      "You stayed on topic.",
      "Your answer was easy to understand.",
      "You mentioned your work and hobbies clearly."
    ],
    improvements: [
      {
        original: "my name Minh",
        better: "my name is Minh",
        reason: "Use 'is' after 'my name'."
      },
      {
        original: "I work designer",
        better: "I work as a designer",
        reason: "Use 'as' before a job title."
      }
    ],
    pronunciationWords: [
      {
        word: "designer",
        tip: "Stress the second syllable."
      },
      {
        word: "listening",
        tip: "Make the ending sound clear."
      }
    ],
    nextStep: "Try again and speak a little slower with the corrected version.",
    errors: [
      {
        original: "my name Minh",
        suggestion: "my name is Minh",
        type: "grammar",
        explanation: "Use the verb 'is' here."
      },
      {
        original: "I work designer",
        suggestion: "I work as a designer",
        type: "grammar",
        explanation: "Use 'as' before a profession."
      }
    ],
    debug: {
      topicTitle: topicTitle || "General Speaking",
      transcript: transcript || ""
    }
  });
});

app.listen(port, () => {
  console.log(`✅ SpeakMate backend running on port ${port}`);
});

function isPremiumRequest(req) {
  const value = req.headers["x-premium-user"];
  return String(value).toLowerCase() === "true";
}

function buildCoachingPrompt({ topicTitle, transcript }) {
  return `
Analyze this English speaking response for a mobile speaking coach app.

Topic:
${topicTitle}

Learner transcript:
${transcript}

Return only valid JSON matching the provided schema.

Rules:
- Be supportive and practical.
- Praise first.
- Keep corrections short and easy to understand.
- Focus on spoken English, not essay writing.
- Use "Excellent" only if the answer is strong and natural.
- Use "Good" if understandable with some mistakes.
- Use "Needs Improvement" only if clarity is significantly affected.
- If there are no strong pronunciation clues from text alone, give likely pronunciation practice words based on awkward or corrected words.
- improvements should be 1 to 4 items.
- praise should be 2 to 3 items.
- pronunciationWords should be 0 to 3 items.
- errors should align with the actual corrections.
`;
}

const coachingJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    correctedText: { type: "string" },
    aiScore: { type: "integer", minimum: 0, maximum: 100 },
    pronunciationScore: { type: "integer", minimum: 0, maximum: 100 },
    grammarScore: { type: "integer", minimum: 0, maximum: 100 },
    fluencyScore: { type: "integer", minimum: 0, maximum: 100 },
    vocabularyScore: { type: "integer", minimum: 0, maximum: 100 },
    summary: { type: "string" },
    overallRating: {
      type: "string",
      enum: ["Excellent", "Good", "Needs Improvement"]
    },
    praise: {
      type: "array",
      items: { type: "string" }
    },
    improvements: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          original: { type: "string" },
          better: { type: "string" },
          reason: { type: "string" }
        },
        required: ["original", "better", "reason"]
      }
    },
    pronunciationWords: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          word: { type: "string" },
          tip: { type: "string" }
        },
        required: ["word", "tip"]
      }
    },
    nextStep: { type: "string" },
    errors: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          original: { type: "string" },
          suggestion: { type: "string" },
          type: {
            type: "string",
            enum: ["pronunciation", "grammar", "fluency", "vocabulary"]
          },
          explanation: { type: "string" }
        },
        required: ["original", "suggestion", "type", "explanation"]
      }
    }
  },
  required: [
    "correctedText",
    "aiScore",
    "pronunciationScore",
    "grammarScore",
    "fluencyScore",
    "vocabularyScore",
    "summary",
    "overallRating",
    "praise",
    "improvements",
    "pronunciationWords",
    "nextStep",
    "errors"
  ]
};
