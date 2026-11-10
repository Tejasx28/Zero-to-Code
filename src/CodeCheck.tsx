import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import type { Language } from './curriculum';
import type { QuestUpdate } from './CodeLab';
import type { QuestProgress, QuizKind, QuizSession } from './questState';
import { TWO_DAYS } from './questState';
import { GeassMark } from './CCGuide';
import { Button } from './ui';

interface CodeQuestion {prompt:string;source:string;options:string[];answer:number}
export function codeQuestions(kind:QuizKind,language:Language):CodeQuestion[]{
  const python=language==='python';
  const q=(prompt:string,py:string,java:string,pOptions:string[],jOptions:string[],answer:number):CodeQuestion=>({prompt,source:python?py:java,options:python?pOptions:jOptions,answer});
  if(kind==='before')return [
    q('Fill the gap so the caller receives the result, rather than just seeing a message.','def solve(a, b):\n    total = a + b\n    ____ total','public static int solve(int a, int b) {\n    int total = a + b;\n    ____ total;\n}',['print','return','pass'],['System.out.println','return','int'],1),
    q('This function promises the larger input. Which replacement repairs the first branch?','def solve(a, b):\n    if a > b:\n        return b  # repair this line\n    return b','public static int solve(int a, int b) {\n    if (a > b) return b; // repair this branch\n    return b;\n}',['return a','return a + b','return 0'],['return a;','return a + b;','return 0;'],0),
    q('Complete the loop so it visits every number from 1 through n, including n.','for i in range(1, ____):\n    total += i','for (int i = 1; ____; i++) {\n    total += i;\n}',['n','n - 1','n + 1'],['i < n','i < n - 1','i <= n'],2),
    q('The total is reset during every visit. Which change makes it accumulate the whole row?','for value in values:\n    total = 0\n    total += value\nreturn total','for (int value : values) {\n    total = 0;\n    total += value;\n}\nreturn total;',['Move total = 0 before the loop','Move return inside the loop','Replace += with ='],['Move total = 0 before the loop','Move return inside the loop','Replace += with ='],0),
    q('Assume the row is non-empty. Fill the gap to read its final value safely.','return values[____]','return values[____];',['len(values)','0','len(values) - 1'],['values.length','0','values.length - 1'],2),
  ];
  if(kind==='after')return [
    q('The tests compare a returned value. Which change repairs this function?','def solve(a, b):\n    print(a + b)','public static int solve(int a, int b) {\n    System.out.println(a + b);\n}',['Use return a + b','Print the result twice','Rename a to total'],['Use return a + b;','Print the result twice','Rename a to total'],0),
    q('Complete this condition so the smaller value is returned on the first path.','if ____:\n    return a\nreturn b','if (____) {\n    return a;\n}\nreturn b;',['a > b','a < b','a == b'],['a > b','a < b','a == b'],1),
    q('Which loop visits all valid indexes, including when the row is empty?','for i in ____:\n    total += values[i]','for (int i = 0; ____; i++) {\n    total += values[i];\n}',['range(1, len(values))','range(len(values) + 1)','range(len(values))'],['i <= values.length','i < values.length + 1','i < values.length'],2),
    q('This exits after the first value. Which line must move outside the loop?','total = 0\nfor value in values:\n    total += value\n    return total','int total = 0;\nfor (int value : values) {\n    total += value;\n    return total;\n}',['The starting total','The addition','The return'],['The starting total','The addition','The return'],2),
    q('This fails for an empty row. Which check belongs before reading the first value?','first = values[0]\nreturn first','int first = values[0];\nreturn first;',['if len(values) == 0: return -1','if values[0] == 0: return -1','if len(values) < 0: return -1'],['if (values.length == 0) return -1;','if (values[0] == 0) return -1;','if (values.length < 0) return -1;'],0),
  ];
  return [
    q('Fill the gap to end this function and give its computed answer to the caller.','def solve(values):\n    answer = len(values)\n    ____ answer','public static int solve(int[] values) {\n    int answer = values.length;\n    ____ answer;\n}',['print','return','for'],['System.out.println','return','int'],1),
    q('Complete the condition so equal inputs also take the first branch.','if ____:\n    return a\nreturn b','if (____) return a;\nreturn b;',['a >= b','a > b','a != b'],['a >= b','a > b','a != b'],0),
    q('The first position is skipped. Which start value repairs this indexed traversal?','for i in range(____, len(values)):\n    total += values[i]','for (int i = ____; i < values.length; i++) {\n    total += values[i];\n}',['1','-1','0'],['1','-1','0'],2),
    q('Only the last visited value survives. Which update preserves the running total?','total = 0\nfor value in values:\n    total = value\nreturn total','int total = 0;\nfor (int value : values) {\n    total = value;\n}\nreturn total;',['total += value','value = total','total = 0'],['total += value;','value = total;','total = 0;'],0),
    q('Choose the stopping condition that avoids reading one position beyond the array.','i = 0\nwhile ____:\n    total += values[i]\n    i += 1','int i = 0;\nwhile (____) {\n    total += values[i];\n    i++;\n}',['i <= len(values)','i < len(values)','i == len(values)'],['i <= values.length','i < values.length','i == values.length'],1),
  ];
}
export function resumeCheck(p:QuestProgress,kind:QuizKind):QuizSession{
  try{const q=JSON.parse(p.drafts[`v04:paused-check:${kind}`]??'') as QuizSession;if(q.kind===kind&&q.answers.length===5&&q.answers.every(n=>Number.isInteger(n)&&n>=-1&&n<=3)&&Number.isInteger(q.confidence)&&q.confidence>=1&&q.confidence<=5&&Number.isFinite(q.startedAt))return q;}catch{/* Start a fresh optional check. */}
  return {kind,answers:Array(5).fill(-1),confidence:3,startedAt:Date.now()};
}
export function currentCodeChecks(p:QuestProgress){return p.snapshots.filter(item=>item.format==='code-v04');}
export function canReviewCode(p:QuestProgress,now=Date.now()):boolean{const checks=currentCodeChecks(p),after=checks.find(item=>item.kind==='after');return Boolean(after&&now>=after.finishedAt+TWO_DAYS&&!checks.some(item=>item.kind==='delayed'));}
export function CodeCheck({progress:p,update,onExit}:{progress:QuestProgress;update:QuestUpdate;onExit:()=>void}){
  const session=p.activeQuiz!,questions=codeQuestions(session.kind,p.language),[index,setIndex]=useState(()=>Math.max(0,session.answers.findIndex(n=>n===-1))),current=questions[index];
  function answer(value:number){update(prev=>prev.activeQuiz?{...prev,activeQuiz:{...prev.activeQuiz,answers:prev.activeQuiz.answers.map((n,i)=>i===index?value:n)}}:prev);}
  function pause(){update(prev=>({...prev,drafts:{...prev.drafts,[`v04:paused-check:${session.kind}`]:JSON.stringify(session)},activeQuiz:null}));onExit();}
  function submit(){if(session.answers.some(n=>n<0))return;const score=questions.reduce((n,item,i)=>n+Number(session.answers[i]===item.answer),0);update(prev=>({...prev,activeQuiz:null,snapshots:[...prev.snapshots,{...session,score,finishedAt:Date.now(),format:'code-v04'}],reviewDueAt:session.kind==='after'?prev.reviewDueAt??Date.now()+TWO_DAYS:prev.reviewDueAt}));onExit();}
  return <main className="code-check"><header className="check-top"><span className="check-logo"><GeassMark/>DSA QUEST</span><button className="text-button" onClick={pause}>Save and leave<X size={15}/></button></header><div className="check-heading"><span className="section-kicker">OPTIONAL · {session.kind==='before'?'BEFORE LEARNING':session.kind==='after'?'AFTER LEARNING':'48-HOUR RECALL'}</span><h1>Read the code.<br/><em>Find the missing move.</em></h1><p>Five small code problems, without hints or answers until you finish. This checks code reading; writing your own solution is measured separately.</p></div><section className="check-card"><div className="check-progress"><span>CODE PROBLEM {index+1} / 5</span><span>{session.answers.filter(n=>n>=0).length} answered · {p.language==='python'?'Python':'Java'}</span></div><h2>{current.prompt}</h2><pre className="check-source">{current.source}</pre><div className="check-answers">{[...current.options,'I don’t know yet'].map((option,i)=><button key={option} aria-pressed={session.answers[index]===i} onClick={()=>answer(i)}><span>{i===3?'?':String.fromCharCode(65+i)}</span><code>{option}</code></button>)}</div><div className="check-controls"><Button secondary disabled={index===0} onClick={()=>setIndex(value=>value-1)}><ArrowLeft size={15}/>Back</Button>{index<4?<Button disabled={session.answers[index]<0} onClick={()=>setIndex(value=>value+1)}>Next<ArrowRight size={15}/></Button>:<Button disabled={session.answers.some(n=>n<0)} onClick={submit}>Save code check<Check size={15}/></Button>}</div></section><div className="check-confidence"><span>How confidently could you explain these fixes?</span><div role="group" aria-label="Confidence from 1 to 5">{[1,2,3,4,5].map(n=><button key={n} aria-pressed={session.confidence===n} onClick={()=>update(prev=>prev.activeQuiz?{...prev,activeQuiz:{...prev.activeQuiz,confidence:n}}:prev)}>{n}</button>)}</div></div><p className="check-small">1 = unsure · 5 = I can explain it. Your partial check saves on this device.</p></main>;
}
