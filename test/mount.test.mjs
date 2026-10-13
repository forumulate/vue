/* global document, customElements, setTimeout, Response */
// Smoke test: mount the components with createApp in jsdom and check the embed
// mounts — the custom element is defined, upgraded, and has injected the hosted
// script with the right attributes; the feed fetches through the public API.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><head></head><body><div id="app"></div></body></html>', {
  url: 'https://customer.example/blog/hello',
});
for (const k of ['window', 'document', 'navigator', 'HTMLElement', 'customElements', 'CustomEvent', 'Event', 'Node', 'Element', 'SVGElement']) {
  Object.defineProperty(globalThis, k, { value: dom.window[k], configurable: true, writable: true });
}
const fetched = [];
globalThis.fetch = async (url) => {
  fetched.push(String(url));
  return new Response(
    JSON.stringify({
      articles: [{ id: '1', slug: 'hello', title: 'Hello', excerpt: 'Hi', publishedAt: '2026-01-02T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' }],
      page: { hasMore: false, nextCursor: null, limit: 5 },
    }),
    { headers: { 'content-type': 'application/json' } },
  );
};

const { createApp, h, nextTick, ref } = await import('vue');
const { ForumulateComments, ForumulateFeed, ForumulatePlugin } = await import('../dist/index.js');
const tick = () => new Promise((r) => setTimeout(r, 0));

test('ForumulateComments mounts the hosted comments script inside its element', async () => {
  const theme = ref('dark');
  const app = createApp({
    render: () => h(ForumulateComments, { theme: theme.value, articleUrl: 'https://customer.example/blog/hello', nonce: 'n1' }),
  });
  app.use(ForumulatePlugin, { org: 'acme', space: 'blog', apiBase: 'https://forum.example/api/' });
  app.mount('#app');
  await nextTick();
  await tick();
  const el = document.querySelector('forumulate-comments');
  assert.ok(el, 'element rendered');
  assert.ok(customElements.get('forumulate-comments'), 'element defined');
  const script = el.querySelector('script');
  assert.ok(script, 'script injected into the element');
  assert.equal(script.getAttribute('src'), 'https://forum.example/api/embed/comments.js');
  assert.equal(script.getAttribute('data-org'), 'acme');
  assert.equal(script.getAttribute('data-space'), 'blog');
  assert.equal(script.getAttribute('data-theme'), 'dark');
  assert.equal(script.getAttribute('data-article-url'), 'https://customer.example/blog/hello');

  theme.value = 'light';
  await nextTick();
  await tick();
  assert.equal(el.querySelectorAll('script').length, 1);
  assert.equal(el.querySelector('script').getAttribute('data-theme'), 'light');
  app.unmount();
});

test('ForumulateFeed renders the latest posts from the public API', async () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const app = createApp({
    render: () => h(ForumulateFeed, { org: 'acme', space: 'blog', kind: 'posts', limit: 3, href: '/blog/{slug}' }),
  });
  app.mount(host);
  for (let i = 0; i < 6; i++) await tick();
  assert.match(fetched.at(-1), /^https:\/\/forumulate\.com\/api\/public\/orgs\/acme\/spaces\/blog\/blog\?limit=3$/);
  const link = host.querySelector('forumulate-feed a.fm-feed__link');
  assert.ok(link, 'feed rendered a link');
  assert.equal(link.getAttribute('href'), '/blog/hello');
  app.unmount();
});
