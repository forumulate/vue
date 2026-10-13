/**
 * Content composables over the public read API: `{ data, error, loading,
 * refetch }` refs that re-run when their (ref or getter) inputs change.
 * For SSR data in Nuxt use @forumulate/nuxt, which wraps these in useAsyncData.
 */
import { computed, ref, shallowRef, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue';
import {
  createClient,
  type Article,
  type ArticleSummary,
  type ClientOptions,
  type ForumulateClient,
  type ListOptions,
  type Page,
  type PageSummary,
  type Paged,
  type SearchResult,
  type TopicListOptions,
} from '@forumulate/embed';
import { useForumulateDefaults } from './key.js';

export interface ResourceState<T> {
  data: Ref<T | undefined>;
  error: Ref<unknown>;
  loading: Ref<boolean>;
  refetch: () => void;
}

type ClientOpts = Partial<ClientOptions>;

/** A client for the plugin's org/space, or the ones given. */
export function useForumulateClient(opts: ClientOpts = {}): ForumulateClient {
  const d = useForumulateDefaults();
  return createClient({
    ...opts,
    org: opts.org ?? d.org ?? '',
    space: opts.space ?? d.space ?? '',
    apiBase: opts.apiBase ?? d.apiBase,
    locale: opts.locale ?? d.locale,
  });
}

/**
 * Run `load(client)` whenever `key` changes; `null` skips. Call inside setup().
 */
export function useForumulateQuery<T>(
  key: MaybeRefOrGetter<string | null>,
  load: (client: ForumulateClient, signal: AbortSignal) => Promise<T>,
  opts: ClientOpts = {},
): ResourceState<T> {
  const client = useForumulateClient(opts);
  const data = shallowRef<T>();
  const error = shallowRef<unknown>();
  const loading = ref(false);
  let ac: AbortController | undefined;
  const run = () => {
    ac?.abort();
    if (toValue(key) === null) {
      loading.value = false;
      return;
    }
    const mine = (ac = new AbortController());
    loading.value = true;
    error.value = undefined;
    load(client, mine.signal)
      .then((v) => {
        if (!mine.signal.aborted) data.value = v;
      })
      .catch((e: unknown) => {
        if (!mine.signal.aborted) error.value = e;
      })
      .finally(() => {
        if (!mine.signal.aborted) loading.value = false;
      });
  };
  watch(() => toValue(key), run, { immediate: true });
  return { data, error, loading, refetch: run };
}

const sig = (signal: AbortSignal) => ({ init: { signal } });

export function usePage(
  slugOrId: MaybeRefOrGetter<string | null>,
  opts: { locale?: string; version?: string } & ClientOpts = {},
) {
  const k = computed(() => {
    const s = toValue(slugOrId);
    return s ? `page:${s}:${opts.locale ?? ''}:${opts.version ?? ''}` : null;
  });
  return useForumulateQuery<Page>(
    k,
    (c, signal) => c.getPage(toValue(slugOrId)!, { locale: opts.locale, version: opts.version, ...sig(signal) }),
    opts,
  );
}

export function usePages(opts: ClientOpts = {}) {
  return useForumulateQuery<PageSummary[]>('pages', (c, signal) => c.listPages(sig(signal)), opts);
}

export function usePosts(list: MaybeRefOrGetter<Omit<ListOptions, 'init'>> = {}, opts: ClientOpts = {}) {
  return useForumulateQuery<Paged<ArticleSummary>>(
    () => `posts:${JSON.stringify(toValue(list))}`,
    (c, signal) => c.listPosts({ ...toValue(list), ...sig(signal) }),
    opts,
  );
}

export function usePost(slug: MaybeRefOrGetter<string | null>, opts: ClientOpts = {}) {
  return useForumulateQuery<Article>(
    () => (toValue(slug) ? `post:${toValue(slug)}` : null),
    (c, signal) => c.getPost(toValue(slug)!, sig(signal)),
    opts,
  );
}

export function useTopics(list: MaybeRefOrGetter<Omit<TopicListOptions, 'init'>> = {}, opts: ClientOpts = {}) {
  return useForumulateQuery<Paged<ArticleSummary>>(
    () => `topics:${JSON.stringify(toValue(list))}`,
    (c, signal) => c.listTopics({ ...toValue(list), ...sig(signal) }),
    opts,
  );
}

export function useTopic(slug: MaybeRefOrGetter<string | null>, opts: ClientOpts = {}) {
  return useForumulateQuery<Article>(
    () => (toValue(slug) ? `topic:${toValue(slug)}` : null),
    (c, signal) => c.getTopic(toValue(slug)!, sig(signal)),
    opts,
  );
}

export function useReleases(list: MaybeRefOrGetter<Omit<ListOptions, 'init'>> = {}, opts: ClientOpts = {}) {
  return useForumulateQuery<Paged<Article>>(
    () => `releases:${JSON.stringify(toValue(list))}`,
    (c, signal) => c.listReleases({ ...toValue(list), ...sig(signal) }),
    opts,
  );
}

/** Search as you type; an empty query does not hit the API. */
export function useSearch(q: MaybeRefOrGetter<string>, opts: { limit?: number } & ClientOpts = {}) {
  const term = () => toValue(q).trim();
  return useForumulateQuery<SearchResult>(
    () => (term() ? `search:${term()}:${opts.limit ?? ''}` : null),
    (c, signal) => c.search(term(), { limit: opts.limit, ...sig(signal) }),
    opts,
  );
}
