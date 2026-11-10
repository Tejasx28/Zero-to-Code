import type { CodeIntent, CodePlace } from './codeWords';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Exercise, Language } from './curriculum';
import type { RunResult } from './runtime';

export type CCEvent='planning'|'running'|'success'|'bug'|'hint'|'explore'|'greet'|'challenge';
export type CCEmotion='calm'|'thinking'|'proud'|'concerned';
const reactions:Record<CCEvent,{emotion:CCEmotion;label:string;message:string}>={
  greet:{emotion:'calm',label:'Still here',message:'You write the code. I’ll keep an eye on the tricky bits.'},
  challenge:{emotion:'thinking',label:'My move',message:'One new input. Let’s see how your idea holds up.'},
  explore:{emotion:'calm',label:'Here to help',message:'Write one small step. Run it and see what happens.'},
  planning:{emotion:'thinking',label:'Thinking with you',message:'Take your time. Write one step, then test it.'},
  running:{emotion:'thinking',label:'Watching your code',message:'Running your code. We’ll check the results together.'},
  success:{emotion:'proud',label:'Nice work',message:'Your code passed. Try a new input. I can show you how the code words work.'},
  bug:{emotion:'concerned',label:'Let’s investigate',message:'Let’s check one failed test. Compare the expected result with your result.'},
  hint:{emotion:'thinking',label:'One hint',message:'Here’s one hint. Try it before opening the next one.'},
};
export type CCDeskTab='home'|'clue'|'plan'|'trace'|'words'|'test'|'lab'|'xray'|'duel'|'build'|'clinic'|'radar'|'checkpoint'|'blueprint';
export interface CCWorkspace {key:string;scope:'story'|'practice'|'game'|'debug';exercise:Exercise;language:Language;source:string;result:RunResult|null;running:boolean;status:string;mode:'suite'|'custom';customArgs?:(number|number[])[]|null;hints?:string[];onRun:()=>void;onInsertSnippet?:(text:string,place:CodePlace)=>{error?:string};onTryCase?:(args:(number|number[])[])=>void;onFocusLine?:(line:number)=>void;onInsertPlan?:(steps:string[])=>{error?:string};onApplyPatch?:(before:string,after:string)=>{error?:string};}
interface CCState {event:CCEvent;emotion:CCEmotion;label:string;message:string;sequence:number}
interface CCContextValue extends CCState {buildIntent:CodeIntent;setBuildIntent:(intent:CodeIntent)=>void;lineNumber:number;setLineNumber:(line:number)=>void;reactTo:(event:CCEvent,detail?:string)=>void;deskOpen:boolean;deskTab:CCDeskTab;openDesk:(tab?:CCDeskTab)=>void;closeDesk:()=>void;setDeskTab:(tab:CCDeskTab)=>void;unread:boolean;workspace:CCWorkspace|null;registerWorkspace:(workspace:CCWorkspace)=>void;clearWorkspace:(key:string)=>void;caseIndex:number;setCaseIndex:(index:number)=>void}
const initial:CCState={event:'explore',...reactions.explore,sequence:0};
const CCContext=createContext<CCContextValue>({...initial,buildIntent:'loop',setBuildIntent:()=>{},lineNumber:1,setLineNumber:()=>{},reactTo:()=>{},deskOpen:false,deskTab:'clue',openDesk:()=>{},closeDesk:()=>{},setDeskTab:()=>{},unread:false,workspace:null,registerWorkspace:()=>{},clearWorkspace:()=>{},caseIndex:0,setCaseIndex:()=>{}});
export function CCProvider({children}:{children:ReactNode}){
  const [state,setState]=useState<CCState>(initial);
  const [deskOpen,setDeskOpen]=useState(false),[deskTab,setDeskTab]=useState<CCDeskTab>('home'),[unread,setUnread]=useState(false),[workspace,setWorkspace]=useState<CCWorkspace|null>(null);
  const [buildIntent,setBuildIntent]=useState<CodeIntent>('loop');
  const [caseIndex,setCaseIndex]=useState(0),[lineNumber,setLineNumber]=useState(1);
  const reactTo=useCallback((event:CCEvent,detail?:string)=>{const next={event,...reactions[event],message:detail?.trim()||reactions[event].message};setState(prev=>prev.event===next.event&&prev.message===next.message&&!['greet','challenge'].includes(event)?prev:{...next,sequence:prev.sequence+1});},[]);
  const openDesk=useCallback((tab:CCDeskTab='home')=>{setDeskTab(tab);setDeskOpen(true);setUnread(false);},[]);
  const closeDesk=useCallback(()=>setDeskOpen(false),[]);
  const registerWorkspace=useCallback((next:CCWorkspace)=>setWorkspace(next),[]);
  const clearWorkspace=useCallback((key:string)=>setWorkspace(prev=>prev?.key===key?null:prev),[]);
  useEffect(()=>{if(!deskOpen&&['bug','success','hint'].includes(state.event))setUnread(true);if(state.event==='explore')setUnread(false);},[state.sequence,state.event]);
  useEffect(()=>{const failed=workspace?.result?.results.findIndex((row,index)=>Boolean(row.error)||JSON.stringify(row.actual)!==JSON.stringify(workspace.exercise.cases[index]?.expected))??-1;setCaseIndex(Math.max(0,failed));},[workspace?.key,workspace?.result]);
  const value=useMemo(()=>({...state,buildIntent,setBuildIntent,lineNumber,setLineNumber,reactTo,deskOpen,deskTab,openDesk,closeDesk,setDeskTab,unread,workspace,registerWorkspace,clearWorkspace,caseIndex,setCaseIndex}),[state,buildIntent,lineNumber,reactTo,deskOpen,deskTab,openDesk,closeDesk,unread,workspace,registerWorkspace,clearWorkspace,caseIndex]);
  return <CCContext.Provider value={value}>{children}</CCContext.Provider>;
}
export function useCC(){return useContext(CCContext);}
export function CCAvatar({emotion}:{emotion?:CCEmotion}){
  const cc=useCC(),mood=emotion??cc.emotion;
  return <span key={cc.sequence} className={`cc-guide-avatar emotion-${mood} cc-react-${cc.event}`} role="img" aria-label={`C.C. looks ${mood}`}><span className="cc-emotion-portrait"/></span>;
}
export function CCGuide({children,compact=false,label,reactive=true}:{children?:ReactNode;compact?:boolean;label?:string;reactive?:boolean}){
  const cc=useCC();
  return <aside className={`cc-guide ${compact?'cc-compact':''}`} aria-label="C.C. guidance"><button className="cc-avatar-open" onClick={()=>cc.openDesk()} aria-label="Open C.C.’s help"><CCAvatar/></button><div><span className="cc-guide-label">{label??`C.C. · ${cc.label}`}</span><div className="cc-guide-words" aria-live="polite">{reactive&&(cc.event!=='explore'||cc.message!==reactions.explore.message)?<p>{cc.message}</p>:children??<p>{cc.message}</p>}</div></div></aside>;
}
export function CCScene({kind}:{kind:'study'|'practice'}){return <span className={`cc-scene cc-scene-${kind}`} role="img" aria-label={kind==='study'?'C.C. explaining with an open book':'C.C. encouraging you to practice'}/>;}

export function GeassMark(){return <svg viewBox="0 0 56 48" fill="none" aria-hidden="true"><path d="M4 5 23 19 28 42 33 19 52 5 43 26 30 44H26L13 26Z" fill="currentColor"/><path d="m15 9 13 9 13-9-8 18h-10Z" fill="currentColor"/><path d="m24 22 4 6 4-6-4 18Z" fill="#f3efe1"/></svg>;}
