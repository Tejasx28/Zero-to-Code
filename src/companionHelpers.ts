import type { Exercise, Language } from './curriculum';
import type { RunResult, TraceFrame } from './runtime';
import { matches } from './runtime';

export function evidenceCase(result:RunResult|null,exercise:Exercise):number{
  const first=result?.results.findIndex((row,index)=>Boolean(row.error)||!matches(row.actual,exercise.cases[index]?.expected))??-1;
  return Math.max(0,first);
}
export function changedValues(previous:TraceFrame|undefined,current:TraceFrame|undefined):string[]{
  if(!current)return [];
  return [...new Set([...Object.keys(previous?.locals??{}),...Object.keys(current.locals)])].filter(name=>JSON.stringify(previous?.locals[name])!==JSON.stringify(current.locals[name]));
}
export function readSteps(raw:string|undefined):string[]{
  try{const value=JSON.parse(raw??'');if(Array.isArray(value)&&value.length<=12&&value.every(item=>typeof item==='string'))return value;}catch{/* Optional notes can be replaced safely. */}
  return ['','',''];
}
export function movePlanStep(steps:string[],from:number,to:number):string[]{
  if(from<0||to<0||from>=steps.length||to>=steps.length||from===to)return steps;
  const next=[...steps], [entry]=next.splice(from,1);next.splice(to,0,entry);return next;
}
export function insertPlanComments(source:string,language:Language,steps:string[]):{source?:string;error?:string}{
  const notes=steps.flatMap(step=>step.split(/\r\n|\r|\n/)).map(step=>step.trim()).filter(Boolean).slice(0,24);
  if(!notes.length)return{error:'Write at least one step in your own words first.'};
  const lines=source.split('\n');
  const index=lines.findIndex(line=>language==='python'?/^\s*(?:async\s+)?def\s+solve\([^)]*\)\s*(?:->[^:]+)?\s*:\s*(?:#.*)?$/.test(line):/\bsolve\s*\([^)]*\)\s*\{\s*(?:\/\/.*)?$/.test(line));
  if(index<0)return{error:'Keep the solve signature on one line to insert comments here. Your plan is still saved; you can add it manually.'};
  const indent=(lines[index].match(/^\s*/)?.[0]??'')+'    ';
  const comments=notes.map(note=>`${indent}${language==='python'?'#':'//'} ${language==='java'?note.replace(/\\u/gi,'\\ u'):note}`);
  lines.splice(index+1,0,...comments);
  return{source:lines.join('\n')};
}
export function keywordLines(source:string,token:string,language:Language):number[]{
  const expression=token==='[index]'?/\[[^\]\n]+\]/:token==='[]'?/\[\s*\]/:token==='+='?/\+=/:token==='%'?/%/:new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`);
  return source.split('\n').flatMap((line,index)=>expression.test(line.split(language==='python'?'#':'//')[0])?[index+1]:[]);
}
