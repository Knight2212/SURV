'use client';

import { PollType, PollOption } from '@/types';

interface GeneratedQuestion {
  title: string;
  type: PollType;
  options: Array<{ text: string; isCorrect: boolean }>;
  timeLimit?: number;
}

interface GenerateQuizParams {
  topic: string;
  count?: number;
  type?: PollType;
}

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

export const isGeminiConfigured = Boolean(
  GEMINI_API_KEY && !GEMINI_API_KEY.includes('your-')
);

/**
 * Generate quiz/poll questions using Google Gemini API.
 * Falls back to a curated built-in set when no API key is configured.
 */
export async function generateQuestions({
  topic,
  count = 5,
  type = 'quiz',
}: GenerateQuizParams): Promise<GeneratedQuestion[]> {
  // If Gemini is not configured, use the built-in fallback
  if (!isGeminiConfigured) {
    return generateFallbackQuestions(topic, count, type);
  }

  const typeInstructions =
    type === 'quiz'
      ? 'Each question must have exactly 4 answer options, with exactly 1 marked as correct (isCorrect: true). Include a timeLimit of 30 seconds.'
      : type === 'multiple_choice'
      ? 'Each question must have 4-5 answer options. None should be marked as correct (all isCorrect: false).'
      : type === 'word_cloud'
      ? 'Questions should be open-ended prompts that encourage single-word or short-phrase responses. Return empty options array.'
      : type === 'rating'
      ? 'Questions should ask for satisfaction/agreement ratings (1-5 stars). Return empty options array.'
      : 'Questions should be open-ended prompts encouraging detailed text responses. Return empty options array.';

  const prompt = `You are an interactive audience engagement expert. Generate exactly ${count} engaging ${type.replace('_', ' ')} questions about: "${topic}".

${typeInstructions}

Return ONLY a valid JSON array with no additional text. Each object must have:
- "title": string (the question text, clear and engaging)
- "type": "${type}"
- "options": array of {text: string, isCorrect: boolean}
- "timeLimit": number | null (seconds, use 30 for quiz, null for others)

Make questions intellectually stimulating, varied in difficulty, and relevant to a professional/educational audience. Avoid trivia; focus on thought-provoking conceptual questions.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      console.warn('Gemini API error, using fallback:', response.statusText);
      return generateFallbackQuestions(topic, count, type);
    }

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON from Gemini response
    const parsed: GeneratedQuestion[] = JSON.parse(text);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return generateFallbackQuestions(topic, count, type);
    }

    return parsed.slice(0, count).map((q) => ({
      title: q.title || 'Untitled Question',
      type: type,
      options: Array.isArray(q.options) ? q.options : [],
      timeLimit: q.timeLimit || (type === 'quiz' ? 30 : undefined),
    }));
  } catch (err) {
    console.warn('Gemini generation failed, using fallback:', err);
    return generateFallbackQuestions(topic, count, type);
  }
}

/**
 * Built-in fallback question generator (no API required).
 * Uses topic keywords to create contextual questions.
 */
function generateFallbackQuestions(
  topic: string,
  count: number,
  type: PollType
): GeneratedQuestion[] {
  const topicLower = topic.toLowerCase();
  const baseQuestions: GeneratedQuestion[] = [];

  if (type === 'quiz' || type === 'multiple_choice') {
    const isQuiz = type === 'quiz';
    const templates = [
      {
        title: `What is the most significant challenge facing ${topic} today?`,
        options: [
          { text: 'Scalability and adoption barriers', isCorrect: isQuiz },
          { text: 'Regulatory and compliance issues', isCorrect: false },
          { text: 'Talent and skills shortage', isCorrect: false },
          { text: 'Cost and resource constraints', isCorrect: false },
        ],
      },
      {
        title: `Which approach best drives innovation in ${topic}?`,
        options: [
          { text: 'Cross-functional collaboration', isCorrect: false },
          { text: 'Data-driven decision making', isCorrect: isQuiz },
          { text: 'Rapid prototyping and iteration', isCorrect: false },
          { text: 'Strategic partnerships', isCorrect: false },
        ],
      },
      {
        title: `What will have the biggest impact on ${topic} by 2030?`,
        options: [
          { text: 'Artificial Intelligence integration', isCorrect: isQuiz },
          { text: 'Sustainable practices adoption', isCorrect: false },
          { text: 'Global market expansion', isCorrect: false },
          { text: 'Modern developer tooling', isCorrect: false },
        ],
      },
      {
        title: `How should organizations measure success in ${topic}?`,
        options: [
          { text: 'Key performance indicators (KPIs)', isCorrect: false },
          { text: 'User satisfaction and engagement', isCorrect: isQuiz },
          { text: 'Revenue growth metrics', isCorrect: false },
          { text: 'Competitive benchmarking', isCorrect: false },
        ],
      },
      {
        title: `What foundational skill is most critical for ${topic}?`,
        options: [
          { text: 'Critical thinking and analysis', isCorrect: isQuiz },
          { text: 'Communication and leadership', isCorrect: false },
          { text: 'Technical proficiency', isCorrect: false },
          { text: 'Adaptability and continuous learning', isCorrect: false },
        ],
      },
      {
        title: `Which emerging trend will reshape ${topic} most?`,
        options: [
          { text: 'Autonomous systems and agents', isCorrect: isQuiz },
          { text: 'Blockchain and decentralization', isCorrect: false },
          { text: 'Edge computing', isCorrect: false },
          { text: 'Quantum computing breakthroughs', isCorrect: false },
        ],
      },
    ];

    baseQuestions.push(
      ...templates.slice(0, count).map((t) => ({
        title: t.title,
        type,
        options: t.options,
        timeLimit: isQuiz ? 30 : undefined,
      }))
    );
  } else if (type === 'word_cloud') {
    const wordCloudTemplates = [
      `Describe ${topic} in one powerful word.`,
      `What emotion does ${topic} evoke for you?`,
      `Name one breakthrough in ${topic} you're most excited about.`,
      `In one word, how would you describe tomorrow's ${topic}?`,
      `What single improvement would transform ${topic}?`,
    ];
    baseQuestions.push(
      ...wordCloudTemplates.slice(0, count).map((title) => ({
        title,
        type,
        options: [],
      }))
    );
  } else if (type === 'rating') {
    const ratingTemplates = [
      `How confident are you about the direction of ${topic}?`,
      `Rate your organization's readiness for changes in ${topic}.`,
      `How valuable was today's discussion on ${topic}?`,
      `How prepared do you feel to apply what you've learned about ${topic}?`,
      `Rate the overall impact of ${topic} on your daily work.`,
    ];
    baseQuestions.push(
      ...ratingTemplates.slice(0, count).map((title) => ({
        title,
        type,
        options: [],
      }))
    );
  } else {
    const openTemplates = [
      `What's your biggest takeaway from the ${topic} discussion?`,
      `How would you improve the current approach to ${topic}?`,
      `Share one actionable idea related to ${topic}.`,
      `What question about ${topic} remains unanswered for you?`,
      `Describe your ideal future scenario for ${topic}.`,
    ];
    baseQuestions.push(
      ...openTemplates.slice(0, count).map((title) => ({
        title,
        type,
        options: [],
      }))
    );
  }

  return baseQuestions;
}
