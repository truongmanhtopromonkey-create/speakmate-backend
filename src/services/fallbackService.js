export function makeReviewFallback({ transcript, topicTitle, isPremium = false }) {
  const text = transcript?.trim() || 'Please try a full sentence.';
  const lowerTopic = (topicTitle || '').toLowerCase();
  let advancedAnswer = 'You can try a longer answer with clearer grammar and more detail.';
  if (lowerTopic.includes('food')) advancedAnswer = 'My favorite food is pizza because it is delicious and easy to share with friends.';
  if (lowerTopic.includes('introduce')) advancedAnswer = 'Hi, my name is Alex. I am a student and I enjoy learning English every day.';

  return {
    correctedText: text,
    aiScore: 62,
    pronunciationScore: 60,
    grammarScore: 61,
    fluencyScore: 63,
    vocabularyScore: 60,
    summary: 'Good effort. This is basic feedback while the AI service is temporarily busy.',
    overallRating: 'Good',
    praise: ['You completed a speaking attempt.', 'Your answer is understandable.'],
    improvements: [],
    pronunciationWords: [],
    nextStep: 'Try again with one longer sentence and a little more detail.',
    errors: [],
    advancedAnswer,
    meta: { cached: false, isPremium, isFallback: true }
  };
}

export function makeConversationFallback({ mode, roleplay, userMessage }) {
  const wc = userMessage.trim().split(/\s+/).filter(Boolean).length;
  const grammar = Math.max(55, Math.min(82, 55 + wc * 3));
  const fluency = Math.max(58, Math.min(84, 58 + wc * 2));
  const naturalness = Math.max(56, Math.min(80, 56 + wc * 2));

  let reply = 'Nice answer. Can you tell me more?';
  if (roleplay === 'restaurant') reply = 'Great choice. What would you like to drink with that?';
  else if (roleplay === 'airport') reply = 'Good. What would you say at the check-in counter next?';
  else if (mode === 'interview') reply = 'Good start. Can you tell me about one of your strengths?';
  else if (mode === 'work') reply = 'That sounds clear. How would you explain one of your daily tasks?';

  const suggestedReplies = roleplay === 'restaurant'
    ? ['I would like a cola, please.', 'Can I have water instead?', 'That is all, thank you.']
    : mode === 'travel'
    ? ['Could you help me find the station?', 'How much is a ticket?', 'Where is the nearest hotel?']
    : mode === 'interview'
    ? ['I am a quick learner.', 'I work well with a team.', 'I am good at communication.']
    : mode === 'work'
    ? ['I usually prepare reports.', 'I work closely with my team.', 'I often handle client messages.']
    : ['I enjoy music and movies.', 'I want to speak English better.', 'I usually spend time with my family.'];

  return {
    reply,
    correctedUserText: userMessage,
    quickFeedback: 'Basic feedback is shown while the AI conversation service is busy.',
    suggestedReplies,
    score: { grammar, fluency, naturalness },
    pronunciation: {
      hardWords: userMessage.split(/\s+/).filter(w => w.length >= 7).slice(0, 3),
      tip: 'Try speaking a little slower and stress the most important words clearly.'
    },
    isFallback: true
  };
}
