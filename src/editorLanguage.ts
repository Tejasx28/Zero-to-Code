import { EditorState } from '@codemirror/state';
import { indentUnit } from '@codemirror/language';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import type { Language } from './curriculum';
export function editorLanguage(language: Language) { return [language === 'python' ? python() : java(), indentUnit.of(language === 'python' ? '    ' : '  '), EditorState.tabSize.of(4)]; }
