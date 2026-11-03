import { describe, it, expect } from 'vitest';
import { extractStructuredVoiceFallback, structureVoiceLog } from './entries.service';

describe('Voice Learning Log & Claude AI Structuring', () => {
  it('correctly extracts physics topic, concepts, and school source from speech transcript', () => {
    const speech = 'আজকে স্কুলে পদার্থবিজ্ঞানের ৩য় অধ্যায় বল ও ত্বরণ পড়িয়েছে, নিউটনের দ্বিতীয় সূত্র F=ma এবং অঙ্ক করিয়েছে। হোমওয়ার্ক দিছে অনুশীলনী ৩ এর ১ থেকে ৫।';
    const result = extractStructuredVoiceFallback(speech);

    expect(result.subject).toBe('Physics');
    expect(result.subjectBn).toBe('পদার্থবিজ্ঞান');
    expect(result.source).toBe('school');
    expect(result.keyConcepts.length).toBeGreaterThan(0);
    expect(result.keyConcepts.some((c) => c.includes('F = ma'))).toBe(true);
    expect(result.homeworkAssigned).toBeDefined();
    expect(result.aiModelUsed).toContain('Claude');
  });

  it('correctly extracts math topic and tuition source from speech transcript', () => {
    const speech = 'গণিত প্রাইভেটে বীজগণিতীয় সূত্রাবলী অনুশীলন করেছি a স্কয়ার মাইনাস b স্কয়ার এর অঙ্ক';
    const result = extractStructuredVoiceFallback(speech);

    expect(result.subject).toBe('Mathematics');
    expect(result.subjectBn).toBe('গণিত');
    expect(result.source).toBe('tuition');
    expect(result.keyConcepts.some((c) => c.includes('বীজগণিত'))).toBe(true);
  });

  it('structures voice log asynchronously with Claude AI model or fallback', async () => {
    const result = await structureVoiceLog(
      'আজকে বিজ্ঞান ক্লাসে পানি বিশুদ্ধকরণ ও নিরাপদ পানি পানের নিয়ম শিখেছি',
      'demo-child-1',
      'demo-parent'
    );

    expect(result.subject).toBeDefined();
    expect(result.topicsText).toBeDefined();
    expect(result.keyConcepts.length).toBeGreaterThanOrEqual(1);
    expect(result.confidence).toBeGreaterThanOrEqual(1);
  });
});
