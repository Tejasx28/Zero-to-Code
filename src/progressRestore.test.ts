import { describe, expect, it } from 'vitest';
import { decodeQuest, freshQuest } from './questState';

describe('portable DSA Quest progress backups', () => {
  it('accepts exports with project metadata and keeps language-specific drafts', () => {
    const original = freshQuest();
    original.onboarded = true;
    original.name = 'Learner';
    original.drafts['python:add'] = 'def solve(a, b):\n    return a + b';
    const downloaded = JSON.stringify({project:'DSA Quest v0.9',exportedAt:'2026-11-10T00:00:00.000Z',...original});
    const restored = decodeQuest(downloaded);
    expect(restored?.name).toBe('Learner');
    expect(restored?.drafts['python:add']).toBe(original.drafts['python:add']);
    expect(restored?.version).toBe(2);
  });

  it('rejects incompatible versions and damaged backups', () => {
    expect(decodeQuest('{invalid json')).toBeNull();
    expect(decodeQuest(JSON.stringify({...freshQuest(),version:900}))).toBeNull();
    expect(decodeQuest(JSON.stringify({...freshQuest(),drafts:{'python:add':17}}))).toBeNull();
  });
});
