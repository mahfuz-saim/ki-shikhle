import { prisma } from '../../db/client';
import { callAI, estimateCost } from '../../services/ai';
import { notFound } from '../../utils/errors';
import { env } from '../../config/env';

const memExplanations = new Map<string, any>();

export async function getAttemptResults(attemptId: string, parentId: string) {
  let attempt:any;
  try { attempt = await prisma.quizAttempt.findUnique({ where:{id:attemptId}, include:{ answers:{include:{question:true}}, quiz:{ include:{questions:true}}, child:true}}); } catch { attempt=null; }
  if(!attempt) throw notFound('Attempt not found');
  // per-topic accuracy computed in code
  const byTopic: Record<string, {correct:number, total:number}> = {};
  for (const ans of attempt.answers||[]) {
    const topic = (ans.question?.topic || 'General');
    if(!byTopic[topic]) byTopic[topic]={correct:0,total:0};
    byTopic[topic].total++;
    if(ans.isCorrect) byTopic[topic].correct++;
  }
  const perTopic = Object.entries(byTopic).map(([topic,v])=> ({ topic, accuracy: v.total? Math.round(v.correct/v.total*100):0, correct: v.correct, total: v.total }));
  // check cached explanation
  let explanation:any=null;
  try { explanation = await prisma.attemptExplanation.findUnique({ where:{attemptId}}); } catch { explanation = memExplanations.get(attemptId); }
  return { attempt, perTopic, explanation };
}

export async function generateExplanation(attemptId: string, parentId: string, language: string = 'en') {
  // check cache first
  let existing:any=null;
  try { existing = await prisma.attemptExplanation.findUnique({ where:{attemptId}}); } catch { existing = memExplanations.get(attemptId); }
  if(existing) return existing;

  const { attempt, perTopic } = await getAttemptResults(attemptId, parentId);
  // Build compact stats for LLM, not full question text (cost saving)
  const stats = {
    score: attempt.score, maxScore: attempt.maxScore,
    perTopic,
    wrongTopics: perTopic.filter((p:any)=> p.accuracy < 60).map((p:any)=> p.topic),
    strongTopics: perTopic.filter((p:any)=> p.accuracy >= 80).map((p:any)=> p.topic),
    durationSec: attempt.durationSec,
  };

  const system = `You are a kind, non-judgmental parent assistant. Explain quiz results in plain language (${language}). Keep short, include: what child understands well, weak topics, revision plan, conversation starters. Tone warm. Output markdown.`;
  const user = `Stats: ${JSON.stringify(stats)} — Generate explanation in ${language}. Do not invent scores; use provided stats.`;

  const start=Date.now();
  const result = await callAI({ system, user, model:'smart', maxTokens: 1500 });
  const latency=Date.now()-start;
  const cost=estimateCost(result.inputTokens, result.outputTokens, result.model);

  const content = result.content;
  try {
    const exp = await prisma.attemptExplanation.create({ data:{ attemptId, language, contentMd: content, model: result.model } });
    await prisma.aiUsageLog.create({ data:{ userId: parentId, childId: attempt.childId, feature:'explanation', model: result.model, inputTokens: result.inputTokens, outputTokens: result.outputTokens, costEst: cost, latencyMs: latency, status:'success'}});
    return exp;
  } catch {
    const exp={ id:'exp-'+Date.now(), attemptId, language, contentMd: content, model: result.model, createdAt: new Date().toISOString()};
    memExplanations.set(attemptId, exp);
    console.log(`[AI Usage] explanation mock cost $${cost.toFixed(4)}`);
    return exp;
  }
}
