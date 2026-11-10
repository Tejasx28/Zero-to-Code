import type { Language } from './curriculum';
export type CodeIntent='loop'|'index'|'write'|'remember'|'condition'|'update'|'collect'|'return';
export type CodePlace='cursor'|'setup'|'loop'|'condition'|'return';
export interface WordChoices {array:string;item:string;name:string;readName:string;value:string;operator:string;right:string;result:string;count:string;index:string;loopMode:'values'|'indexes';storeMode:'number'|'list';both:boolean;secondLeft:string;secondOperator:string;secondRight:string;}
export const INTENTS:{id:CodeIntent;title:string;thought:string;word:string}[]=[
  {id:'loop',title:'Visit every item',thought:'I want to do one step for each item.',word:'for'},
  {id:'index',title:'Read a position',thought:'I want the value at one position.',word:'[ ]'},
  {id:'write',title:'Change an array slot',thought:'I want to replace the value in one position.',word:'[ ] ='},
  {id:'remember',title:'Keep a value',thought:'I need to remember something.',word:'='},
  {id:'condition',title:'Choose when to act',thought:'I want this step to run only when a test is true.',word:'if'},
  {id:'update',title:'Change a value',thought:'I need to add to or subtract from a value.',word:'+='},
  {id:'collect',title:'Keep an item',thought:'I want to add this item to my result.',word:'append'},
  {id:'return',title:'Send the result back',thought:'The work is done. Give the caller the result.',word:'return'}
];
const RESERVED=new Set('def return for in if else elif while pass class public private protected static int new void true false null None True False import from as and or not break continue try catch final finally throw throws var let const function boolean float double long short byte char String switch case default do enum interface extends implements package instanceof synchronized this super assert await async lambda del global nonlocal raise with yield except finally is'.split(' '));
export const validName=(name:string)=>/^[A-Za-z_]\w*$/.test(name)&&!RESERVED.has(name);
const expression=(value:string)=>Boolean(value.trim())&&value.length<=120&&!/[;\n\r{}#]/.test(value);
export function parameterNames(source:string,language:Language) {
  const args=source.match(language==='python'?/def\s+solve\s*\(([^)]*)\)/:/\bsolve\s*\(([^)]*)\)/)?.[1]??'';
  return args.split(',').map(v=>language==='python'?v.trim().split(/[:=]/)[0].trim():v.trim().split(/\s+/).at(-1)??'').filter(validName);
}
export function defaultWords(source:string,language:Language):WordChoices {
  const params=parameterNames(source,language),item=/\bweight\b/.test(source)?'weight':/\bcommand\b/.test(source)?'command':'value';
  const result=/\bloaded\b/.test(source)?'loaded':'result', index=source.match(language==='python'?/for\s+(\w+)\s+in\s+range/:/for\s*\(\s*int\s+(\w+)\s*=/)?.[1]??'0';
  return{array:params[0]??'values',item,name:/\bremaining\b/.test(source)?'remaining':'total',readName:'current',value:'0',operator:'>',right:'0',result,count:/\bcount\b/.test(source)?'count':`${result}Count`,index,loopMode:'values',storeMode:'number',both:false,secondLeft:item,secondOperator:'<=',secondRight:'remaining'};
}
export function construct(intent:CodeIntent,language:Language,c:WordChoices):{code:string;words:{token:string;meaning:string}[];why:string;place:CodePlace;error?:string} {
  const names=intent==='loop'?[c.array,...(c.loopMode==='values'?[c.item]:[c.index])]:intent==='index'?[c.array,c.readName]:intent==='write'?[c.array]:intent==='remember'?c.storeMode==='list'?[c.array,c.result,c.count]:[c.name]:intent==='condition'?[c.item,...(c.both?[c.secondLeft]:[])]:intent==='update'?[c.name]:intent==='collect'?[c.result,c.item,c.count]:[];
  const fail={code:'',words:[],why:'',place:'cursor' as CodePlace,error:'Use a name that starts with a letter or _. Keywords such as for and return cannot be variable names.'};
  if(names.some(name=>!validName(name)))return fail;
  if((intent==='index'||intent==='write')&&!expression(c.index))return{...fail,error:'Use a position such as 0, or an existing index name.'};
  const expressions=intent==='condition'?[c.right,...(c.both?[c.secondRight]:[])]:intent==='write'||intent==='update'||intent==='return'||intent==='remember'&&c.storeMode==='number'?[c.value]:[];
  if(!expressions.every(expression))return{...fail,error:'Keep each value or expression on one line.'};
  const comparison=['>','<','==','!=','<=','>='].includes(c.operator)?c.operator:'>';
  const second=['>','<','==','!=','<=','>='].includes(c.secondOperator)?c.secondOperator:'<=';
  const py=language==='python',end=py?'':';';
  if(intent==='loop')return{code:py?(c.loopMode==='values'?`for ${c.item} in ${c.array}:\n    pass`:`for ${c.index} in range(len(${c.array})):\n    pass`):(c.loopMode==='values'?`for (int ${c.item} : ${c.array}) {\n  // Your step goes here.\n}`:`for (int ${c.index} = 0; ${c.index} < ${c.array}.length; ${c.index}++) {\n  // Your step goes here.\n}`),words:py?[{token:'for',meaning:'Repeat the body once for each item or position.'},{token:c.loopMode==='values'?c.item:c.index,meaning:'A name you choose. It refers to the current item or position.'},{token:c.loopMode==='values'?`in ${c.array}`:'range(len(...))',meaning:c.loopMode==='values'?'Read the items from this array, in order.':'Produce positions from zero up to, but not including, the length.'}]:[{token:'for',meaning:'Repeat the statements inside the braces.'},{token:c.loopMode==='values'?`int ${c.item}`:`int ${c.index}`,meaning:'Create a name for the current whole number.'},{token:c.loopMode==='values'?`: ${c.array}`:`${c.index} < ${c.array}.length`,meaning:c.loopMode==='values'?'Read each item from this array.':'Stop before the first position outside the array.'}],why:'Put the useful step inside this loop. Keep a value before the loop when it must survive every visit.',place:'return'};
  if(intent==='index')return{code:`${py?'':'int '}${c.readName} = ${c.array}[${c.index}]${end}`,words:[{token:c.array,meaning:'The array you are reading.'},{token:`[${c.index}]`,meaning:'Use a position to select one item. The first position is zero.'},{token:'=',meaning:'Store the selected value under this name.'}],why:'The position must exist. For an empty array, there is no position zero.',place:'loop'};
  if(intent==='write')return{code:`${c.array}[${c.index}] = ${c.value}${end}`,words:[{token:`${c.array}[${c.index}]`,meaning:'The position that will receive a new value.'},{token:'=',meaning:'Compute the right side first. Then replace the old value in this slot.'},{token:c.value,meaning:'The new value or expression.'}],why:'Save the old value first if a later step will still need it.',place:'loop'};
  if(intent==='remember')return{code:c.storeMode==='list'?(py?`${c.result} = []`:`int[] ${c.result} = new int[${c.array}.length];\nint ${c.count} = 0;`):`${py?'':'int '}${c.name} = ${c.value}${end}`,words:c.storeMode==='list'?[{token:py?'[]':'new int[...]',meaning:py?'Start an empty list. It can grow as you collect items.':'Make space for at most one result per input item.'},{token:py?c.result:c.count,meaning:py?'The name of the result list.':'Keep track of how many output positions you have used.'}]:[{token:py?c.name:`int ${c.name}`,meaning:py?'Choose a name for the value you want to keep.':'Declare a name for a whole number.'},{token:'=',meaning:'Compute the right side, then store it on the left.'},{token:c.value,meaning:'The starting value. This can be a number or another existing name.'}],why:'Set this up before the loop if you want to keep it between visits.',place:'setup'};
  if(intent==='condition'){const test=`${c.item} ${comparison} ${c.right}${c.both?`${py?' and ':' && '}${c.secondLeft} ${second} ${c.secondRight}`:''}`;return{code:py?`if ${test}:\n    pass`:`if (${test}) {\n  // Your step goes here.\n}`,words:[{token:'if',meaning:'Run the body only when this test is true.'},{token:comparison,meaning:({'>':'greater than','<':'less than','==':'equal to','!=':'different from','<=':'no larger than','>=':'at least'} as Record<string,string>)[comparison]},{token:c.both?(py?'and':'&&'):(py?': + indentation':'{ }'),meaning:c.both?'Both tests must be true.':py?'Indent the statements that belong to this choice.':'Braces group the statements controlled by the choice.'}],why:'Put the action inside the condition. A false test skips that body.',place:'loop'};}
  if(intent==='update'){const op=c.operator==='-='?'-=':'+=';return{code:`${c.name} ${op} ${c.value}${end}`,words:[{token:c.name,meaning:'The value you are changing.'},{token:op,meaning:op==='+='?'Add the right side to the previous value.':'Subtract the right side from the previous value.'},{token:c.value,meaning:'How much to change it by.'}],why:'Update the value when the relevant action happens, for example after loading a crate.',place:'condition'};}
  if(intent==='collect')return{code:py?`${c.result}.append(${c.item})`:`${c.result}[${c.count}] = ${c.item};\n${c.count} += 1;`,words:py?[{token:c.result,meaning:'The list that keeps accepted items.'},{token:'.append',meaning:'Add one item at the end without replacing earlier items.'},{token:c.item,meaning:'The item to keep this time.'}]:[{token:`[${c.count}]`,meaning:'Write into the next unused output position.'},{token:'=',meaning:'Store the current item in that position.'},{token:`${c.count} += 1`,meaning:'Move the output position forward for the next accepted item.'}],why:'Create the result list or output array first. Add only the items allowed by your rule.',place:'condition'};
  return{code:`return ${c.value}${end}`,words:[{token:'return',meaning:'Send a result back and end this function call.'},{token:c.value,meaning:'The value the caller will receive.'}],why:'For a result built from all items, return after the loop. Return early only when the task asks for an early answer.',place:'return'};
}

function lastWhere<T>(items:T[],test:(value:T,index:number)=>boolean){for(let i=items.length-1;i>=0;i--)if(test(items[i],i))return i;return -1;}
interface InsertPlan {from:number;to:number;text:string;selection:number;selectionEnd?:number;error?:string}
const indent=(line:string)=>line.match(/^[ \t]*/)?.[0].replace(/\t/g,'    ')??'';
function closeBrace(source:string,open:number) {let depth=0,quote='',lineComment=false,blockComment=false;for(let i=open;i<source.length;i++){const c=source[i],n=source[i+1];if(lineComment){if(c==='\n')lineComment=false;continue;}if(blockComment){if(c==='*'&&n==='/'){blockComment=false;i++;}continue;}if(quote){if(c==='\\'){i++;continue;}if(c===quote)quote='';continue;}if(c==='/'&&n==='/'){lineComment=true;i++;continue;}if(c==='/'&&n==='*'){blockComment=true;i++;continue;}if(c==='"'||c==="'"){quote=c;continue;}if(c==='{')depth++;if(c==='}'&&--depth===0)return i;}return-1;}
export function planConstructInsert(source:string,cursor:number,snippet:string,language:Language,place:CodePlace='cursor'):InsertPlan {
  const fail=(message:string):InsertPlan=>({from:0,to:0,text:'',selection:0,error:message});
  if(!snippet.trim()||snippet.length>3000)return fail('Choose one short construct first.');
  const lines=source.split('\n'),starts:number[]=[];let offset=0;for(const line of lines){starts.push(offset);offset+=line.length+1;}
  const lineOf=(pos:number)=>Math.max(0,lastWhere(starts,start=>start<=pos));
  const py=language==='python',unit=py?'    ':'  ';
  let header=-1,endLine=lines.length,bodyIndent='';
  if(py){header=lines.findIndex(line=>/^\s*def\s+solve\s*\([^)]*\)\s*:/.test(line));if(header<0)return fail('Keep the solve function from the starter. Add your steps inside it.');if(!/^\s*def\s+solve\s*\([^)]*\)\s*:\s*(?:#.*)?$/.test(lines[header]))return fail('Put the function body on separate indented lines first.');bodyIndent=indent(lines[header])+unit;for(let i=header+1;i<lines.length;i++)if(lines[i].trim()&&!lines[i].trim().startsWith('#')&&indent(lines[i]).length< bodyIndent.length){endLine=i;break;}}
  else{const method=/\bsolve\s*\([^)]*\)\s*\{/.exec(source);if(!method)return fail('Keep the solve method and its braces from the starter.');const open=method.index+method[0].lastIndexOf('{'),close=closeBrace(source,open);if(close<0)return fail('Close the method’s braces before adding another step.');header=lineOf(open);endLine=lineOf(close);if(header===endLine)return fail('Put the method body and closing brace on separate lines first.');bodyIndent=indent(lines[header])+unit;}
  let at=lineOf(Math.max(0,Math.min(cursor,source.length))),leading=bodyIndent,replace=false;
  function bodyOf(kind:'loop'|'condition') {
    const pattern=kind==='loop'?/^\s*(for|while)\b/:/^\s*if\b/;
    const h=lines.findIndex((line,i)=>i>header&&i<endLine&&pattern.test(line));
    if(h<0)return null;
    const clean=lines[h].split(py?'#':'//')[0].trim();
    if(!clean.endsWith(py?':':'{'))return {error:py?'Put this block on separate indented lines first.':'This block needs braces before another step can be added.'};
    const base=indent(lines[h])+unit;let end=endLine;
    if(py){for(let i=h+1;i<endLine;i++)if(lines[i].trim()&&indent(lines[i]).length<base.length){end=i;break;}}
    else {const open=starts[h]+lines[h].indexOf('{'),close=closeBrace(source,open);if(close<0)return{error:'Close this block’s braces first.'};end=lineOf(close);}
    const placeholder=lines.findIndex((line,i)=>i>h&&i<end&&(py?line.trim()==='pass':line.trim()==='// Your step goes here.'));
    return{at:placeholder>=0?placeholder:end,leading:base,replace:placeholder>=0};
  }
  if(place==='setup'){at=header+1;leading=bodyIndent;}
  else if(place==='loop'||place==='condition'){
    const block=bodyOf(place)??(place==='condition'?bodyOf('loop'):null);
    if(block&&'error'in block)return fail(block.error??'Check the block first.');
    if(block){at=block.at!;leading=block.leading!;replace=block.replace!;}else place='return';
  }
  if(place==='return'){
    const r=lastWhere(lines,(line,i)=>i>header&&i<endLine&&indent(line).length===bodyIndent.length&&/^return\b/.test(line.trim()));
    const placeholder=lines.findIndex((line,i)=>i>header&&i<endLine&&indent(line).length===bodyIndent.length&&line.trim()==='pass');
    if(/^return\b/.test(snippet.trim())&&r>=0){at=r;replace=true;}
    else{at=r>=0?r:placeholder>=0?placeholder:endLine;replace=placeholder>=0&&r<0;}
    leading=bodyIndent;
  }
  if(place==='cursor'){
    if(at<=header||at>=endLine){at=header+1;leading=bodyIndent;}
    else{leading=indent(lines[at]);replace=lines[at].trim()==='pass'||lines[at].trim()==='// Your step goes here.';if(!replace&&!/^return\b/.test(lines[at].trim())){if(lines[at].trim().endsWith(py?':':'{'))leading+=unit;at++;}}
  }
  const text=snippet.split('\n').map(line=>leading+line).join('\n');
  const from=at<starts.length?starts[at]:source.length,to=replace?from+(lines[at]?.length??0):from;
  const prefix=at>=lines.length&&source&&!source.endsWith('\n')?'\n':'';
  const insert=prefix+text+(replace?'':'\n');
  const placeholder=py?(insert.match(/\bpass\b/)?.index??-1):insert.indexOf('// Your step goes here.');
  return{from,to,text:insert,selection:from+(placeholder>=0?placeholder:prefix.length+text.length),selectionEnd:placeholder>=0?from+placeholder+(py?4:'// Your step goes here.'.length):undefined};
}
