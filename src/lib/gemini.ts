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
  timeLimit?: number | null;
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
  timeLimit,
}: GenerateQuizParams): Promise<GeneratedQuestion[]> {
  // If Gemini is not configured, use the built-in fallback
  if (!isGeminiConfigured) {
    return generateFallbackQuestions(topic, count, type, timeLimit);
  }

  const effectiveTimeLimit = typeof timeLimit === 'number' ? timeLimit : type === 'quiz' ? 30 : null;

  const typeInstructions =
    type === 'quiz'
      ? `Each question must have exactly 4 answer options, with exactly 1 marked as correct (isCorrect: true). Include a timeLimit of ${effectiveTimeLimit || 30} seconds.`
      : type === 'multiple_choice'
      ? `Each question must have 4-5 answer options. None should be marked as correct (all isCorrect: false). Time limit: ${effectiveTimeLimit ? `${effectiveTimeLimit} seconds` : 'null'}.`
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
- "timeLimit": ${effectiveTimeLimit ? effectiveTimeLimit : 'null'}

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
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      console.warn('Gemini API error, using fallback:', response.statusText);
      return generateFallbackQuestions(topic, count, type, timeLimit);
    }

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON from Gemini response
    const parsed: GeneratedQuestion[] = JSON.parse(text);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return generateFallbackQuestions(topic, count, type, timeLimit);
    }

    return parsed.slice(0, count).map((q) => ({
      title: q.title || 'Untitled Question',
      type: type,
      options: Array.isArray(q.options) ? q.options : [],
      timeLimit: typeof q.timeLimit === 'number' ? q.timeLimit : effectiveTimeLimit || undefined,
    }));
  } catch (err) {
    console.warn('Gemini generation failed, using fallback:', err);
    return generateFallbackQuestions(topic, count, type, timeLimit);
  }
}

/**
 * Built-in fallback question generator (no API required).
 * Procedurally generates any requested count (e.g. 1 to 50+) using topic keywords and domain frameworks.
 */
function generateFallbackQuestions(
  topic: string,
  count: number,
  type: PollType,
  timeLimit?: number | null
): GeneratedQuestion[] {
  const isQuiz = type === 'quiz';
  const effectiveTimeLimit = typeof timeLimit === 'number' ? timeLimit : isQuiz ? 30 : undefined;
  const baseQuestions: GeneratedQuestion[] = [];

  const frameworks = [
    {
      q: `What is the most critical challenge facing ${topic} today?`,
      opts: [
        { text: 'Scalability and enterprise adoption barriers', isCorrect: isQuiz },
        { text: 'Regulatory compliance and governance constraints', isCorrect: false },
        { text: 'Talent gaps and organizational friction', isCorrect: false },
        { text: 'Cost efficiency and resource allocation', isCorrect: false },
      ],
    },
    {
      q: `Which strategic approach best accelerates progress in ${topic}?`,
      opts: [
        { text: 'Cross-functional alignment and unified tooling', isCorrect: false },
        { text: 'Data-driven telemetry and fast iteration cycles', isCorrect: isQuiz },
        { text: 'Monolithic consolidation with minimal dependencies', isCorrect: false },
        { text: 'Outsourcing core workflows to external vendors', isCorrect: false },
      ],
    },
    {
      q: `What will have the most disruptive impact on ${topic} over the next 5 years?`,
      opts: [
        { text: 'Autonomous AI agents and automated reasoning', isCorrect: isQuiz },
        { text: 'Legacy protocol standardization', isCorrect: false },
        { text: 'On-premise hardware centralization', isCorrect: false },
        { text: 'Modern developer tooling', isCorrect: false },
      ],
    },
    {
      q: `How should teams measure tangible success in ${topic}?`,
      opts: [
        { text: 'Qualitative vanity benchmarks', isCorrect: false },
        { text: 'End-user satisfaction and system reliability metrics', isCorrect: isQuiz },
        { text: 'Total volume of code committed', isCorrect: false },
        { text: 'Ad-hoc stakeholder consensus', isCorrect: false },
      ],
    },
    {
      q: `What foundational competency is most essential when scaling ${topic}?`,
      opts: [
        { text: 'Rigorous architectural modeling and continuous learning', isCorrect: isQuiz },
        { text: 'Strict top-down managerial authorization', isCorrect: false },
        { text: 'Reliance on single-vendor proprietary suites', isCorrect: false },
        { text: 'Elimination of automated test suites', isCorrect: false },
      ],
    },
    {
      q: `Which architectural principle should guide long-term stability in ${topic}?`,
      opts: [
        { text: 'Decoupled asynchronous boundaries with strong isolation', isCorrect: isQuiz },
        { text: 'Tight bidirectional coupling between all components', isCorrect: false },
        { text: 'Global shared state across distributed instances', isCorrect: false },
        { text: 'Manual synchronization protocols', isCorrect: false },
      ],
    },
    {
      q: `When evaluating tradeoffs in ${topic}, what should be prioritized first?`,
      opts: [
        { text: 'Resilience and predictable latency under peak load', isCorrect: isQuiz },
        { text: 'Premature micro-optimizations over correctness', isCorrect: false },
        { text: 'Complex abstractions with minimal test coverage', isCorrect: false },
        { text: 'Vendor lock-in with proprietary protocols', isCorrect: false },
      ],
    },
    {
      q: `How can organizations best mitigate risk when modernizing ${topic}?`,
      opts: [
        { text: 'Canary deployments, dark launches, and automated rollbacks', isCorrect: isQuiz },
        { text: 'Big-bang all-at-once cutovers over a weekend', isCorrect: false },
        { text: 'Bypassing staging environments to move faster', isCorrect: false },
        { text: 'Freezing updates for multiple quarters', isCorrect: false },
      ],
    },
    {
      q: `What is the most common anti-pattern observed in ${topic}?`,
      opts: [
        { text: 'Over-engineering solutions before validating user demand', isCorrect: isQuiz },
        { text: 'Comprehensive end-to-end integration testing', isCorrect: false },
        { text: 'Explicit observability and alerting thresholds', isCorrect: false },
        { text: 'Zero-trust authentication between service tiers', isCorrect: false },
      ],
    },
    {
      q: `Where should teams invest the majority of their optimization budget for ${topic}?`,
      opts: [
        { text: 'Developer velocity, CI/CD pipelines, and feedback loops', isCorrect: isQuiz },
        { text: 'Manual QA verification handoffs', isCorrect: false },
        { text: 'Lengthy waterfall requirements specifications', isCorrect: false },
        { text: 'Unused third-party enterprise add-ons', isCorrect: false },
      ],
    },
    {
      q: `What role does automated observability play in ${topic}?`,
      opts: [
        { text: 'Surfacing regressions in real time before users are impacted', isCorrect: isQuiz },
        { text: 'Generating decorative graphs for quarterly review decks', isCorrect: false },
        { text: 'Replacing developer intuition entirely', isCorrect: false },
        { text: 'Adding unnecessary computational overhead without insight', isCorrect: false },
      ],
    },
    {
      q: `How should security boundaries be established across ${topic}?`,
      opts: [
        { text: 'Zero-trust least-privilege scoping at every interface', isCorrect: isQuiz },
        { text: 'Perimeter firewalls with wide open internal access', isCorrect: false },
        { text: 'Hardcoded credentials in version control', isCorrect: false },
        { text: 'Relying exclusively on network obscurity', isCorrect: false },
      ],
    },
  ];

  const wordCloudTemplates = [
    `Describe ${topic} in one powerful word.`,
    `What emotion or impression does ${topic} evoke for you?`,
    `Name one breakthrough in ${topic} you're most excited about.`,
    `In one word, how would you describe tomorrow's ${topic}?`,
    `What single improvement would transform ${topic}?`,
    `What is the biggest barrier when adopting ${topic}?`,
    `What is the greatest strength of ${topic}?`,
    `In one word, what defines excellence in ${topic}?`,
    `What key value does ${topic} deliver to stakeholders?`,
    `What single word summarizes your team's mindset toward ${topic}?`,
  ];

  const ratingTemplates = [
    `How confident are you about the strategic direction of ${topic}?`,
    `Rate your organization's readiness for upcoming changes in ${topic}.`,
    `How valuable was today's discussion on ${topic}?`,
    `How prepared do you feel to apply what you've learned about ${topic}?`,
    `Rate the overall impact of ${topic} on your day-to-day workflow.`,
    `How satisfied are you with the tooling currently available for ${topic}?`,
    `Rate the level of executive support and alignment behind ${topic}.`,
    `How intuitive and manageable is the operational overhead of ${topic}?`,
  ];

  const openTemplates = [
    `What's your biggest takeaway from the ${topic} discussion?`,
    `How would you improve the current approach to ${topic}?`,
    `Share one actionable idea or experiment related to ${topic}.`,
    `What question about ${topic} remains unanswered for you?`,
    `Describe your ideal future scenario for ${topic}.`,
    `What unintended consequences should we watch out for in ${topic}?`,
    `What would make you 10x more effective when working with ${topic}?`,
  ];

  if (type === 'quiz' || type === 'multiple_choice') {
    for (let i = 0; i < count; i++) {
      const base = frameworks[i % frameworks.length];
      const cycle = Math.floor(i / frameworks.length);
      const titlePrefix = cycle > 0 ? `[Part ${cycle + 1}] ` : '';
      baseQuestions.push({
        title: `${titlePrefix}${base.q}`,
        type,
        options: base.opts,
        timeLimit: effectiveTimeLimit,
      });
    }
  } else if (type === 'word_cloud') {
    for (let i = 0; i < count; i++) {
      const base = wordCloudTemplates[i % wordCloudTemplates.length];
      const cycle = Math.floor(i / wordCloudTemplates.length);
      const title = cycle > 0 ? `${base} (Perspective ${cycle + 1})` : base;
      baseQuestions.push({
        title,
        type,
        options: [],
        timeLimit: effectiveTimeLimit,
      });
    }
  } else if (type === 'rating') {
    for (let i = 0; i < count; i++) {
      const base = ratingTemplates[i % ratingTemplates.length];
      const cycle = Math.floor(i / ratingTemplates.length);
      const title = cycle > 0 ? `${base} (Dimension ${cycle + 1})` : base;
      baseQuestions.push({
        title,
        type,
        options: [],
        timeLimit: effectiveTimeLimit,
      });
    }
  } else {
    for (let i = 0; i < count; i++) {
      const base = openTemplates[i % openTemplates.length];
      const cycle = Math.floor(i / openTemplates.length);
      const title = cycle > 0 ? `${base} (Focus Area ${cycle + 1})` : base;
      baseQuestions.push({
        title,
        type,
        options: [],
        timeLimit: effectiveTimeLimit,
      });
    }
  }

  return baseQuestions;
}
