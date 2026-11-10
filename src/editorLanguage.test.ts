import { describe, expect, it } from 'vitest';
import { EditorState } from '@codemirror/state';
import { indentLess, indentMore, insertNewlineAndIndent } from '@codemirror/commands';
import { editorLanguage } from './editorLanguage';

function editor(doc: string, language: 'python' | 'java') {
  let state = EditorState.create({doc,selection:{anchor:doc.length},extensions:editorLanguage(language)});
  return { get state(){return state;}, dispatch(transaction:ReturnType<EditorState['update']>){state=transaction.state;} };
}
describe('consistent editor indentation',()=>{
  it('inserts four spaces after a Python function and eight inside its loop',()=>{
    const target=editor('def solve(n):','python');insertNewlineAndIndent(target);
    expect(target.state.doc.toString()).toBe('def solve(n):\n    ');
    target.dispatch(target.state.update({changes:{from:target.state.doc.length,insert:'for i in range(n):'},selection:{anchor:target.state.doc.length+'for i in range(n):'.length}}));
    insertNewlineAndIndent(target);expect(target.state.doc.toString().endsWith('\n        ')).toBe(true);
  });
  it('uses the same four-space unit for indent and unindent',()=>{
    const target=editor('    return 1','python');indentMore(target);expect(target.state.doc.toString()).toBe('        return 1');indentLess(target);expect(target.state.doc.toString()).toBe('    return 1');
  });
  it('keeps Java method bodies consistent with the two-space starter layout',()=>{
    const target=editor('public class Solution {\n  public static int solve(int n) {','java');insertNewlineAndIndent(target);expect(target.state.doc.toString().endsWith('\n    ')).toBe(true);
  });
});
