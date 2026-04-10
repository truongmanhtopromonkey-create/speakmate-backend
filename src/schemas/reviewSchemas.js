export const reviewResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'correctedText',
    'aiScore',
    'pronunciationScore',
    'grammarScore',
    'fluencyScore',
    'vocabularyScore',
    'summary',
    'overallRating',
    'praise',
    'improvements',
    'pronunciationWords',
    'nextStep',
    'errors',
    'advancedAnswer',
    'meta'
  ],
  properties: {
    correctedText: { type: 'string' },
    aiScore: { type: 'integer', minimum: 0, maximum: 100 },
    pronunciationScore: { type: 'integer', minimum: 0, maximum: 100 },
    grammarScore: { type: 'integer', minimum: 0, maximum: 100 },
    fluencyScore: { type: 'integer', minimum: 0, maximum: 100 },
    vocabularyScore: { type: 'integer', minimum: 0, maximum: 100 },
    summary: { type: 'string' },
    overallRating: { type: 'string' },
    praise: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 4 },
    improvements: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['original', 'better', 'reason'],
        properties: {
          original: { type: 'string' },
          better: { type: 'string' },
          reason: { type: 'string' }
        }
      },
      maxItems: 5
    },
    pronunciationWords: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['word', 'tip'],
        properties: {
          word: { type: 'string' },
          tip: { type: 'string' }
        }
      },
      maxItems: 5
    },
    nextStep: { type: 'string' },
    errors: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['original', 'suggestion', 'type', 'explanation'],
        properties: {
          original: { type: 'string' },
          suggestion: { type: 'string' },
          type: { type: 'string', enum: ['pronunciation', 'grammar', 'fluency', 'vocabulary'] },
          explanation: { type: 'string' }
        }
      },
      maxItems: 6
    },
    advancedAnswer: { type: 'string' },
    meta: {
      type: 'object',
      additionalProperties: false,
      required: ['cached', 'isPremium', 'isFallback'],
      properties: {
        cached: { type: 'boolean' },
        isPremium: { type: 'boolean' },
        isFallback: { type: 'boolean' }
      }
    }
  }
};

export const conversationResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'reply',
    'correctedUserText',
    'quickFeedback',
    'suggestedReplies',
    'score',
    'pronunciation',
    'isFallback'
  ],
  properties: {
    reply: { type: 'string' },
    correctedUserText: { type: 'string' },
    quickFeedback: { type: 'string' },
    suggestedReplies: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 3 },
    score: {
      type: 'object',
      additionalProperties: false,
      required: ['grammar', 'fluency', 'naturalness'],
      properties: {
        grammar: { type: 'integer', minimum: 0, maximum: 100 },
        fluency: { type: 'integer', minimum: 0, maximum: 100 },
        naturalness: { type: 'integer', minimum: 0, maximum: 100 }
      }
    },
    pronunciation: {
      type: 'object',
      additionalProperties: false,
      required: ['hardWords', 'tip'],
      properties: {
        hardWords: { type: 'array', items: { type: 'string' }, maxItems: 4 },
        tip: { type: 'string' }
      }
    },
    isFallback: { type: 'boolean' }
  }
};
