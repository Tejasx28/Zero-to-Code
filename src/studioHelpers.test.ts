import { describe, expect, it } from 'vitest';
import { EXERCISES } from './curriculum';
import { ALLOWED_CODING_IDS, brainstormPrompts, CODING_MISSION_GROUPS, diagnosticLine, errorDirection, hintLadder, parseCustomInput } from './studioHelpers';
describe('learner debugging tools',()=>{
  it('accepts only the argument shape the exercise actually takes',()=>{
    expect(parseCustomInput('[3,4]','pair').args).toEqual([3,4]);
    expect(parseCustomInput('[[8,3,9],3]','target').args).toEqual([[8,3,9],3]);
    expect(parseCustomInput('[[]]','array').args).toEqual([[]]);
    expect(parseCustomInput('[4]','single').args).toEqual([4]);
    for(const [text,kind]of [['[3]','pair'],['[3,4]','array'],['["3",4]','pair'],['null','single'],['[1.5]','single']]as const)expect(parseCustomInput(text,kind).error).toBeTruthy();
  });
  it('rejects executable text and oversized input instead of evaluating it',()=>{
    expect(parseCustomInput('alert(1)','pair').error).toBeTruthy();
    expect(parseCustomInput(JSON.stringify([Array(61).fill(1)]),'array').error).toBeTruthy();
    expect(parseCustomInput('[1000001]','single').error).toBeTruthy();
  });
  it('finds Java compiler lines and Python traceback lines',()=>{
    expect(diagnosticLine('/files/run/Solution.java:7: error: ; expected','java')).toBe(7);
    expect(diagnosticLine('SyntaxError: invalid syntax, line 4','python')).toBe(4);
    expect(diagnosticLine('Runtime download failed','python')).toBeNull();
  });
  it('explains the error category without supplying an algorithm',()=>{
    expect(errorDirection('IndexError: list index out of range','python')).toContain('valid positions');
    expect(errorDirection("error: ';' expected",'java')).toContain('semicolon');
    expect(errorDirection('IndentationError','python')).toContain('spacing');
  });
  it('starts hints with questions and keeps the written algorithm behind the last nudge',()=>{
    const exercise=EXERCISES.find(e=>e.id==='find-index')!;
    const hints=hintLadder(exercise);
    expect(hints).toHaveLength(3);expect(hints[0]).toContain('?');expect(hints[1]).toContain('?');expect(hints[2]).toBe(exercise.hint);
  });
  it('keeps coding navigation within the beginner curriculum',()=>{
    expect(ALLOWED_CODING_IDS).toEqual(['add','larger','sum-to','trace-route','sum-array','rotate-left','max-scan','count-above']);
    expect(new Set(ALLOWED_CODING_IDS).size).toBe(ALLOWED_CODING_IDS.length);
    for(const id of ALLOWED_CODING_IDS)expect(EXERCISES.find(e=>e.id===id)).toBeDefined();
    expect(CODING_MISSION_GROUPS.at(-1)?.ids).toEqual(['count-above']);
  });
  it('grounds brainstorming in each mission rather than requiring a predicted answer',()=>{
    const route=brainstormPrompts(EXERCISES.find(e=>e.id==='trace-route')!);
    const rotate=brainstormPrompts(EXERCISES.find(e=>e.id==='rotate-left')!);
    expect(route.map(p=>p.id)).toEqual(['input','state','steps']);
    expect(route[0].question).toContain('direction codes');
    expect(route[1].question).toContain('position');
    expect(rotate[1].question).toContain('overwritten');
    for(const id of ALLOWED_CODING_IDS)expect(brainstormPrompts(EXERCISES.find(e=>e.id===id)!)).toHaveLength(3);
  });
  it('does not suggest the solution strategy in independent planning notes',()=>{
    const prompts=brainstormPrompts(EXERCISES.find(e=>e.id==='count-above')!);
    expect(prompts[2].question).toContain('your own steps');
    expect(prompts.map(p=>p.question).join(' ')).not.toMatch(/counter|increment|greater|above|running total/i);
  });
});
