import { createStructuredResponse } from './openaiClient.js';
import { reviewResponseSchema } from '../schemas/reviewSchemas.js';

export async function generateReview({ transcript, topicTitle, isPremium }) {
  const systemPrompt = [
    'You are an expert but friendly English speaking coach for mobile learners.',
    'Return only the JSON that matches the schema.',
    'Be concise, practical, and encouraging.',
    'Scores must be realistic and internally consistent.',
    'If the transcript is very short, still provide useful feedback.'
  ].join(' ');

  const userPrompt = [
    `Topic: ${topicTitle}`,
    `Transcript: ${transcript}`,
    'Tasks:',
    '1) Correct the sentence naturally.',
    '2) Score the answer for aiScore, pronunciationScore, grammarScore, fluencyScore, vocabularyScore (0-100).',
    '3) Give a short summary and overall rating.',
    '4) Return 1-3 praise items.',
    '5) Return 0-4 improvements.',
    '6) Return 0-3 pronunciationWords.',
    '7) Return nextStep.',
    '8) Return 0-4 errors using only: pronunciation, grammar, fluency, vocabulary.',
    '9) Return an advancedAnswer that sounds more natural and complete.',
    `10) meta.cached=false, meta.isPremium=${isPremium ? 'true' : 'false'}, meta.isFallback=false.`
  ].join('\n');

  return createStructuredResponse({
    systemPrompt,
    userPrompt,
    schemaName: 'review_speaking_response',
    schema: reviewResponseSchema,
    reasoningEffort: 'low'
  });
}
