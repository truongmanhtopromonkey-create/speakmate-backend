import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const speakSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    original: { type: "string" },
    corrected: { type: "string" },
    explanation: { type: "string" },
    ai_reply: { type: "string" },
    repeat_after_me: { type: "string" }
  },
  required: ["original", "corrected", "explanation", "ai_reply", "repeat_after_me"]
};

function buildSystemPrompt() {
  return `
You are an English speaking coach for ESL learners.

Your job:
- Correct grammar naturally
- Keep explanations short and beginner-friendly
- Continue the conversation with one natural reply
- Provide one short sentence for the learner to repeat

Rules:
- Keep "explanation" under 35 words
- Keep "ai_reply" natural and conversational
- Keep "repeat_after_me" short and easy to pronounce
- Do not add markdown
- Output must follow the JSON schema exactly
`.trim();
}

function buildUserPrompt(text, topic) {
  return `
Topic: ${topic}

Learner sentence:
"${text}"

Return the structured coaching result.
`.trim();
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/speak/evaluate", async (req, res) => {
  try {
    const { text, topic = "Daily Talk" } = req.body ?? {};

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "Missing OPENAI_API_KEY in .env"
      });
    }

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        error: "Missing or empty 'text'"
      });
    }

    const response = await client.responses.create({
      model: "gpt-5.4-mini",
      reasoning: { effort: "none" },
      text: {
        verbosity: "low",
        format: {
          type: "json_schema",
          name: "speak_coach_result",
          strict: true,
          schema: speakSchema
        }
      },
      input: [
        {
          role: "developer",
          content: buildSystemPrompt()
        },
        {
          role: "user",
          content: buildUserPrompt(text.trim(), topic)
        }
      ]
    });

    const parsed = JSON.parse(response.output_text);
    return res.json(parsed);
  } catch (error) {
    console.error("OpenAI error:", error);
    return res.status(500).json({
      error: "Failed to evaluate speech"
    });
  }
});

app.listen(process.env.PORT || 3000, "0.0.0.0", () => {
  console.log(`SpeakMate backend running on port ${process.env.PORT || 3000}`);
});
