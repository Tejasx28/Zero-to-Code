export type PageRoute =
  | { view: 'path' | 'notes' | 'not-found' }
  | { view: 'mission'; id: string; step: 'idea' | 'game' }
  | { view: 'concepts' | 'code'; id: string }
  | { view: 'practice' | 'arcade'; id?: string }
  | { view: 'debug'; id?: string; phase?: 'repair' | 'rebuild' };

export function pagePath(route: PageRoute): string {
  const id = 'id' in route && route.id ? `/${encodeURIComponent(route.id)}` : '';
  if (route.view === 'path') return '/learn';
  if (route.view === 'mission') return `/learn${id}/${route.step}`;
  if (route.view === 'code') return `/studio${id}`;
  if (route.view === 'debug') return `/debug${id}${id && route.phase === 'rebuild' ? '/rebuild' : ''}`;
  if (route.view === 'not-found') return '/not-found';
  return `/${route.view}${id}`;
}

export function readPage(pathname: string): PageRoute | null {
  let parts: string[];
  try { parts = pathname.split('/').filter(Boolean).map(decodeURIComponent); } catch { return { view: 'not-found' }; }
  const [area, id, step] = parts;
  if (!area || area === 'index.html') return null;
  if (area === 'learn' && parts.length === 1) return { view: 'path' };
  if (area === 'learn' && id && parts.length <= 3 && (!step || step === 'idea' || step === 'game')) return { view: 'mission', id, step: step === 'game' ? 'game' : 'idea' };
  if (area === 'concepts' && parts.length <= 2) return { view: 'concepts', id: id ?? 'functions' };
  if (area === 'studio' && parts.length <= 2) return { view: 'code', id: id ?? 'add' };
  if (area === 'arcade' && parts.length <= 2) return { view: 'arcade', id };
  if (area === 'practice' && parts.length <= 2) return { view: 'practice', id };
  if (area === 'debug' && parts.length <= 3 && (!step || id && step === 'rebuild')) return { view: 'debug', id, phase: step === 'rebuild' ? 'rebuild' : 'repair' };
  if (area === 'notes' && parts.length === 1) return { view: 'notes' };
  return { view: 'not-found' };
}

export function interceptLink(event: { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean; preventDefault(): void }, go: () => void) {
  if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault(); go();
}
