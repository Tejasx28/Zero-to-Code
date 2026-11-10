import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

// Execute only these authored fixtures, using the exact browser worker recorder.
const worker = await readFile('public/runners/python-worker.js', 'utf8');
const program = worker.match(/const result = await runtime\.runPythonAsync\(`([\s\S]*?)`\);/)[1];
const source = 'def solve(values):\n    best = 0\n    for value in values:\n        if value > best:\n            best = value\n    return best';
const executable = program.replace("json.dumps({'results': _rows, 'stdout': _out.text})", "print(json.dumps({'results': _rows, 'stdout': _out.text}))");
const runner = `_quest_source = ${JSON.stringify(source)}\n_quest_cases = '[ [[-8]], [[2,5]], [[]] ]'\n_quest_wants_trace = True\nexec(compile(${JSON.stringify(executable)}, '<runner>', 'exec'))`;
const result = spawnSync('python', ['-I', '-c', runner], { encoding:'utf8', timeout:10000, windowsHide:true });
if (result.status !== 0) throw new Error(result.stderr || result.error?.message);
const {results} = JSON.parse(result.stdout);
for (const [i,row] of results.entries()) {
  const first=row.trace[0], last=row.trace.at(-1);
  if (first.event!=='line'||first.line!==2||!Array.isArray(first.locals.values)) throw new Error(`Missing initial inputs: ${i}`);
  if (row.trace.some(frame=>frame.event==='return'&&frame.line===1)) throw new Error('Module return leaked into walkthrough.');
  if (last.event!=='return'||last.returned!==row.actual) throw new Error(`Wrong final return: ${i}`);
}
console.log('Python recorder: 3 authored inputs start inside solve and end at the actual return.');
