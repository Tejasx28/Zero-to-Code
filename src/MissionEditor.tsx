import { planConstructInsert } from './codeWords';
import type { CodePlace } from './codeWords';
import { useEffect, useRef, useState } from 'react';
import { Annotation, Compartment, EditorState, StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView, drawSelection, highlightActiveLine, highlightActiveLineGutter, highlightWhitespace, keymap, lineNumbers } from '@codemirror/view';
import type { DecorationSet } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentLess, indentMore, indentWithTab, insertNewlineAndIndent, isolateHistory, redo, toggleTabFocusMode, undo } from '@codemirror/commands';
import { bracketMatching, foldGutter, foldKeymap, HighlightStyle, indentOnInput, syntaxHighlighting } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { setDiagnostics } from '@codemirror/lint';
import { editorLanguage } from './editorLanguage';
import { TextIndent, TextOutdent, DotsThree, Code as CodeIcon } from '@phosphor-icons/react';
import { tags } from '@lezer/highlight';
import type { Language } from './curriculum';

const markLine=StateEffect.define<number|null>();
const externalUpdate=Annotation.define<boolean>();
const traceLine=StateField.define<DecorationSet>({
  create:()=>Decoration.none,
  update(value,transaction){
    value=value.map(transaction.changes);
    for(const effect of transaction.effects)if(effect.is(markLine)){const n=effect.value;value=n!==null&&n>0&&n<=transaction.state.doc.lines?Decoration.set([Decoration.line({class:'cm-trace-line'}).range(transaction.state.doc.line(n).from)]):Decoration.none;}
    return value;
  },provide:field=>EditorView.decorations.from(field)
});
const theme=EditorView.theme({
  '&':{height:'100%',fontSize:'14px',color:'#153d35',backgroundColor:'#fbfaf4'},
  '.cm-scroller':{fontFamily:'var(--font-code)',lineHeight:'20px',overflow:'auto'},
  '.cm-content':{padding:'24px 0',caretColor:'#ef633f',minHeight:'100%'},
  '.cm-line':{padding:'0 22px 0 11px'},
  '.cm-gutters':{backgroundColor:'#f0f2e6',borderRight:'1px solid #e0e6d6',color:'#99a58e'},
  '.cm-gutterElement':{padding:'0 12px 0 13px'},
  '.cm-activeLine':{backgroundColor:'#edf1e480'},
  '.cm-activeLineGutter':{backgroundColor:'#e5ecd9',color:'#67845b'},
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection':{backgroundColor:'#bbd1ba75!important'},
  '&.cm-focused':{outline:'none'},
  '.cm-cursor':{borderLeftColor:'#ef633f'},
  '.cm-matchingBracket':{backgroundColor:'#d6e3cc',outline:'1px solid #9db991'},
  '.cm-panels':{backgroundColor:'#e9efdd',color:'#496d3e',borderColor:'#c7d6ba'},
  '.cm-panel input':{backgroundColor:'#faf8f0',border:'1px solid #bacdab',color:'#153d35',padding:'5px',borderRadius:'3px'},
  '.cm-panel button':{backgroundColor:'#d9e5cd',border:'1px solid #bacdab',color:'#365f2e'},
  '.cm-searchMatch':{backgroundColor:'#e9d6b16b',outline:'1px solid #c8ad77'},
  '.cm-searchMatch-selected':{backgroundColor:'#ecc79980'},
  '.cm-trace-line':{backgroundColor:'#fff0e0',borderLeft:'3px solid #ef633f',paddingLeft:'8px'},
  '.cm-tooltip':{border:'1px solid #c4d4b8',backgroundColor:'#f3f5e9',color:'#375f30'},
  '.cm-diagnostic':{padding:'6px 10px',fontFamily:'Inter,"Segoe UI",sans-serif',fontSize:'12px'},
  '.cm-lintRange-error':{backgroundImage:'none',textDecoration:'underline wavy #d5825b',textUnderlineOffset:'4px'},
},{dark:false});
const colors=HighlightStyle.define([
  {tag:tags.keyword,color:'#285a3b',fontWeight:'650'},{tag:[tags.function(tags.variableName),tags.definition(tags.variableName)],color:'#497b44'},
  {tag:tags.number,color:'#8155af'},{tag:tags.string,color:'#4f7851'},{tag:tags.comment,color:'#62715a'},
  {tag:tags.typeName,color:'#567968'},{tag:tags.operator,color:'#637a5a'},{tag:tags.bool,color:'#bd7346'},
]);
export type InsertConstruct = (text:string,place:CodePlace)=>{error?:string};
export function MissionEditor({value,language,onChange,onRun,activeLine,errorLine,errorMessage,focusRequest,onExplainLine,onInsertReady}:{value:string;language:Language;onChange:(source:string)=>void;onRun:()=>void;activeLine:number|null;errorLine:number|null;errorMessage?:string;focusRequest?:{line:number;nonce:number}|null;onExplainLine?:(line:number)=>void;onInsertReady?:(insert:InsertConstruct|null)=>void}) {
  const host=useRef<HTMLDivElement>(null),view=useRef<EditorView|null>(null),change=useRef(onChange),run=useRef(onRun);
  const languageCompartment=useRef(new Compartment());
  const whitespaceCompartment=useRef(new Compartment()),[spaces,setSpaces]=useState(false);
  change.current=onChange;run.current=onRun;
  useEffect(()=>{
    if(!host.current)return;
    const editor=new EditorView({parent:host.current,state:EditorState.create({doc:value,extensions:[
      lineNumbers(),highlightActiveLineGutter(),foldGutter(),drawSelection(),history(),indentOnInput(),bracketMatching(),closeBrackets(),highlightActiveLine(),highlightSelectionMatches(),traceLine,
      languageCompartment.current.of(editorLanguage(language)),whitespaceCompartment.current.of([]),theme,syntaxHighlighting(colors),
      keymap.of([{key:'Mod-Enter',run:()=>{run.current();return true;}},{key:'Ctrl-m',run:toggleTabFocusMode},{key:'Ctrl-z',run:undo,preventDefault:true},{key:'Ctrl-y',run:redo,preventDefault:true},{key:'Ctrl-Shift-z',run:redo,preventDefault:true},{key:'Mod-Shift-z',run:redo,preventDefault:true},{key:'Enter',run:insertNewlineAndIndent},indentWithTab,...closeBracketsKeymap,...defaultKeymap,...historyKeymap,...searchKeymap,...foldKeymap]),
      EditorView.contentAttributes.of({'aria-label':`${language==='python'?'Python':'Java'} solution editor`,spellcheck:'false',autocapitalize:'off','aria-describedby':'mission-editor-help'}),
      EditorView.updateListener.of(update=>{if(update.docChanged&&!update.transactions.some(transaction=>transaction.annotation(externalUpdate)))change.current(update.state.doc.toString());})
    ]})});
    view.current=editor;
    onInsertReady?.((text,place)=>{const plan=planConstructInsert(editor.state.doc.toString(),editor.state.selection.main.head,text,language,place);if(plan.error)return{error:plan.error};editor.dispatch({changes:{from:plan.from,to:plan.to,insert:plan.text},selection:{anchor:plan.selection,head:plan.selectionEnd??plan.selection},annotations:isolateHistory.of('full'),userEvent:'input.cc-construct',scrollIntoView:true});editor.focus();return{};});
    return()=>{onInsertReady?.(null);editor.destroy();view.current=null;};
    // The editor stays mounted while React saves every document change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  useEffect(()=>{const editor=view.current;if(editor&&value!==editor.state.doc.toString())editor.dispatch({changes:{from:0,to:editor.state.doc.length,insert:value},annotations:[externalUpdate.of(true),isolateHistory.of('full')]});},[value]);
  useEffect(()=>{view.current?.dispatch({effects:languageCompartment.current.reconfigure(editorLanguage(language))});view.current?.contentDOM.setAttribute('aria-label',`${language==='python'?'Python':'Java'} solution editor`);},[language]);
  useEffect(()=>{view.current?.dispatch({effects:whitespaceCompartment.current.reconfigure(spaces?highlightWhitespace():[])});},[spaces]);
  useEffect(()=>{const editor=view.current;if(!editor)return;const effects=[markLine.of(activeLine)];if(activeLine!==null&&activeLine>0&&activeLine<=editor.state.doc.lines)editor.dispatch({effects:[...effects,EditorView.scrollIntoView(editor.state.doc.line(activeLine).from,{y:'center'})]});else editor.dispatch({effects});},[activeLine]);
  useEffect(()=>{const editor=view.current;if(!editor)return;const line=errorLine!==null&&errorLine>0&&errorLine<=editor.state.doc.lines?editor.state.doc.line(errorLine):null;editor.dispatch(setDiagnostics(editor.state,line?[{from:line.from,to:line.to,severity:'error',message:errorMessage??'Check this reported line.'}]:[]));},[errorLine,errorMessage]);
  useEffect(()=>{const editor=view.current;if(!editor||!focusRequest)return;const target=editor.state.doc.line(Math.max(1,Math.min(editor.state.doc.lines,focusRequest.line)));editor.dispatch({selection:{anchor:target.from},effects:EditorView.scrollIntoView(target.from,{y:'center'})});editor.focus();},[focusRequest]);
  return <div className="editor-shell"><div className="editor-spacing-tools"><span>{language==='python'?'Python · 4 spaces':'Java · 2 spaces'}</span><div>{onExplainLine&&<button type="button" aria-label="Explain my current line" onClick={()=>{const editor=view.current;if(editor)onExplainLine(editor.state.doc.lineAt(editor.state.selection.main.head).number);}}><CodeIcon size={16}/><span className="explain-line-label">Read line</span></button>}<button type="button" aria-label="Indent selected lines" title="Indent selected lines" onClick={()=>{if(view.current){indentMore(view.current);view.current.focus();}}}><TextIndent size={16}/></button><button type="button" aria-label="Unindent selected lines" title="Unindent selected lines" onClick={()=>{if(view.current){indentLess(view.current);view.current.focus();}}}><TextOutdent size={16}/></button><button type="button" aria-pressed={spaces} onClick={()=>setSpaces(value=>!value)}><DotsThree size={16}/>{spaces?'Hide spaces':'Show spaces'}</button></div></div><div ref={host} className="mission-codemirror"/></div>;
}
