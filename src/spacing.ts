export interface SpacingEdit { before: string; after: string; line: number }
export interface SpacingCandidate { label: string; source: string; edits: SpacingEdit[] }
export function indentWidth(line: string): number {
  let width = 0;
  for (const char of line.match(/^[ \t]*/)?.[0] ?? '') width = char === '\t' ? width + 8 - width % 8 : width + 1;
  return width;
}
export function sameInstructions(before: string, after: string): boolean {
  const clean = (s: string) => s.replace(/\r\n/g, '\n').split('\n').map(line => line.replace(/^[ \t]*/, ''));
  return JSON.stringify(clean(before)) === JSON.stringify(clean(after));
}
export function spacingEdits(before: string, after: string): SpacingEdit[] {
  const a = before.replace(/\r\n/g, '\n').split('\n'), b = after.replace(/\r\n/g, '\n').split('\n');
  return a.flatMap((line, i) => line === b[i] ? [] : [{ before: line, after: b[i] ?? '', line: i + 1 }]);
}
export function spacingCandidates(source: string, reportedLine: number | null, message: string): SpacingCandidate[] {
  if (source.length > 60000 || /'''|"""|\\\s*$/m.test(source)) return [];
  const lines = source.replace(/\r\n/g, '\n').split('\n'), results: SpacingCandidate[] = [];
  const add = (label: string, updated: string[]) => {
    const next = updated.join('\n');
    if (next === source || !sameInstructions(source, next) || results.some(item => item.source === next)) return;
    results.push({ label, source: next, edits: spacingEdits(source, next) });
  };
  if (lines.some(line => /^[ \t]*\t/.test(line))) add('Use spaces for indentation', lines.map(line => ' '.repeat(indentWidth(line)) + line.trimStart()));
  const index = reportedLine !== null ? reportedLine - 1 : -1;
  if (index < 0 || index >= lines.length || !lines[index].trim()) return results;
  if (/expected an indented block/i.test(message)) {
    const parentMatch = message.match(/after .+? on line (\d+)/);
    let parent = parentMatch ? Number(parentMatch[1]) - 1 : index - 1;
    while (parent >= 0 && (!lines[parent].trim() || lines[parent].trimStart().startsWith('#'))) parent--;
    if (parent >= 0 && lines[parent].replace(/\s+#.*$/, '').trimEnd().endsWith(':')) {
      const width = indentWidth(lines[parent]) + 4, one = [...lines];
      one[index] = ' '.repeat(width) + lines[index].trimStart(); add('Indent the reported line', one);
      const block = [...lines], delta = width - indentWidth(lines[index]);
      for (let i = index; i < lines.length; i++) {
        if (i > index && /^(?:async\s+)?(?:def|class)\s/.test(lines[i].trimStart()) && indentWidth(lines[i]) <= indentWidth(lines[parent])) break;
        if (lines[i].trim()) block[i] = ' '.repeat(Math.max(0, indentWidth(lines[i]) + delta)) + lines[i].trimStart();
      }
      add('Indent this block', block);
      if (/\bdef\s/.test(lines[parent]) && results.length > 1 && lines.slice(index + 1).filter(line => line.trim() && !line.trimStart().startsWith('#') && indentWidth(line) <= indentWidth(lines[parent])).length > 1) {
        const blockIndex = results.findIndex(item => item.label === 'Indent this block');
        if (blockIndex >= 0) results.unshift(...results.splice(blockIndex, 1));
      }
    }
  } else if (/unexpected indent|unindent does not match|TabError/i.test(message)) {
    let previous = index - 1;
    while (previous >= 0 && (!lines[previous].trim() || lines[previous].trimStart().startsWith('#'))) previous--;
    const widths = new Set([previous < 0 ? 0 : indentWidth(lines[previous]) + (lines[previous].trimEnd().endsWith(':') ? 4 : 0), 0]);
    for (let i = previous; i >= 0 && widths.size < 5; i--) if (lines[i].trim() && indentWidth(lines[i]) < indentWidth(lines[index])) widths.add(indentWidth(lines[i]));
    for (const width of widths) { const next = [...lines]; next[index] = ' '.repeat(width) + lines[index].trimStart(); add(`Use ${width} leading spaces on this line`, next); }
  }
  return results.slice(0, 6);
}
export function visibleSpaces(text: string): string { const prefix = text.match(/^[ \t]*/)?.[0] ?? ''; return prefix.replace(/ /g, '·').replace(/\t/g, '→   ') + text.slice(prefix.length); }

export function missingBody(source: string): { line: number; parent: number } | null {
  const lines = source.split('\n');
  if (/'''|"""/.test(source)) return null;
  for (let i = 0; i < lines.length - 1; i++) {
    if (!/^\s*(?:(?:async\s+)?def\b|class\b|if\b|elif\b|else\b|for\b|while\b|try\b|except\b|finally\b|with\b)/.test(lines[i]) || !lines[i].replace(/\s+#.*$/, '').trimEnd().endsWith(':')) continue;
    let j = i + 1; while (j < lines.length && (!lines[j].trim() || lines[j].trimStart().startsWith('#'))) j++;
    if (j < lines.length && indentWidth(lines[j]) <= indentWidth(lines[i])) return { line: j + 1, parent: i + 1 };
  }
  return null;
}
