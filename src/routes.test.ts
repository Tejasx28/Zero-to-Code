import { describe, expect, it } from 'vitest';
import { interceptLink, pagePath, readPage } from './routes';
import type { PageRoute } from './routes';

describe('page navigation', () => {
  it('round trips learning pages and debugging stages through real URLs', () => {
    const routes: PageRoute[] = [{ view: 'path' }, { view: 'mission', id: 'memory', step: 'game' }, { view: 'concepts', id: 'loops' }, { view: 'code', id: 'sum-array' }, { view: 'practice', id: 'practice-last-match' }, { view: 'debug', id: 'early-return', phase: 'rebuild' }, { view: 'notes' }];
    for (const route of routes) expect(readPage(pagePath(route))).toEqual(route);
  });
  it('handles defaults, unknown pages, malformed paths, and extra segments', () => {
    expect(readPage('/')).toBeNull(); expect(readPage('/studio/')).toEqual({ view: 'code', id: 'add' });
    expect(readPage('/debug/early-return')).toEqual({ view: 'debug', id: 'early-return', phase: 'repair' });
    for (const url of ['/unknown', '/notes/extra', '/studio/add/extra', '/learn/contract/unknown', '/debug/a/unknown', '/%ZZ']) expect(readPage(url)).toEqual({ view: 'not-found' });
  });
  it('preserves normal new-tab and modified-click behavior', () => {
    let navigations = 0, prevented = 0;
    const event = { button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, preventDefault: () => prevented++ };
    interceptLink({ ...event, ctrlKey: true }, () => navigations++);
    interceptLink({ ...event, button: 1 }, () => navigations++);
    expect(navigations).toBe(0); expect(prevented).toBe(0);
    interceptLink(event, () => navigations++); expect(navigations).toBe(1); expect(prevented).toBe(1);
  });
});
