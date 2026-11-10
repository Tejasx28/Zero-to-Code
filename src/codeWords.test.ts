import { describe, expect, it } from 'vitest';
import { construct, defaultWords, parameterNames, planConstructInsert, validName } from './codeWords';
import type { CodeIntent, CodePlace, WordChoices } from './codeWords';
import type { Language } from './curriculum';

const add=(source:string,text:string,language:Language,place:CodePlace)=>{
  const plan=planConstructInsert(source,0,text,language,place);
  if(plan.error)throw new Error(plan.error);
  return source.slice(0,plan.from)+plan.text+source.slice(plan.to);
};
describe('an idea becomes an editable construct',()=>{
  it('uses actual input names and rejects reserved names in both languages',()=>{
    expect(parameterNames('def solve(values, capacity):\n    pass','python')).toEqual(['values','capacity']);
    expect(parameterNames('public static int solve(int[] weights, int capacity) {\n}','java')).toEqual(['weights','capacity']);
    for(const name of ['for','return','class','boolean','while','new','3items','two words'])expect(validName(name)).toBe(false);
    expect(validName('remaining_2')).toBe(true);
  });
  it('inserts nested Python actions without moving the final return into the loop',()=>{
    let source='def solve(values):\n    return 0';
    const choices={...defaultWords(source,'python'),name:'total',value:'0'};
    for(const [intent,patch] of [['remember',{}],['loop',{}],['condition',{right:'0'}],['update',{value:'value',operator:'+='}],['return',{value:'total'}]] as [CodeIntent,Partial<WordChoices>][]) {
      Object.assign(choices,patch);const step=construct(intent,'python',choices);source=add(source,step.code,'python',step.place);
    }
    expect(source).toBe('def solve(values):\n    total = 0\n    for value in values:\n        if value > 0:\n            total += value\n    return total');
  });
  it('inserts Java actions inside their matching braces',()=>{
    let source='public class Solution {\n  public static int solve(int[] values) {\n    return 0;\n  }\n}';
    const c=defaultWords(source,'java');
    for(const [intent,patch] of [['remember',{}],['loop',{}],['condition',{}],['update',{value:'value'}],['return',{value:'total'}]] as [CodeIntent,Partial<WordChoices>][]) {
      Object.assign(c,patch);const step=construct(intent,'java',c);source=add(source,step.code,'java',step.place);
    }
    expect(source).toContain('for (int value : values) {\n      if (value > 0) {\n        total += value;\n      }\n    }\n    return total;');
  });
  it('replaces only the pass and selects the new placeholder for typing',()=>{
    const source='def solve(values):\n    pass\n';
    const plan=planConstructInsert(source,0,'for value in values:\n    pass','python','return');
    const next=source.slice(0,plan.from)+plan.text+source.slice(plan.to);
    expect(next).toBe('def solve(values):\n    for value in values:\n        pass\n');
    expect(next.slice(plan.selection,plan.selectionEnd)).toBe('pass');
  });
  it('requires valid block structure rather than inserting outside a method',()=>{
    expect(planConstructInsert('public static int solve(int[] v) { return 0; }',0,'int total = 0;','java','setup').error).toContain('separate lines');
    expect(planConstructInsert('public static int solve(int[] v) {\n return 0;',0,'int total = 0;','java','setup').error).toContain('braces');
    expect(planConstructInsert('def solve(v): return 0',0,'total = 0','python','setup').error).toContain('separate');
    const source='public static int solve(int[] v) {\n  for (int x : v) total += x;\n  return 0;\n}';
    expect(planConstructInsert(source,0,'total += x;','java','loop').error).toContain('braces');
  });
  it('ignores braces in strings and comments when locating the real method body',()=>{
    const source='public static int solve(int[] values) {\n  String marker = "}"; // }\n  /* } */\n  return 0;\n}';
    expect(add(source,'int total = 0;','java','return')).toContain('/* } */\n  int total = 0;\n  return 0;');
  });
  it('adds at the cursor before a return instead of creating unreachable code',()=>{
    const source='def solve(values):\n    return 0';
    const plan=planConstructInsert(source,source.indexOf('return'),'total = 0','python','cursor');
    expect(source.slice(0,plan.from)+plan.text+source.slice(plan.to)).toBe('def solve(values):\n    total = 0\n    return 0');
  });
  it('rejects multi-line expressions while allowing a learner-written expression',()=>{
    const choices=defaultWords('def solve(values):\n    pass','python');
    expect(construct('write','python',{...choices,value:'values[i] + 1'}).error).toBeUndefined();
    expect(construct('write','python',{...choices,value:'4\nreturn 9'}).error).toBeDefined();
    expect(construct('condition','java',{...choices,item:'return'}).error).toBeDefined();
  });
});
