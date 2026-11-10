import type { GameId, Language } from './curriculum';
import { EXERCISES, UNITS } from './curriculum';
import { newBoard, validBoard } from './gameEngine';
import type { GameBoard } from './gameEngine';
export interface SavedGame { round:number; solved:number[]; board:GameBoard }
export interface CodeRecord { attempts:number; passed:boolean; assisted:boolean; firstScore:number; total:number; updatedAt:number }
export type QuizKind='before'|'after'|'delayed';
export interface QuizSession {kind:QuizKind;answers:number[];confidence:number;startedAt:number}
export interface QuizSnapshot extends QuizSession {score:number;finishedAt:number;format?:'code-v04'}
export interface QuestProgress {version:2;name:string;onboarded:boolean;language:Language;lessons:string[];flashcards:string[];games:Partial<Record<GameId,SavedGame>>;drafts:Record<string,string>;assisted:string[];code:Record<string,CodeRecord>;notes:string;hints:number;mistakes:number;activeQuiz:QuizSession|null;snapshots:QuizSnapshot[];baselineSkipped:boolean;reviewDueAt:number|null;legacyArchive:unknown;createdAt:number}
export const QUEST_KEY='dsa-quest:v0.2';
export const TWO_DAYS=48*60*60*1000;
export const codeKey=(id:string,language:Language)=>`${language}:${id}`;
export function freshQuest():QuestProgress{return{version:2,name:'Explorer',onboarded:false,language:'python',lessons:[],flashcards:[],games:{},drafts:{},assisted:[],code:{},notes:'',hints:0,mistakes:0,activeQuiz:null,snapshots:[],baselineSkipped:false,reviewDueAt:null,legacyArchive:null,createdAt:Date.now()};}
export function resetQuest(p:QuestProgress):QuestProgress{return{...freshQuest(),legacyArchive:p.legacyArchive};}
const object=(x:unknown):x is Record<string,unknown>=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const list=(x:unknown):x is string[]=>Array.isArray(x)&&x.every(v=>typeof v==='string');
export function decodeQuest(raw:string|null):QuestProgress|null {
  if(!raw)return null;
  try{
    const p=JSON.parse(raw) as QuestProgress;
    if(!object(p)||p.version!==2||typeof p.name!=='string'||typeof p.onboarded!=='boolean'||!['python','java'].includes(p.language)||!list(p.lessons)||!list(p.flashcards)||!object(p.games)||!object(p.drafts)||!Object.values(p.drafts).every(v=>typeof v==='string')||!object(p.code)||!list(p.assisted)||typeof p.notes!=='string'||typeof p.hints!=='number'||typeof p.mistakes!=='number'||!Array.isArray(p.snapshots)||!(p.activeQuiz===null||validQuiz(p.activeQuiz))||!p.snapshots.every(s=>validQuiz(s)&&Number.isInteger(s.score)&&s.score>=0&&s.score<=5&&Number.isFinite(s.finishedAt))||typeof p.baselineSkipped!=='boolean'||!(p.reviewDueAt===null||Number.isFinite(p.reviewDueAt)))return null;
    for(const [id,game]of Object.entries(p.games))if(!['robot','array','search','sort','stack'].includes(id)||!object(game)||!Number.isInteger(game.round)||game.round<0||game.round>2||!Array.isArray(game.solved)||!game.solved.every(n=>Number.isInteger(n)&&n>=0&&n<3)||!validBoard(game.board)||game.board.kind!==id||game.board.round!==game.round)return null;
    for(const value of Object.values(p.code))if(!object(value)||!Number.isInteger(value.attempts)||value.attempts<0||typeof value.passed!=='boolean'||typeof value.assisted!=='boolean'||!Number.isFinite(value.firstScore)||!Number.isFinite(value.total)||!Number.isFinite(value.updatedAt))return null;
    return p;
  }catch{return null;}
}
function validQuiz(q:unknown):q is QuizSession{return object(q)&&['before','after','delayed'].includes(String(q.kind))&&Array.isArray(q.answers)&&q.answers.length===5&&q.answers.every(n=>Number.isInteger(n)&&n>=-1&&n<=3)&&Number.isInteger(q.confidence)&&Number(q.confidence)>=1&&Number(q.confidence)<=5&&Number.isFinite(q.startedAt);}
export function loadQuest():{progress:QuestProgress;warning:string}{
  try{
    const raw=localStorage.getItem(QUEST_KEY);const saved=decodeQuest(raw);if(saved)return{progress:saved,warning:''};
    const next=freshQuest();const legacy=localStorage.getItem('dsa-quest:v0.1');
    if(legacy){try{const old=JSON.parse(legacy);if(object(old)){next.legacyArchive=old;if(typeof old.name==='string')next.name=old.name;next.onboarded=old.onboarded===true;}}catch{/* The old save remains untouched. */}}
    return{progress:next,warning:raw?'The latest save could not be read. Your old save has not been deleted. A fresh coding journey is ready.':''};
  }catch{return{progress:freshQuest(),warning:'Device storage is unavailable. Export your notes before leaving; refreshing may lose this session.'};}
}
export function gameFor(p:QuestProgress,id:GameId):SavedGame{return p.games[id]??{round:0,solved:[],board:newBoard(id)};}
export function questXP(p:QuestProgress):number{return p.lessons.length*20+p.flashcards.length*2+Object.values(p.games).reduce((n,g)=>n+g!.solved.length*25,0)+Object.values(p.code).filter(c=>c.passed).length*60;}
export function unitComplete(p:QuestProgress,id:string):boolean {const unit=UNITS.find(u=>u.id===id)!;return p.lessons.includes(id)&&Boolean(p.code[codeKey(unit.exercise,p.language)]?.passed);}
export function codeCompleted(p:QuestProgress):number{return EXERCISES.filter(e=>!e.independent&&p.code[codeKey(e.id,p.language)]?.passed).length;}
export function submitCode(p:QuestProgress,id:string,language:Language,score:number,total:number,now=Date.now()):QuestProgress {
  const key=codeKey(id,language),old=p.code[key];return{...p,code:{...p.code,[key]:{attempts:(old?.attempts??0)+1,passed:Boolean(old?.passed)||score===total,assisted:old?.assisted===true||p.assisted.includes(key),firstScore:old?.firstScore??score,total,updatedAt:now}}};
}
export function canReview(p:QuestProgress,now=Date.now()):boolean{return p.reviewDueAt!==null&&now>=p.reviewDueAt&&!p.snapshots.some(s=>s.kind==='delayed');}
