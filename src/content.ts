import type { Question, TestKind } from './engine';
const q = (prompt: string, options: string[], answer: number, why: string, context?: string): Question => ({ prompt, options, answer, why, context });

export const PRE = [
  q('Which plate can you take without moving another plate?', ['The bottom plate', 'The top plate', 'Any plate'], 1, 'The top plate is the only one with nothing resting on it.', 'Three plates sit on top of each other.'),
  q('Which book will you take off first?', ['Atlas', 'Poems', 'Both together'], 1, 'Poems was placed last, so it is the first book you can reach.', 'You put Atlas on a table, then put Poems on top.'),
  q('After removing the top box, which box is now on top?', ['Moon', 'Sun', 'Star'], 2, 'Sun comes off first, exposing Star beneath it.', 'From bottom to top: Moon → Star → Sun.'),
  q('You only look at the top card. How many cards remain?', ['Two', 'Three', 'Zero'], 1, 'Looking does not remove anything. All three cards remain.', 'A pile contains three cards.'),
  q('What happens when you try to remove a cup?', ['A new cup appears', 'The oldest cup returns', 'There is no cup to remove'], 2, 'An empty collection has no item to give you.', 'The cup pile is empty.'),
];
export const POST = [
  q('Which item can pop() remove?', ['The bottom item', 'Any item you choose', 'The top item'], 2, 'A stack removes only its top item, the one added most recently.'),
  q('What does pop() return?', ['9', '4', 'undefined'], 0, 'The last value pushed was 9, so it comes out first.', 'Start empty. push(4), then push(9), then pop().'),
  q('What does peek() return now?', ['2', '6', '8'], 1, 'Popping removes 8. The new top, 6, is returned by peek.', 'Bottom → top: [2, 6, 8]. Run pop(), then peek().'),
  q('How many items remain after peek()?', ['One', 'Two', 'None'], 1, 'Peek reads the top without changing the stack.', 'Bottom → top: [5, 7]. Run peek().'),
  q('What does an empty JavaScript array return from pop()?', ['undefined', '0', 'The last removed value'], 0, 'JavaScript array pop() returns undefined when there is no item. Other stack implementations may choose to throw an error.'),
];
export const DELAYED = [
  q('Which parcel can be removed in one move?', ['Parcel L on the bottom', 'Parcel M in the middle', 'Parcel N on top'], 2, 'Only N is accessible without moving another parcel.', 'Parcels are piled L, then M, then N.'),
  q('What comes out next?', ['14', '27', 'Neither'], 1, '27 is the most recent addition and is still on top.', 'Start empty. push(14), push(27), then pop().'),
  q('Which value is now on top?', ['11', '22', '33'], 1, '33 is removed, revealing 22.', 'Bottom → top: [11, 22, 33]. Run pop().'),
  q('What is the size after this sequence?', ['Three', 'Two', 'One'], 0, 'Both peeks leave the three items untouched.', 'Bottom → top: [3, 12, 15]. Run peek(), then peek() again.'),
  q('What does the second pop() return?', ['18', 'undefined', '0'], 1, 'The first pop empties the array; the second has no value to return.', 'Start with [18]. Run pop(), then pop() again in JavaScript.'),
];
export const REHEARSAL = [
  q('Which object leaves first?', ['The scarf', 'The hat', 'The coat'], 1, 'The hat was added last and is accessible first.', 'A coat lies on a chair. A scarf is on the coat. A hat is on the scarf.'),
  q('Which value does pop() return?', ['10', '30', '20'], 2, '30 is removed, then 20 is pushed and becomes the new top.', 'push(10), push(30), pop(), push(20), pop().'),
  q('What does the final peek() return?', ['1', '3', '5'], 1, 'Removing 5 exposes 3. Peeking returns 3 without removing it.', 'Bottom → top: [1, 3, 5]. Run pop(), then peek().'),
  q('Which action changes the size of a non-empty stack?', ['peek()', 'Reading its length', 'pop()'], 2, 'Pop removes one item. Looking at the top or length does not change it.'),
  q('How many items are present at the end?', ['Zero', 'One', 'Two'], 0, 'The first pop is harmless on an empty array; push adds 2 and the last pop removes it.', 'An empty JavaScript array receives pop(), push(2), pop().'),
];
export const TRANSFER: Question[][] = [
  [q('Which room do you return to on the first Back action?', ['Garden', 'Gallery', 'Roof'], 1, 'The most recent previous room is Gallery. The route behaves like a stack of return locations.', 'You walk Garden → Gallery → Roof. A navigation system remembers each previous room in a stack.'),
    q('Which function finishes immediately before main() can resume?', ['draw()', 'load()', 'main()'], 1, 'Draw returns to load, then load returns to main. Nested calls unwind in reverse order.', 'main() calls load(). load() calls draw(). Each caller waits for its called function to finish.'),
    q('Which plan restores the previous command correctly?', ['Remove the oldest command', 'Read the newest command without removing it', 'Remove the newest command and reverse its effect'], 2, 'Undo must remove and reverse the most recent command. Merely reading it would undo the same command again.', 'A robot remembers completed commands: move, turn, paint. You are designing Undo.')],
  [q('Which route can you visit after going Back twice?', ['Shop', 'Search', 'Details'], 0, 'From Cart, the first Back returns to Details and the second to Shop.', 'Your history is Search → Shop → Details → Cart. Each Back removes the current page.'),
    q('Which box must close next?', ['Outer', 'Inner', 'Either'], 1, 'The inner box was opened most recently and must close before the outer box.', 'A packing process opens Outer, then Inner. Open boxes must be closed in reverse order.'),
    q('Which data should a stack store to support Undo?', ['Previous values in the order changes happened', 'Only the newest value forever', 'Values sorted from smallest to largest'], 0, 'Storing previous states in order lets Undo recover the most recent previous state first.', 'A brightness control changes from 20 to 40 to 70. Two Undo actions should restore 40, then 20.')],
  [q('Which location should be explored next using this stack?', ['Bridge', 'Cave', 'Forest'], 1, 'Cave was saved most recently and is popped first.', 'An explorer saves unvisited locations in this order: Forest, Bridge, Cave. The explorer takes the top location next.'),
    q('What should the parser do with the closing bracket ]?', ['Remove the most recent [', 'Remove the oldest (', 'Leave the stack unchanged'], 0, 'The most recent open bracket is [, matching ]. It is removed before the outer ( can close.', 'A parser reads ([ and stores unmatched opening brackets on a stack. The next symbol is ].'),
    q('Which design allows a preview without losing the next item?', ['Pop the top and discard it', 'Peek at the top', 'Remove the bottom'], 1, 'Peek reads the next item while preserving the stack for the real operation.', 'An app stores recent actions on a stack. A label must show what the next Undo would reverse, without performing Undo.')],
];
export function questionsFor(kind: TestKind, form = 0): Question[] {
  return kind === 'pre' ? PRE : kind === 'post' ? POST : kind === 'delayed' ? DELAYED : kind === 'transfer' ? TRANSFER[form] ?? TRANSFER[0] : REHEARSAL;
}
export const PRACTICE = [
  { id: 'predict', title: 'Read the next move', tag: 'Prediction', context: 'Bottom → top: [3, 7, 12]. Run pop(), push(5), then peek().', prompt: 'What does peek() return?', options: ['7', '5', '12'], answer: 1, why: 'Pop removes 12, then push puts 5 above 7. Peek reads 5 without taking it away.', hint: 'Keep a little list after each operation. What gets added after 12 is removed?' },
  { id: 'undo', title: 'The tiny Undo machine', tag: 'Everyday connection', context: 'You type “H”, then “i”, then “!”. Each typed character is saved as an action.', prompt: 'If you press Undo twice, which text remains?', options: ['Hi', '!', 'H'], answer: 2, why: 'Undo removes the newest action first: !, then i. Only H remains. This is why a stack is useful for Undo.', hint: 'Undo walks backward through actions. Which character was typed most recently?' },
  { id: 'debug', title: 'Find the sneaky bug', tag: 'Debugging', context: 'A stack contains [4, 8]. A developer writes a peek function that returns stack.pop().', prompt: 'What is wrong with this peek?', options: ['It removes 8 instead of just looking', 'It returns the bottom value', 'Nothing: pop and peek are identical'], answer: 0, why: 'Pop changes the stack. A peek should return stack[stack.length - 1] and leave both values in place.', hint: 'Compare what happens to the size after a pop and after a peek.' },
];
