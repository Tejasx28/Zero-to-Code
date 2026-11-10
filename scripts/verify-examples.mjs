import { build } from 'esbuild';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

// Maintainer check only: executes the authored reference programs, never a saved learner draft.
const compiled = await build({ entryPoints: ['src/curriculum.ts'], bundle: true, format: 'esm', write: false });
const { EXERCISES } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
await mkdir('work-verification', { recursive: true });
const folder = await mkdtemp(resolve('work-verification', 'examples-'));
const debugBundle = await build({ entryPoints: ['src/debugContent.ts'], bundle: true, format: 'esm', write: false });
const { DEBUG_CASES, debugExercise } = await import(`data:text/javascript;base64,${Buffer.from(debugBundle.outputFiles[0].text).toString('base64')}`);
const arcadeBundle = await build({ entryPoints: ['src/questArcadeContent.ts'], bundle: true, format: 'esm', write: false });
const { ARENA_EXERCISE, BUG_DRONES, ARCADE_FRAMES, ARCADE_GAMES } = await import(`data:text/javascript;base64,${Buffer.from(arcadeBundle.outputFiles[0].text).toString('base64')}`);
const constructsBundle = await build({entryPoints:['scripts/construct-fixtures.ts'],bundle:true,format:'esm',write:false});
const {CONSTRUCT_FIXTURES}=await import(`data:text/javascript;base64,${Buffer.from(constructsBundle.outputFiles[0].text).toString('base64')}`);
const references = [...CONSTRUCT_FIXTURES, ...EXERCISES.filter(e=>!e.independent||e.id.startsWith('quest-')), ARENA_EXERCISE, ...DEBUG_CASES.flatMap(item => ['repair','rebuild'].map(phase => ({...debugExercise(item,phase),id:`${item.id}:${phase}`})))];
const broken = DEBUG_CASES.map(item => ({...item.exercise,id:`${item.id}:broken`,example:item.broken,mustFail:true}));
broken.push(...BUG_DRONES.map(drone=>({...ARENA_EXERCISE,id:`drone:${drone.id}`,example:drone.source,cases:[{args:[drone.witness.values,drone.witness.target],expected:drone.witness.expected,label:'Authored counterexample'}],mustFail:true})));
const incomplete = Object.entries(ARCADE_FRAMES).map(([id,source])=>({...EXERCISES.find(e=>e.id===ARCADE_GAMES.find(g=>g.id===id).exerciseId),id:`frame:${id}`,example:source,mustFail:true}));
const exercises = [...references,...broken,...incomplete];
function command(binary, args) {
  const result = spawnSync(binary, args, { encoding: 'utf8', timeout: 120000, windowsHide: true });
  if (result.error || result.status !== 0) throw new Error(`${binary}: ${result.error?.message ?? result.stderr}`);
  return result.stdout.trim();
}
let total = 0;
for (const e of exercises) {
  const code = `${e.example.python}\nimport json\n_cases = json.loads(${JSON.stringify(JSON.stringify(e.cases.map(c => c.args)))})\nprint(json.dumps([solve(*args) for args in _cases]))\n`;
  const actual = JSON.parse(command('python', ['-I', '-c', code]));
  const equal = JSON.stringify(actual) === JSON.stringify(e.cases.map(c => c.expected));
  if (e.mustFail ? equal : !equal) throw new Error(`Python fixture failed: ${e.id}`);
  total += actual.length;
}
const calls = exercises.map(e => {
  const encoded = e.cases.map(c => c.args.map(a => Array.isArray(a) ? a.join(',') : String(a)).join(';')).join('\n');
  return `System.out.println(QuestBridge.grade(${JSON.stringify(e.example.java)}, ${JSON.stringify(e.kind)}, ${JSON.stringify(encoded)}));`;
}).join('\n');
const java = `public class NativeCheck { public static void main(String[] args) throws Exception {\n${calls}\n} }`;
await writeFile(resolve(folder, 'NativeCheck.java'), java);
await writeFile(resolve(folder, 'QuestBridge.java'), await readFile('scripts/QuestBridge.java'));
command('javac', ['--release', '11', '-d', folder, resolve(folder, 'QuestBridge.java'), resolve(folder, 'NativeCheck.java')]);
const rows = command('java', [`-Dquest.workdir=${resolve(folder, 'virtual-files')}`, '-cp', folder, 'NativeCheck']).split(/\r?\n/);
rows.forEach((row, i) => {
  const result = JSON.parse(row);
  if (result.error) throw new Error(`Java reference failed: ${exercises[i].id}: ${result.error}`);
  const actual = result.results.map(r => { if (r.error) throw new Error(r.error); return r.actual; });
  const equal = JSON.stringify(actual) === JSON.stringify(exercises[i].cases.map(c => c.expected));
  if (exercises[i].mustFail ? equal : !equal) throw new Error(`Java fixture failed: ${exercises[i].id}`);
  total += actual.length;
});
console.log(`Verified ${total} real-language cases across ${references.length} reference programs and ${broken.length} intentionally broken programs and ${incomplete.length} incomplete starting frames in each language. Every reference passed; every broken program exposed a failure.`);
