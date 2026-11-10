import { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Check, ChevronRight, Compass, Flag, Layers3, Menu, Puzzle, ShieldCheck, Sparkles, Sprout, Target, Trophy, X } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { finishTest, freshProgress, nextTransferForm, reviewReady, xpFor } from './engine';
import type { Progress, Screen, Stage, TestKind } from './engine';
import { questionsFor } from './content';
import { readProgress, STORAGE_KEY } from './storage';
import { Button, Eyebrow, Logo, Next, TowerArt, trapFocus } from './ui';
import { Lesson, Practice } from './Lesson';
import { Assessment, Results } from './Assessment';
import { Journal } from './Journal';

export type Update = Dispatch<SetStateAction<Progress>>;
export type StartTest = (kind: TestKind) => void;
export const STEPS: { id: Stage; title: string; subtitle: string }[] = [
  { id: 'discover', title: 'Rescue the red block', subtitle: 'Discover through play' },
  { id: 'lab', title: 'Meet your new superpower', subtitle: 'Watch the idea come alive' },
  { id: 'practice', title: 'Try a different angle', subtitle: 'Predict, undo, debug' },
  { id: 'code', title: 'From blocks to code', subtitle: 'Connect the dots in JavaScript' },
  { id: 'post', title: 'A little check-in', subtitle: 'See what has clicked' },
  { id: 'transfer', title: 'The independent quest', subtitle: 'New situations. Your own thinking.' },
];
export default function App() {
  const [loaded] = useState(readProgress);
  const [progress, setProgress] = useState(loaded.progress);
  const [warning, setWarning] = useState(loaded.warning);
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [step, setStep] = useState<Stage>('discover');
  const [menu, setMenu] = useState(false);
  const [resultIndex, setResultIndex] = useState<number | null>(null);
  const [, tick] = useState(0);
  const mainRef = useRef<HTMLElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }
    catch { setWarning('Your browser could not save progress. Keep this tab open and export a copy from Field notes.'); }
  }, [progress]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      tick(v => v + 1);
      if (document.visibilityState === 'visible') setProgress(p => p.onboarded ? { ...p, activitySeconds: p.activitySeconds + 30 } : p);
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => { mainRef.current?.focus(); window.scrollTo({ top: 0, behavior: 'instant' }); }, [screen, step, resultIndex]);
  useEffect(() => { if (menu) sidebarRef.current?.querySelector<HTMLButtonElement>('.nav-item')?.focus(); }, [menu]);
  function closeMenu() { setMenu(false); menuTrigger.current?.focus(); }
  function navigate(next: Screen) { setScreen(next); setResultIndex(null); setMenu(false); }
  function goStep(next: Stage) { setStep(next); navigate(next === 'practice' ? 'practice' : 'lesson'); }
  function continueQuest() { const next = STEPS.find(s => !progress.completed.includes(s.id)); if (next) goStep(next.id); else navigate('journal'); }
  const startTest: StartTest = kind => {
    if (progress.activeTest) return;
    if (kind === 'pre' && (progress.baselineSkipped || progress.results.some(r => r.kind === 'pre'))) return;
    if (kind === 'post' && !progress.completed.includes('code')) return;
    if (kind === 'transfer' && (!progress.completed.includes('code') || !progress.completed.includes('post'))) return;
    if (kind === 'delayed' && !reviewReady(progress)) return;
    const form = kind === 'transfer' ? nextTransferForm(progress) : 0;
    if (form === null) return;
    setResultIndex(null);
    setProgress(p => ({ ...p, activeTest: { kind, form, answers: Array(questionsFor(kind, form).length).fill(-1), confidence: 3, startedAt: Date.now() } }));
  };
  function submitTest() {
    if (!progress.activeTest) return;
    const next = finishTest(progress, questionsFor(progress.activeTest.kind, progress.activeTest.form));
    if (next === progress) return;
    setProgress(next); setResultIndex(next.results.length - 1); setScreen('journal');
  }
  function onboard(name: string, diagnostic: boolean) {
    setProgress(p => ({ ...p, name: name.trim().slice(0, 30) || 'Explorer', onboarded: true, baselineSkipped: !diagnostic,
      activeTest: diagnostic ? { kind: 'pre', form: 0, answers: Array(5).fill(-1), startedAt: Date.now(), confidence: 3 } : null }));
  }
  if (!progress.onboarded) return <><Welcome onBegin={onboard} />{warning && <div className="storage-toast" role="alert">{warning}</div>}</>;
  if (progress.activeTest) return <Assessment session={progress.activeTest} update={setProgress} onSubmit={submitTest} onSkip={progress.activeTest.kind === 'pre' ? () => setProgress(p => ({ ...p, activeTest: null, baselineSkipped: true })) : undefined} />;
  const xp = xpFor(progress);
  return <div className="app-shell">
    <a className="skip-link" href="#main">Skip to content</a>
    <aside className={`sidebar ${menu ? 'open' : ''}`} ref={sidebarRef} role={menu ? 'dialog' : undefined} aria-modal={menu ? true : undefined} aria-label="Learning navigation" onKeyDown={e => { if (menu) { trapFocus(e); if (e.key === 'Escape') closeMenu(); } }}>
      <Logo /><button className="icon-button close-menu" onClick={closeMenu} aria-label="Close menu"><X size={20} /></button>
      <div className="sidebar-label">YOUR LITTLE ADVENTURE</div>
      <nav aria-label="Main navigation">
        {([{ id: 'dashboard', label: 'My journey', icon: Compass }, { id: 'lesson', label: 'Stack Tower', icon: Layers3 }, { id: 'practice', label: 'Practice yard', icon: Puzzle }, { id: 'journal', label: 'Field notes', icon: BookOpen }] as const).map(item => <button key={item.id} className={`nav-item ${screen === item.id ? 'active' : ''}`} onClick={() => item.id === 'lesson' ? goStep(STEPS.find(s => !progress.completed.includes(s.id))?.id ?? 'discover') : navigate(item.id)} aria-current={screen === item.id ? 'page' : undefined}><item.icon size={20} />{item.label}{screen === item.id && <span className="nav-dot" />}</button>)}
      </nav>
      <div className="sidebar-note"><Sprout size={27} /><strong>Curiosity is a skill.</strong><p>Try things. Get them wrong.<br />That’s where learning starts.</p></div>
      <div className="sidebar-footer"><span className="avatar">{progress.name.charAt(0).toUpperCase()}</span><div><strong>{progress.name}</strong><small>{xp >= 200 ? 'Level 2 · Curious builder' : 'Level 1 · Curious beginner'}</small></div><span className="version">v0.1</span></div>
    </aside>
    {menu && <button className="menu-scrim" onClick={closeMenu} aria-label="Close navigation" tabIndex={-1} />}
    <div className="workspace">
      <header className="topbar"><div className="breadcrumb"><button ref={menuTrigger} className="icon-button mobile-menu" aria-expanded={menu} onClick={() => setMenu(true)} aria-label="Open navigation"><Menu size={22} /></button><span>My learning space</span><ChevronRight size={14} /><strong>{screen === 'dashboard' ? 'My journey' : screen === 'journal' ? 'Field notes' : screen === 'practice' ? 'Practice yard' : 'Stack Tower'}</strong></div><div className="topbar-right"><span className={`save-status ${warning ? 'has-warning' : ''}`}><i />{warning ? 'Save needs attention' : 'Saved on this device'}</span><span className="xp-pill"><Sparkles size={15} />{xp} XP</span></div></header>
      <main id="main" className="main-content" tabIndex={-1} ref={mainRef}>
        {warning && <div role="alert" className="storage-warning">{warning}</div>}
        {resultIndex !== null && progress.results[resultIndex] ? <Results result={progress.results[resultIndex]} progress={progress} onContinue={() => { setResultIndex(null); if (!progress.completed.includes('discover')) goStep('discover'); else continueQuest(); }} onJournal={() => { setResultIndex(null); navigate('journal'); }} />
          : screen === 'dashboard' ? <Dashboard progress={progress} onContinue={continueQuest} goStep={goStep} onJournal={() => navigate('journal')} startTest={startTest} />
          : screen === 'journal' ? <Journal progress={progress} update={setProgress} startTest={startTest} onResult={setResultIndex} onReset={() => { setProgress(freshProgress()); setScreen('dashboard'); setResultIndex(null); setWarning(''); }} />
          : screen === 'practice' ? <Practice progress={progress} update={setProgress} onNext={() => goStep('code')} onUnlock={() => goStep(progress.completed.includes('discover') ? 'lab' : 'discover')} />
          : <Lesson progress={progress} update={setProgress} step={step} goStep={goStep} startTest={startTest} onResult={setResultIndex} />}
      </main>
      <footer className="page-footer"><span>Made for small steps and big discoveries.</span><span>DSA Quest <span className="footer-dot">·</span> A learning experiment</span></footer>
    </div>
  </div>;
}
function Welcome({ onBegin }: { onBegin: (name: string, diagnostic: boolean) => void }) {
  const [name, setName] = useState('');
  return <div className="welcome"><header className="welcome-header"><Logo /><span className="pill">THE BEGINNER EDITION <Sprout size={14} /></span></header>
    <main className="welcome-grid"><div className="welcome-copy"><Eyebrow><span className="tiny-line" /> YOUR ADVENTURE STARTS WITH CURIOSITY</Eyebrow><h1>Big ideas.<br />Small <em>discoveries.</em></h1><p className="welcome-intro">You don’t need to know algorithms.<br />You just need a little “what happens if…?”</p><div className="welcome-points"><p><Check size={16} />Play a puzzle before learning the big words.</p><p><Check size={16} />Make mistakes that help things click.</p><p><Check size={16} />Find out what you can solve on your own.</p></div>
      <form onSubmit={e => { e.preventDefault(); onBegin(name, true); }}><label htmlFor="name">What should we call you? <span>(optional)</span></label><input id="name" value={name} maxLength={30} onChange={e => setName(e.target.value)} placeholder="Your explorer name" autoComplete="given-name" /><Button type="submit">Let’s find my starting point <ArrowRight size={18} /></Button></form><button className="text-button welcome-skip" onClick={() => onBegin(name, false)}>Skip the 5-question baseline and start exploring <ArrowRight size={14} /></button><p className="fine-print">No account. No timer. Your progress stays on this device.</p>
    </div><div className="welcome-visual"><span className="floating-label"><span /> FIRST STOP: STACK TOWER</span><TowerArt /><div className="welcome-quote"><span className="quote-mark">“</span><p>What if learning DSA felt<br />more like figuring things out?</p><span>That’s the quest.</span></div><span className="visual-corner">PLAY → NOTICE → UNDERSTAND</span></div></main><footer className="welcome-footer"><span>A safe place to say “I don’t get it yet.”</span><span>DSA QUEST v0.1 <span className="footer-dot">·</span> ONE COMPLETE LEARNING ADVENTURE</span></footer></div>;
}
function Dashboard({ progress: p, onContinue, goStep, onJournal, startTest }: { progress: Progress; onContinue: () => void; goStep: (s: Stage) => void; onJournal: () => void; startTest: StartTest }) {
  const done = p.completed.length;
  const nextIndex = STEPS.findIndex(s => !p.completed.includes(s.id));
  const mastery = p.completed.includes('transfer');
  return <><div className="page-heading"><div><Eyebrow><Sprout size={14} /> A GOOD DAY TO DISCOVER SOMETHING</Eyebrow><h1>Hello, {p.name}<span className="greeting-dot">.</span></h1><p>Small steps count. Let’s find your next “aha!”</p></div><div className="chapter-tag"><Flag size={16} /> CHAPTER 01 / THE FOUNDATIONS</div></div>
    <section className="quest-hero"><div className="hero-copy"><span className="pill"><span className="live-dot" />{mastery ? 'QUEST COMPLETE' : done ? 'YOUR QUEST IN PROGRESS' : 'YOUR FIRST QUEST'}</span><h2>{mastery ? <>Look at you,<br /><em>pattern explorer.</em></> : <>A tower of blocks.<br /><em>A whole new way to think.</em></>}</h2><p>{mastery ? 'You solved new problems on your own. Come back in two days and see what stayed with you.' : 'Rescue a little red block. Discover a powerful idea. No definitions to memorize before you play.'}</p><Next onClick={onContinue}>{done === 0 ? 'Start Stack Tower' : mastery ? 'See my learning notes' : 'Continue my quest'}</Next><div className="hero-meta"><span><Layers3 size={14} /> One idea, six small steps</span><span><ShieldCheck size={14} /> Mistakes welcome</span></div></div><TowerArt /></section>
    <div className="stat-grid"><div className="stat-card"><span className="stat-icon green"><Compass size={20} /></span><div><span>Your adventure</span><strong>{done}<small> / 6 steps</small></strong></div><div className="mini-progress"><i style={{ height: `${Math.max(12, done / 6 * 100)}%` }} /></div></div><div className="stat-card"><span className="stat-icon orange"><Sparkles size={20} /></span><div><span>Curiosity rewarded</span><strong>{xpFor(p)}<small> XP earned</small></strong></div></div><div className="stat-card"><span className="stat-icon purple"><Target size={20} /></span><div><span>Independent mastery</span><strong className="stat-word">{mastery ? 'Demonstrated' : 'Still to discover'}</strong><small>{mastery ? 'New-context check passed' : 'A badge you earn through understanding'}</small></div></div></div>
    <div className="dashboard-lower"><section className="journey-panel"><div className="section-title"><div><Eyebrow>YOUR LEARNING TRAIL</Eyebrow><h2>One idea. A few little adventures.</h2></div><span className="muted">{Math.round(done / 6 * 100)}% explored</span></div><div className="trail">{STEPS.map((s, i) => { const checked = p.completed.includes(s.id); const unlocked = i === 0 || p.completed.includes(STEPS[i - 1].id); return <button key={s.id} className={`trail-item ${checked ? 'done' : ''} ${i === nextIndex ? 'current' : ''}`} disabled={!unlocked} onClick={() => goStep(s.id)}><span className="trail-node">{checked ? <Check size={17} /> : unlocked ? String(i + 1).padStart(2, '0') : <Flag size={14} />}</span><div><strong>{s.title}</strong><small>{s.subtitle}</small></div><span className="trail-end">{checked ? 'Revisit' : i === nextIndex ? 'Up next' : ''}{unlocked && <ChevronRight size={16} />}</span></button>; })}</div></section>
      <aside className="dashboard-aside"><div className="daily-note"><span className="note-spark"><Sparkles size={21} /></span><Eyebrow>A NOTE FOR YOUR JOURNEY</Eyebrow><h3>“I don’t know yet”<br />is a great place to start.</h3><p>Points tell you where you’ve been. Solving something new tells you what you’ve learned.</p><button className="text-button" onClick={onJournal}>Open my field notes <ArrowRight size={15} /></button></div><div className="review-card"><div className="review-icon"><BookOpen size={20} /></div><div><strong>{reviewReady(p) ? 'Your return quest is ready' : 'Make it stick'}</strong><p>{p.reviewDueAt ? `Return on ${new Date(p.reviewDueAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} for a fresh memory check.` : 'A fresh check two days after your lesson helps reveal what sticks.'}</p><button className="text-button" onClick={() => reviewReady(p) ? startTest('delayed') : onJournal()}>{reviewReady(p) ? 'Take the memory check' : 'See my experiment'} <ArrowRight size={14} /></button></div></div><div className="coming-next"><span className="small-lock"><Puzzle size={16} /></span><div><strong>Beyond the tower</strong><p>Arrays, queues & more.<br />After this lesson earns its place.</p></div><span className="pill subtle">LATER</span></div></aside></div>
    <div className="gentle-banner"><Trophy size={20} /><p><strong>{mastery ? 'You earned Pattern Explorer.' : 'Your first badge is waiting.'}</strong> {mastery ? 'Next, find out what stays with you in the delayed memory check.' : 'Earn “Pattern Explorer” by completing a fresh independent quest.'}</p><span>Understanding &gt; points</span></div>
  </>;
}
