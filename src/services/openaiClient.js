import { env } from '../config/env.js';

function getHeaders(extra = {}) {
  return {
    Authorization: `Bearer ${env.openaiApiKey}`,
    ...extra
  };
}

export function extractResponseText(payload) {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text;
  }

  const outputs = Array.isArray(payload?.output) ? payload.output : [];
  for (const item of outputs) {
    if (!Array.isArray(item?.content)) continue;
    for (const content of item.content) {
      if (typeof content?.text === 'string' && content.text.trim()) return content.text;
      if (content?.type === 'output_text' && typeof content?.text === 'string' && content.text.trim()) return content.text;
    }
  }

  return '';
}

export async function createStructuredResponse({ systemPrompt, userPrompt, schemaName, schema, reasoningEffort = 'low' }) {
  if (!env.openaiApiKey) throw new Error('OPENAI_API_KEY_MISSING');

  const res = await fetch(`${env.openaiBaseUrl}/responses`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      model: env.openaiTextModel,
      reasoning: { effort: reasoningEffort },
      store: false,
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: systemPrompt }]
        },
        {
          role: 'user',
          content: [{ type: 'input_text', text: userPrompt }]
        }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: schemaName,
          schema,
          strict: true
        }
      }
    })
  });

  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`OPENAI_RESPONSES_${res.status}: ${text}`);
    err.status = res.status;
    throw err;
  }

  const payload = await res.json();
  const text = extractResponseText(payload);
  if (!text) throw new Error('OPENAI_EMPTY_TEXT');
  return JSON.parse(text);
}

export async function createSpeech({ text, voice = env.openaiTtsVoice, instructions = 'Warm, encouraging, clear English coach.' }) {
  if (!env.openaiApiKey) throw new Error('OPENAI_API_KEY_MISSING');

  const res = await fetch(`${env.openaiBaseUrl}/audio/speech`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      model: env.openaiTtsModel,
      input: text,
      voice,
      instructions,
      response_format: 'mp3'
    })
  });

  if (!res.ok) {
    const textBody = await res.text();
    const err = new Error(`OPENAI_TTS_${res.status}: ${textBody}`);
    err.status = res.status;
    throw err;
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function createTranscription({ buffer, filename = 'audio.m4a', language = 'en', prompt = 'Short learner spoken English.' }) {
  if (!env.openaiApiKey) throw new Error('OPENAI_API_KEY_MISSING');

  const form = new FormData();
  form.append('file', new Blob([buffer]), filename);
  form.append('model', env.openaiSttModel);
  form.append('language', language);
  form.append('prompt', prompt);
  form.append('response_format', 'json');

  const res = await fetch(`${env.openaiBaseUrl}/audio/transcriptions`, {
    method: 'POST',
    headers: getHeaders(),
    body: form
  });

  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`OPENAI_TRANSCRIBE_${res.status}: ${text}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}
