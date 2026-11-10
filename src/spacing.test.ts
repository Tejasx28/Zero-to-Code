import { describe,expect,it } from 'vitest';
import { indentWidth,missingBody,sameInstructions,spacingCandidates,spacingEdits,visibleSpaces } from './spacing';
describe('reviewable spacing repairs',()=>{
  it('proposes only leading whitespace changes for the exact reported body line',()=>{
    const source='def solve(n):\nreturn n\n';const items=spacingCandidates(source,2,'IndentationError: expected an indented block after function definition on line 1');
    expect(items[0].source).toBe('def solve(n):\n    return n\n');expect(items.every(item=>sameInstructions(source,item.source))).toBe(true);expect(items[0].edits[0].line).toBe(2);
  });
  it('prefers a block preview when the entire function body lost its indentation',()=>{
    const source='def solve(n):\ntotal = 0\nfor i in range(n):\n    total += i\nreturn total';const items=spacingCandidates(source,2,'expected an indented block after function definition on line 1');
    expect(items[0].label).toBe('Indent this block');expect(items[0].source).toContain('\n        total += i\n    return total');
  });
  it('does not rewrite multiline strings or line continuations',()=>{
    expect(spacingCandidates('def solve():\n"""a\n  b"""',2,'expected an indented block')).toEqual([]);
    expect(spacingCandidates('def solve():\nreturn \\\n2',2,'expected an indented block')).toEqual([]);
  });
  it('counts Python tab columns and exposes whitespace without changing instructions',()=>{
    expect(indentWidth(' \tx')).toBe(8);expect(visibleSpaces('    return 1')).toBe('····return 1');expect(sameInstructions('    return 1','  return 2')).toBe(false);expect(spacingEdits('a\r\n x','a\n    x')[0].line).toBe(2);
  });
  it('finds a missing body after comments and leaves valid nested blocks alone',()=>{
    expect(missingBody('def solve(n):\n# comment\nreturn n')).toEqual({line:3,parent:1});expect(missingBody('def solve(n):\n    if n:\n        return n\n    return 0')).toBeNull();expect(missingBody('if n: return n')).toBeNull();
  });
});
