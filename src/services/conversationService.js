import { createStructuredResponse } from './openaiClient.js';
import { conversationResponseSchema } from '../schemas/reviewSchemas.js';

function modePrompt(mode, roleplay, goal) {
  return [
    'You are a warm English conversation coach inside a mobile app.',
    mode ? `Conversation mode: ${mode}.` : '',
    roleplay ? `Roleplay scenario: ${roleplay}.` : '',
    goal ? `Primary learner goal: ${goal}.` : '',
    'Reply in 1-3 short natural sentences and end with one follow-up question when helpful.',
    'Correct the user sentence naturally.',
    'Give short mobile-friendly feedback.',
    'Return three suggested replies that are short and tappable.',
    'Keep the tone encouraging, practical, and simple.'
  ].filter(Boolean).join(' ');
}

function renderHistory(history) {
  return history.slice(-12).map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
}

export async function generateConversationReply({ mode, roleplay, goal, userMessage, history }) {
  const systemPrompt = modePrompt(mode, roleplay, goal);
  const userPrompt = [
    history?.length ? `Conversation so far:\n${renderHistory(history)}` : 'No prior history.',
    `Latest learner message: ${userMessage}`,
    'Requirements:',
    '- reply should continue the conversation naturally',
    '- correctedUserText should fix grammar and naturalness',
    '- quickFeedback should be 1 short sentence',
    '- suggestedReplies must be short',
    '- score should be realistic',
    '- pronunciation.hardWords should contain up to 4 difficult words from the learner text if helpful',
    '- isFallback must be false'
  ].join('\n\n');

  return createStructuredResponse({
    systemPrompt,
    userPrompt,
    schemaName: 'conversation_reply_response',
    schema: conversationResponseSchema,
    reasoningEffort: 'low'
  });
}
