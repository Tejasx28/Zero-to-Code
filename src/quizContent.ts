import type { QuizKind } from './questState';
export interface CheckQuestion {prompt:string;options:string[];answer:number;why:string}
export const CHECKS:Record<QuizKind,CheckQuestion[]>={
 before:[
  {prompt:'A box holds 4 tokens. You add 3. What does it hold now?',options:['4','7','3'],answer:1,why:'Updating a running total combines its old value with the new amount.'},
  {prompt:'A row has four items. Its positions start at 0. What is the last position?',options:['4','3','1'],answer:1,why:'Four items have indexes 0, 1, 2, and 3.'},
  {prompt:'You inspect each item in [2, 5, 1] and add it to a total starting at zero. What is the total?',options:['8','3','5'],answer:0,why:'An accumulator collects 2 + 5 + 1 = 8.'},
  {prompt:'Which assumption allows you to rule out half of a row after comparing with its middle value?',options:['The row is sorted','The row has exactly ten items','The values are all positive'],answer:0,why:'Sorted order tells you which side can still contain the target.'},
  {prompt:'When putting [7, 3] in ascending order, what should happen?',options:['Keep the order','Swap the neighbors','Delete 7'],answer:1,why:'3 is smaller than 7; swapping preserves both values and orders them.'},
 ],
 after:[
  {prompt:'total starts at 6. Then total = total + 4 runs. What value should a function return if it returns total?',options:['6','4','10'],answer:2,why:'Assignment updates total to 10; return sends that value to the caller.'},
  {prompt:'values contains five items. Which expression gives its last index?',options:['The length','The length minus 1','Always 0'],answer:1,why:'Indexing starts at zero, so the last valid index is one less than the length.'},
  {prompt:'A loop visits [3, -2, 6], adding each value to total = 0. What should it return?',options:['7','9','6'],answer:0,why:'3 - 2 + 6 = 7. Negative inputs still belong in the total.'},
  {prompt:'In a sorted row, the probed value is smaller than the target. Which candidates can be discarded?',options:['The probe and everything to its left','Everything to its right','The entire row'],answer:0,why:'All values on the left are no larger than the probe and cannot equal the larger target.'},
  {prompt:'What does one complete left-to-right bubble-sort pass guarantee?',options:['Every item is sorted','The largest remaining item reaches the right boundary','The array has fewer items'],answer:1,why:'Neighbor swaps carry the largest remaining value to the end of the unsorted range.'},
 ],
 delayed:[
  {prompt:'A function begins with count = 2 and increases it by 5. What should return count give back?',options:['5','7','2'],answer:1,why:'The updated value is 7; returning makes that result available to the caller.'},
  {prompt:'An array has six items. Which index is outside its bounds?',options:['0','5','6'],answer:2,why:'The valid positions are 0 through 5.'},
  {prompt:'A total begins at zero and a loop adds [4, 4, -3]. What is the result?',options:['5','8','-3'],answer:0,why:'Both 4s must be counted: 4 + 4 - 3 = 5.'},
  {prompt:'In a sorted row, the probed value is larger than the target. Where could the target still be?',options:['Only to the right','Only to the left','Nowhere, definitely'],answer:1,why:'Smaller values lie to the left. The probe and larger values to its right can be excluded.'},
  {prompt:'Two equal neighbors appear during a sorting pass. Which action preserves ascending order?',options:['Delete one duplicate','Swap until they differ','Keep both in their current order'],answer:2,why:'Sorting must preserve duplicates. Equal neighbors are already in non-decreasing order.'},
 ]
};
