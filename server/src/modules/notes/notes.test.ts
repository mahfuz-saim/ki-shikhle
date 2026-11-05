import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { makeAINote, createNote, generateStructuredFallback } from './notes.service';
import { demoParent, demoChildIds } from '../../test-utils/actors';

function hashText(t: string) {
  return crypto.createHash('sha256').update(t.trim()).digest('hex');
}

describe('Notes hashing & deduplication', () => {
  it('hash dedup', () => {
    const a = hashText('  hello  ');
    const b = hashText('hello');
    expect(a).toBe(b);
  });

  it('different text different hash', () => {
    expect(hashText('math')).not.toBe(hashText('science'));
  });
});

describe('AI Note Generation from Vision / Image & Text', () => {
  it('generates structured note from image buffer', async () => {
    const fakeBuffer = Buffer.from('fake-image-bytes-of-physics-note');
    const res = await makeAINote(demoParent(), demoChildIds.rahim, {
      subject: 'Physics',
      file: {
        buffer: fakeBuffer,
        originalname: 'physics_ch3_notes.jpg',
        mimetype: 'image/jpeg',
      },
    });

    expect(res).toBeDefined();
    expect(res.aiSummary).toContain('মূল বিষয়বস্তু ও সংজ্ঞা');
    expect(res.subject).toBe('Physics');
  });

  it('generates structured note from base64 image', async () => {
    const fakeBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const res = await makeAINote(demoParent(), demoChildIds.rahim, {
      subject: 'Mathematics',
      imageBase64: fakeBase64,
      imageMimeType: 'image/png',
    });

    expect(res).toBeDefined();
    expect(res.aiSummary).toContain('বীজগণিতীয়');
    expect(res.subject).toBe('Mathematics');
  });

  it('generates structured note fallback for raw text', () => {
    const fallback = generateStructuredFallback('Photosynthesis occurs in chloroplasts.', 'Biology');
    expect(fallback).toContain('Biology');
    expect(fallback).toContain('Photosynthesis');
  });

  it('createNote automatically triggers vision AI note generation when image is attached', async () => {
    const fakeBuffer = Buffer.from('handwritten-notes-image');
    const note = await createNote(
      demoParent(),
      demoChildIds.rahim,
      {
        buffer: fakeBuffer,
        originalname: 'chem_ch4.png',
        mimetype: 'image/png',
      },
      {
        subject: 'Chemistry',
        date: '2026-11-04',
      }
    );

    expect(note).toBeDefined();
    expect(note.subject).toBe('Chemistry');
    expect(note.aiSummary).toBeDefined();
    expect(note.aiSummary.length).toBeGreaterThan(50);
  });
});
