import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
function hashText(t:string){ return crypto.createHash('sha256').update(t.trim()).digest('hex'); }
describe('Notes hashing', ()=>{
  it('hash dedup', ()=>{
    const a=hashText('  hello  ');
    const b=hashText('hello');
    expect(a).toBe(b);
  });
  it('different text different hash', ()=>{
    expect(hashText('math')).not.toBe(hashText('science'));
  });
});
