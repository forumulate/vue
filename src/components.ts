/**
 * The embeds as Vue components. Each renders the matching `<forumulate-*>`
 * custom element from @forumulate/embed, which owns mounting, re-rendering on
 * attribute change and teardown — this file maps props to attributes and the
 * element's `forumulate:load` / `forumulate:error` events to `load` / `error`.
 *
 * SSR renders the bare element; it comes alive when the client registers the
 * elements in `onMounted`. No SFC compiler needed: plain render functions.
 */
import { defineComponent, h, onBeforeUnmount, onMounted, ref, type ComponentObjectPropsOptions, type PropType } from 'vue';
import { defineForumulateElements, ELEMENT_TAGS, type FeedKind, type Theme } from '@forumulate/embed';
import { useForumulateDefaults } from './key.js';

const ATTRS: Record<string, string> = {
  org: 'org',
  space: 'space',
  apiBase: 'api',
  theme: 'theme',
  locale: 'locale',
  accent: 'accent',
  radius: 'radius',
  width: 'width',
  font: 'font',
  nonce: 'nonce',
  topic: 'topic',
  articleUrl: 'article-url',
  mode: 'mode',
  placeholder: 'placeholder',
  kind: 'kind',
  limit: 'limit',
  tag: 'tag',
  category: 'category',
  href: 'href',
  excerpts: 'excerpts',
};

const baseProps = {
  org: String,
  space: String,
  apiBase: String,
  theme: String as PropType<Theme>,
  locale: String,
  accent: String,
  radius: String,
  width: String,
  font: String,
  nonce: String,
};

function embed<P extends ComponentObjectPropsOptions>(name: string, tag: string, extra: P) {
  return defineComponent({
    name,
    props: { ...baseProps, ...extra },
    emits: ['load', 'error'],
    setup(props, { emit }) {
      const defaults = useForumulateDefaults();
      const el = ref<HTMLElement>();
      const onLoad = (e: Event) => emit('load', (e as CustomEvent).detail);
      const onError = (e: Event) => emit('error', (e as CustomEvent).detail);
      onMounted(() => {
        defineForumulateElements();
        el.value?.addEventListener('forumulate:load', onLoad);
        el.value?.addEventListener('forumulate:error', onError);
      });
      onBeforeUnmount(() => {
        el.value?.removeEventListener('forumulate:load', onLoad);
        el.value?.removeEventListener('forumulate:error', onError);
      });
      return () => {
        const merged: Record<string, unknown> = { ...defaults };
        for (const [k, v] of Object.entries(props)) if (v !== undefined) merged[k] = v;
        const attrs: Record<string, string> = {};
        for (const [prop, attr] of Object.entries(ATTRS)) {
          const v = merged[prop];
          // `^` forces an attribute: `nonce`, `width`, ... are also DOM
          // properties Vue would otherwise set, which the element never reads.
          if (v !== undefined && v !== null && v !== '') attrs[`^${attr}`] = String(v);
        }
        return h(tag, { ref: el, ...attrs });
      };
    },
  });
}

/** An embedded comment thread for the current page (one topic per article URL). */
export const ForumulateComments = embed('ForumulateComments', ELEMENT_TAGS.comments, {
  topic: String,
  articleUrl: String,
});

/** Search box over a docs space; `mode="ask"` answers with the space's AI. */
export const ForumulateWidget = embed('ForumulateWidget', ELEMENT_TAGS.widget, {
  mode: String as PropType<'search' | 'ask'>,
  placeholder: String,
});

/** The search box alone. */
export const ForumulateSearch = embed('ForumulateSearch', ELEMENT_TAGS.search, {
  placeholder: String,
});

/** "What's new" bell with unread badge and a popover of releases. */
export const ForumulateChangelog = embed('ForumulateChangelog', ELEMENT_TAGS.changelog, {});

/** A list of the latest posts, topics, pages or releases, as links. */
export const ForumulateFeed = embed('ForumulateFeed', ELEMENT_TAGS.feed, {
  kind: String as PropType<FeedKind>,
  limit: Number,
  tag: String,
  category: String,
  /** Link template, e.g. `/blog/{slug}`. Default: the Forumulate reader page. */
  href: String,
  excerpts: { type: Boolean, default: undefined },
});

export const COMPONENTS = {
  ForumulateComments,
  ForumulateWidget,
  ForumulateSearch,
  ForumulateChangelog,
  ForumulateFeed,
};
