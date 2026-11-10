import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';

// Maintainer-only authored fixtures. Never reads or executes learner drafts on the host.
const compiled = await build({ entryPoints: ['src/spacing.ts'], bundle: true, format: 'esm', write: false });
const { spacingCandidates, sameInstructions } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const fixtures = [
  { source: 'def solve(n):\nreturn n * 2\n', line: 2, error: 'expected an indented block after function definition on line 1', expected: 10 },
  { source: 'def solve(n):\n    total = 0\n    for i in range(n):\n    total += i\n    return total\n', line: 4, error: 'expected an indented block after for statement on line 3', expected: 10 },
  { source: 'def solve(n):\ntotal = 0\nfor i in range(n):\n    total += i\nreturn total\n', line: 2, error: 'expected an indented block after function definition on line 1', expected: 10 },
  { source: 'def solve(n):\n    value = n\n        return value\n', line: 3, error: 'unexpected indent', expected: 5 },
  { source: 'def solve(n):\n\tvalue = n\n        return value\n', line: 3, error: 'TabError: inconsistent use of tabs and spaces in indentation', expected: 5 },
];
const cases = fixtures.map(item => ({ ...item, candidates: spacingCandidates(item.source, item.line, item.error).filter(candidate => sameInstructions(item.source, candidate.source)).map(candidate => candidate.source) }));
const python = `import json,sys
for case in json.load(sys.stdin):
    try: compile(case['source'], '<authored-fixture>', 'exec')
    except (IndentationError,TabError): pass
    else: raise AssertionError('The original fixture should expose an indentation error')
    fixed = None
    for source in case['candidates']:
        try: program = compile(source, '<authored-preview>', 'exec')
        except SyntaxError: continue
        namespace = {}
        exec(program, namespace)
        assert namespace['solve'](5) == case['expected'], 'Preview changed the intended authored fixture behavior'
        fixed = source
        break
    assert fixed is not None, 'No valid spacing preview for fixture'
print('Verified 5 authored spacing repairs with the real Python parser and fixture behavior.')
`;
const result = spawnSync('python', ['-I', '-c', python], { input: JSON.stringify(cases), encoding: 'utf8', timeout: 30000, windowsHide: true });
if (result.error || result.status !== 0) throw new Error(result.error?.message ?? result.stderr);
console.log(result.stdout.trim());
