import { useEffect, useState } from 'react';
import type { Language } from './curriculum';
import { keywordLines } from './companionHelpers';

interface Keyword { token:string; title:string; meaning:string; example:string; note?:string }
const PYTHON:Keyword[]=[
  {token:'while',title:'Repeat while a condition stays true',meaning:'A while loop checks its condition before each repetition. Change the condition’s state inside the loop so it can eventually stop.',example:'while n > 0:\n    total += n\n    n -= 1'},
  {token:'else',title:'Handle the other path',meaning:'An else block runs when the preceding if condition was false. It does not need another condition.',example:'if value > 0:\n    run += 1\nelse:\n    run = 0'},
  {token:'elif',title:'Try the next condition',meaning:'elif is another condition to check when an earlier if was false. Only the first matching branch runs.',example:'if command == 1:\n    y -= 1\nelif command == 2:\n    x += 1'},
  {token:'[]',title:'Start a new result row',meaning:'An empty pair of square brackets creates a new Python list. Append values when your algorithm produces them.',example:'result = []\nresult.append(value)'},
  {token:'pass',title:'A placeholder, not an answer',meaning:'pass does nothing. It keeps an unfinished block valid while you write it. Replace it with the work your function needs to do.',example:'def solve(values):\n    pass  # replace this placeholder'},
  {token:'len',title:'Count the positions',meaning:'len(values) gives the number of items. It is not an item index. An empty list has length zero.',example:'size = len(values)'},
  {token:'append',title:'Keep another result',meaning:'append puts a new value at the end of a list. Use it to build an output row while you visit the input.',example:'result.append(value)'},
  {token:'+=',title:'Update a running value',meaning:'total += value means total = total + value. The old total contributes to the new one.',example:'total += value'},
  {token:'%',title:'Read the remainder',meaning:'The remainder after division can test a pattern. A value divisible by 2 has remainder zero, including zero itself.',example:'if value % 2 == 0:\n    # this value is even'},
  {token:'def',title:'Define a job once',meaning:'def starts a function. The names inside the parentheses receive the inputs. The indented lines are the work that function will do.',example:'def solve(values):\n    # your instructions go here'},
  {token:'return',title:'Send the result back',meaning:'return gives a value back to the code calling your function. It also ends that function call. Printing only shows text; it does not return the answer.',example:'return total',note:'A return inside a loop can stop the work after just one value.'},
  {token:'for',title:'Visit values one at a time',meaning:'A for loop repeats its indented block for each value in a collection. On each repetition, value refers to the next item.',example:'for value in values:\n    # use this value'},
  {token:'range',title:'Generate a sequence of positions',meaning:'range makes whole numbers from a start up to, but not including, a stop. range(3) visits 0, 1, and 2.',example:'for i in range(len(values)):\n    # i is a valid index',note:'range(1, n + 1) includes n because the stop is excluded.'},
  {token:'if',title:'Choose when a block runs',meaning:'An if checks a condition. Its indented block runs only when the condition is true. Use == to compare equality; = assigns a value.',example:'if value > limit:\n    # run only when this is true'},
  {token:'[index]',title:'Read one position',meaning:'Square brackets access a position. Positions start at zero. For a row of length 3, the valid indexes are 0, 1, and 2.',example:'first = values[0]',note:'Check for empty input before reading the first position.'},
];
const JAVA:Keyword[]=[
  {token:'while',title:'Repeat while a condition stays true',meaning:'A while loop checks its condition before each repetition. Update the state inside it so the condition can become false.',example:'while (n > 0) {\n  total += n;\n  n--;\n}'},
  {token:'else',title:'Handle the other path',meaning:'An else block runs when the preceding if was false. An else if adds another condition to try.',example:'if (value > 0) {\n  run++;\n} else {\n  run = 0;\n}'},
  {token:'new',title:'Allocate an output array',meaning:'new int[size] creates a separate array with that many whole-number positions. Use it when a new result protects inputs you still need.',example:'int[] result = new int[values.length];'},
  {token:'if',title:'Choose one branch',meaning:'The block runs only when its condition is true. An else block handles the alternative. A branch can update a value or return a result.',example:'if (value > 0) {\n  total += value;\n}'},
  {token:'+=',title:'Update a running value',meaning:'total += value keeps the previous total and adds this value. Assignment with = alone replaces it.',example:'total += value;'},
  {token:'%',title:'Read the remainder',meaning:'The remainder operator is useful for conditions such as even or odd. A whole number divisible by 2 has remainder zero.',example:'if (value % 2 == 0) count++;'},
  {token:'public',title:'Allow this method to be called',meaning:'public makes the class or method accessible to the test code. Keep it in the starter so the tests can call your solution.',example:'public class Solution {\n  // your method lives here\n}'},
  {token:'static',title:'Call the method through its class',meaning:'static lets the tests call solve without first creating a Solution object. For these exercises, keep the starter signature and focus on the method body.',example:'public static int solve(int[] values)'},
  {token:'int',title:'A whole-number value',meaning:'int declares a whole-number type. int[] means an array of whole numbers. The type before solve says what the method must return.',example:'int total = 0;\nint[] values = {3, 8, 2};'},
  {token:'return',title:'Send the result back',meaning:'return hands a value back to the caller and ends this method call. The returned value must match the method’s declared type.',example:'return total;',note:'System.out.println shows a value. It does not replace return.'},
  {token:'for',title:'Repeat a block of work',meaning:'An enhanced for loop visits every value in the array. An indexed for loop also gives you a position you can use to read or update the row.',example:'for (int value : values) {\n  // use this value\n}'},
  {token:'[index]',title:'Read or update a position',meaning:'Array indexes start at zero. values.length is the item count, so the last valid index is values.length - 1.',example:'int first = values[0];',note:'An empty array has length 0 and no valid index.'},
];

export function KeywordGuide({language,source,onLocate,tokens}:{language:Language;source?:string;onLocate?:(line:number)=>void;tokens?:string[]}) {
  const all=(language==='python'?PYTHON:JAVA).filter(word=>!tokens||tokens.includes(word.token));
  const [selected,setSelected]=useState('def'),[sourceOnly,setSourceOnly]=useState(true);
  useEffect(()=>setSelected(language==='python'?'def':'public'),[language]);
  const detected=source?all.filter(word=>keywordLines(source,word.token,language).length>0):all;
  const words=source&&sourceOnly&&detected.length?detected:all;
  const word=words.find(entry=>entry.token===selected)??words[0]??(language==='python'?PYTHON:JAVA)[0];
  const locations=source?keywordLines(source,word.token,language):[];
  return <div className="keyword-guide">
    <p className="guide-intro">{source?'Connect a word to a line of code.':'A word in the code looks unfamiliar? Tap it here.'}</p>
    {source&&<button className="keyword-scope" onClick={()=>setSourceOnly(value=>!value)}>{sourceOnly?'In this code · show all words':'All words · focus on my code'}</button>}
    <div className="keyword-chips" role="group" aria-label={`${language==='python'?'Python':'Java'} keyword glossary`}>
      {words.map(entry=><button key={entry.token} aria-pressed={entry.token===word.token} className={entry.token===word.token?'selected':''} onClick={()=>setSelected(entry.token)}><code>{entry.token}</code></button>)}
    </div>
    <section className="keyword-explanation" aria-live="polite">
      <h3><code>{word.token}</code><span>{word.title}</span></h3>
      <p>{word.meaning}</p>
      <pre>{word.example}</pre>
      {word.note&&<small>{word.note}</small>}
      {source&&onLocate&&<div className="keyword-source-location">{locations.length?<><span>Text found in your code</span>{locations.slice(0,6).map(line=><button key={line} onClick={()=>onLocate?.(line)} disabled={!onLocate}>Jump to line {line}</button>)}</>:<span>This word is not in your current source yet.</span>}</div>}
    </section>
  </div>;
}
