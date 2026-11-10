import type { KeyboardEvent, ReactNode } from 'react';
import { ArrowRight, Layers3, Sparkles } from 'lucide-react';
export function Logo() { return <div className="brand"><span className="brand-icon"><Layers3 size={24} strokeWidth={1.8} /></span><span>DSA<span className="brand-light">Quest</span><small>ONE SMALL AHA AT A TIME</small></span></div>; }
export function Button({ children, onClick, secondary = false, disabled = false, className = '', type = 'button' }: { children: ReactNode; onClick?: () => void; secondary?: boolean; disabled?: boolean; className?: string; type?: 'button' | 'submit' }) { return <button type={type} className={`${secondary ? 'button secondary' : 'button'} ${className}`} onClick={onClick} disabled={disabled}>{children}</button>; }
export function Next({ children = 'Keep exploring', onClick, disabled = false }: { children?: ReactNode; onClick: () => void; disabled?: boolean }) { return <Button onClick={onClick} disabled={disabled}>{children}<ArrowRight size={17} /></Button>; }
export function TowerArt({ small = false }: { small?: boolean }) { return <div className={`tower-art ${small ? 'small' : ''}`} aria-hidden="true"><span className="orbit orbit-one" /><span className="orbit orbit-two" /><Sparkles className="art-spark one" size={24} /><Sparkles className="art-spark two" size={16} /><div className="art-floor" /><div className="art-block art-purple">01</div><div className="art-block art-coral">02</div><div className="art-block art-yellow">03</div><div className="art-block art-blue">04</div><div className="art-block art-green">05</div><span className="art-callout">a little curiosity goes a long way ↗</span></div>; }
export function Eyebrow({ children }: { children: ReactNode }) { return <div className="eyebrow">{children}</div>; }
export function Feedback({ children, success = false }: { children: ReactNode; success?: boolean }) { return <div className={`feedback ${success ? 'success' : ''}`} role="status" aria-live="polite">{children}</div>; }
export function trapFocus(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== 'Tab') return;
  const items = event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input, textarea, select, a[href]');
  const first = items[0]; const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
}
