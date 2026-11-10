import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { decodeQuest, QUEST_KEY } from './questState';
import type { QuestProgress } from './questState';

const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

/** Import only explicit, validated DSA Quest v0.2 save files. Never silently replace progress. */
export function ProgressRestore({ onRestore }: { onRestore: (progress: QuestProgress) => void }) {
  const [pending, setPending] = useState<QuestProgress | null>(null);
  const [message, setMessage] = useState('');

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    setPending(null);
    setMessage('');
    if (!file) return;
    if (file.size === 0 || file.size > MAX_BACKUP_BYTES) {
      setMessage('Choose a non-empty DSA Quest JSON file smaller than 5 MB.');
      return;
    }
    try {
      const progress = decodeQuest(await file.text());
      if (!progress) {
        setMessage('That file does not contain a compatible DSA Quest progress backup. Nothing was changed.');
        return;
      }
      setPending(progress);
    } catch {
      setMessage('The backup could not be read. Your current progress is unchanged.');
    }
  }

  function restore() {
    if (!pending) return;
    try {
      // Persist before changing React state, so a storage failure cannot look successful.
      localStorage.setItem(QUEST_KEY, JSON.stringify(pending));
      onRestore(pending);
      setPending(null);
      setMessage('Saved progress restored on this device.');
    } catch {
      setMessage('Browser storage is full or unavailable. Your existing progress was not replaced.');
    }
  }

  return <section className="progress-restore" aria-label="Restore saved learning progress">
    <h3>Restore a saved journey</h3>
    <p>Choose a JSON progress file you downloaded from DSA Quest. This will replace the progress on this device after you confirm. Download your current progress first if you want to keep it.</p>
    <label htmlFor="quest-backup-file">Choose a DSA Quest JSON backup</label>
    <input id="quest-backup-file" type="file" accept=".json,application/json" onChange={event=>{void chooseFile(event);}} />
    {pending&&<div className="progress-restore-preview">
      <p><strong>Ready to restore:</strong> {pending.name.slice(0,30)} · {pending.language==='python'?'Python':'Java'} · {Object.values(pending.code).filter(record=>record.passed).length} saved code passes</p>
      <p>Confirmation will replace the current saved drafts, notes and scores on this device.</p>
      <button type="button" onClick={restore}>Confirm: replace device progress</button>
      <button type="button" onClick={()=>{setPending(null);setMessage('Import cancelled.');}}>Cancel</button>
    </div>}
    {message&&<p role="status">{message}</p>}
  </section>;
}
