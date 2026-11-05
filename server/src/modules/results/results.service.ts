import { prisma } from '../../db/client';
import { callAI, estimateCost } from '../../services/ai';
import { notFound, forbidden } from '../../utils/errors';
import { store } from '../../core/store';
import { assertEntityAccess, type Actor } from '../../core/tenancy';
import { canUseAiExplanation, resolvePlanCode } from '../../services/entitlements';

const memExplanations = new Map<string, any>();

/**
 * The attempt's results, for the owning parent or the child who sat it.
 *
 * The ownership check lives in `core/tenancy` — an attempt id alone is not enough to
 * read a result. Previously this function never looked at `parentId` at all, which made
 * `GET /attempts/:id` an IDOR across every tenant.
 */
export async function getAttemptResults(actor: Actor, attemptId: string) {
  await assertEntityAccess(actor, { kind: 'attempt', id: attemptId });

  let attempt: any;
  try {
    attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: { include: { question: true } },
        quiz: { include: { questions: true } },
        // The child row is projected, not included wholesale: `Child` carries
        // `passwordHash` and `pinHash`, and this whole attempt object is returned to
        // the browser by `GET /attempts/:id`.
        child: {
          select: { id: true, name: true, nickname: true, grade: true, curriculum: true, medium: true, avatar: true },
        },
      },
    });
  } catch {
    attempt = store.attempts.find(actor.ownerId, attemptId);
  }
  if (!attempt) throw notFound('Attempt not found');

  // per-topic accuracy computed in code
  const byTopic: Record<string, { correct: number; total: number }> = {};
  for (const ans of attempt.answers || []) {
    const topic = ans.question?.topic || 'General';
    if (!byTopic[topic]) byTopic[topic] = { correct: 0, total: 0 };
    byTopic[topic].total++;
    if (ans.isCorrect) byTopic[topic].correct++;
  }
  const perTopic = Object.entries(byTopic).map(([topic, v]) => ({
    topic,
    accuracy: v.total ? Math.round((v.correct / v.total) * 100) : 0,
    correct: v.correct,
    total: v.total,
  }));

  // check cached explanation
  let explanation: any = null;
  try {
    explanation = await prisma.attemptExplanation.findUnique({ where: { attemptId } });
  } catch {
    explanation = memExplanations.get(attemptId);
  }

  return { attempt, perTopic, explanation };
}

export async function generateExplanation(actor: Actor, attemptId: string, language: string = 'en') {
  // check cache first
  let existing: any = null;
  try {
    existing = await prisma.attemptExplanation.findUnique({ where: { attemptId } });
  } catch {
    existing = memExplanations.get(attemptId);
  }
  // An explanation that already exists is the caller's to read — a downgrade must not
  // take away something they have already paid for.
  if (existing) return existing;

  // Entitlement: generating a *new* AI explanation is a paid feature.
  //
  // `aiExplanation` was declared on every plan but never checked, so the Free plan's
  // "no explanations" restriction was not enforced — a paid feature was free.
  const planCode = await resolvePlanCode(actor.ownerId);
  if (!canUseAiExplanation(planCode)) {
    throw forbidden(
      `AI explanations are not available on the ${planCode} plan. Upgrade to unlock them.`
    );
  }

  const { attempt, perTopic } = await getAttemptResults(actor, attemptId);
  // Build compact stats for LLM, not full question text (cost saving)
  const stats = {
    score: attempt.score,
    maxScore: attempt.maxScore,
    perTopic,
    wrongTopics: perTopic.filter((p: any) => p.accuracy < 60).map((p: any) => p.topic),
    strongTopics: perTopic.filter((p: any) => p.accuracy >= 80).map((p: any) => p.topic),
    durationSec: attempt.durationSec,
  };

  const system = `You are a kind, non-judgmental parent assistant. Explain quiz results in plain language (${language}). Keep short, include: what child understands well, weak topics, revision plan, conversation starters. Tone warm. Output markdown.`;
  const user = `Stats: ${JSON.stringify(stats)} — Generate explanation in ${language}. Do not invent scores; use provided stats.`;

  const start = Date.now();
  const result = await callAI({ system, user, model: 'smart', maxTokens: 1500, feature: 'explanation' });
  const latency = Date.now() - start;
  const cost = estimateCost(result.inputTokens, result.outputTokens, result.model);

  const content = result.content;

  /**
   * A mocked explanation is a fixed canned response, not a reading of this child's
   * results. It used to be persisted with `status: 'success'` and zero tokens, so a
   * production AI outage was indistinguishable from a healthy call — and the parent
   * was shown generic advice while the usage log claimed a successful model run.
   *
   * It is still stored (the parent should not get an error page), but it is recorded
   * as `mock` so the outage is visible, and the content is prefixed so nobody reads
   * it as a real analysis of this child.
   */
  const isMock = result.mocked === true;
  const storedContent = isMock
    ? `> ⚠️ **Mocked explanation.** The AI service was unavailable, so this is a placeholder — not an analysis of this attempt.\n\n${content}`
    : content;

  try {
    const exp = await prisma.attemptExplanation.create({ data: { attemptId, language, contentMd: storedContent, model: result.model } });
    await prisma.aiUsageLog.create({ data: { userId: actor.ownerId, childId: attempt.childId, feature: 'explanation', model: result.model, inputTokens: result.inputTokens, outputTokens: result.outputTokens, costEst: cost, latencyMs: latency, status: isMock ? 'mock' : 'success' } });
    return exp;
  } catch {
    const exp = { id: 'exp-' + Date.now(), attemptId, language, contentMd: storedContent, model: result.model, createdAt: new Date().toISOString() };
    memExplanations.set(attemptId, exp);
    console.log(`[AI Usage] explanation mock cost $${cost.toFixed(4)}`);
    return exp;
  }
}
