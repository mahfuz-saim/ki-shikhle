import { env } from '../config/env';
import { logger } from '../utils/logger';

export type AIModel = 'fast' | 'smart';
type AIResult = { content: string; inputTokens: number; outputTokens: number; model: string; cached?: boolean };

const mockResponses: Record<string, string> = {
  digest: JSON.stringify({ topics: ["Algebra - Quadratic Equations", "Photosynthesis"], key_facts: ["Quadratic formula x=(-b±√(b²-4ac))/2a", "Chlorophyll absorbs sunlight"], language: "en" }),
  quiz: JSON.stringify({
    questions: [
      { type: "mcq", prompt: "What is the quadratic formula?", options: ["x=(-b±√(b²-4ac))/2a", "a²+b²=c²", "E=mc²", "F=ma"], correct_answer: "x=(-b±√(b²-4ac))/2a", explanation: "Standard quadratic formula", topic: "Quadratic Equations" },
      { type: "true_false", prompt: "Photosynthesis occurs in mitochondria.", options: ["True", "False"], correct_answer: "False", explanation: "Occurs in chloroplasts", topic: "Photosynthesis" },
      { type: "fill_blank", prompt: "The process by which plants make food is called ____.", options: [], correct_answer: "photosynthesis", explanation: "Definition", topic: "Photosynthesis" }
    ]
  }),
  explanation: "Rahim is doing well in Algebra but needs practice with Photosynthesis concepts. He scored 2/3. Suggest revising photosynthesis steps and practicing quadratic problems. Try asking: 'Can you explain how plants make food?'",
  voice: JSON.stringify({
    subject: "General Science",
    subjectBn: "সাধারণ বিজ্ঞান",
    topicsText: "বিজ্ঞান: পানি বিশুদ্ধকরণ ও নিরাপদ পানির ব্যবহার",
    source: "school",
    durationMin: 60,
    confidence: 5,
    keyConcepts: ["পানি বিশুদ্ধকরণের বিভিন্ন উপায়", "নিরাপদ পানির ব্যবহার ও রোগ প্রতিরোধ", "টগবগিয়ে ২০ মিনিট ফোটানো"],
    homeworkAssigned: "অধ্যায় ৩ এর সংক্ষেপ প্রশ্নাবলী ১-৪",
    summaryMessage: "অসাধারণ! বিজ্ঞান ক্লাসের পড়াটি খুব চমৎকারভাবে শিখেছ।",
    rawTranscript: "আজকে বিজ্ঞান ক্লাসে পানি বিশুদ্ধকরণ ও নিরাপদ পানি পানের নিয়ম শিখেছি"
  })
};

export async function callAI(prompt: { system: string; user: string; model: AIModel; maxTokens?: number; responseFormat?: 'json' }): Promise<AIResult> {
  const model = prompt.model === 'fast' ? env.AI_MODEL_FAST : env.AI_MODEL_SMART;
  const apiKey = env.ANTHROPIC_API_KEY;

  // If no key or placeholder, return mock deterministically
  if (!apiKey || apiKey.includes('test-key') || apiKey.includes('placeholder')) {
    logger.info({ model, promptLen: prompt.user.length }, 'AI mock response');
    let key = 'quiz';
    if (prompt.system.includes('digest') || prompt.user.includes('digest')) key = 'digest';
    if (prompt.system.includes('explanation') || prompt.user.includes('explanation')) key = 'explanation';
    if (prompt.system.includes('voice') || prompt.system.includes('spoken') || prompt.user.includes('voice') || prompt.user.includes('Voice')) key = 'voice';
    // Allow caller to hint
    if (prompt.user.includes('__MOCK_DIGEST__')) key = 'digest';
    if (prompt.user.includes('__MOCK_EXPLANATION__')) key = 'explanation';
    return { content: mockResponses[key], inputTokens: Math.ceil(prompt.user.length / 4), outputTokens: 150, model, cached: false };
  }

  // Real Anthropic call
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model,
      max_tokens: prompt.maxTokens || 2048,
      system: prompt.system,
      messages: [{ role: 'user', content: prompt.user }],
    });
    const text = res.content.filter(c => c.type === 'text').map(c => (c as any).text).join('');
    return { content: text, inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens, model };
  } catch (e: any) {
    logger.warn({ error: e.message, status: e.status, model }, 'AI primary model failed, attempting fallback model');
    // Fallback model attempt before dropping to static mock
    const fallbackModel = model === env.AI_MODEL_FAST ? env.AI_MODEL_SMART : env.AI_MODEL_FAST;
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey });
      const res = await client.messages.create({
        model: fallbackModel,
        max_tokens: prompt.maxTokens || 2048,
        system: prompt.system,
        messages: [{ role: 'user', content: prompt.user }],
      });
      const text = res.content.filter(c => c.type === 'text').map(c => (c as any).text).join('');
      return { content: text, inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens, model: fallbackModel };
    } catch (err2: any) {
      logger.error({ error: err2.message, status: err2.status, model: fallbackModel }, 'AI call failed, falling back to mock');
      return { content: mockResponses['quiz'], inputTokens: 0, outputTokens: 0, model, cached: false };
    }
  }
}

export function estimateCost(inputTokens: number, outputTokens: number, model: string): number {
  // Simplified pricing estimate
  const rates: Record<string, { in: number; out: number }> = {
    'claude-haiku-4-5-20251001': { in: 0.8 / 1e6, out: 4 / 1e6 },
    'claude-3-5-haiku-latest': { in: 0.8 / 1e6, out: 4 / 1e6 },
    'claude-haiku-4-5': { in: 1 / 1e6, out: 5 / 1e6 },
    'claude-sonnet-4-6': { in: 3 / 1e6, out: 15 / 1e6 },
    'claude-sonnet-4-20250514': { in: 3 / 1e6, out: 15 / 1e6 },
    'claude-haiku-5-5': { in: 0.8 / 1e6, out: 4 / 1e6 },
    'claude-sonnet-5-5': { in: 3 / 1e6, out: 15 / 1e6 },
  };
  const r = rates[model] || { in: 1 / 1e6, out: 5 / 1e6 };
  return inputTokens * r.in + outputTokens * r.out;
}
