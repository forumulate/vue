# @forumulate/vue

Forumulate for Vue 3: comments, search, a changelog bell and a content feed as
components, plus typed composables over the public read API. Built on
[`@forumulate/embed`](https://www.npmjs.com/package/@forumulate/embed): each
component renders a `<forumulate-*>` custom element, which loads the official
hosted embed.

## Install

```sh
npm install @forumulate/vue
```

## Components

```ts
// main.ts
import { createApp } from 'vue';
import { ForumulatePlugin } from '@forumulate/vue';
import App from './App.vue';

createApp(App).use(ForumulatePlugin, { org: 'acme', space: 'blog', theme: 'auto' }).mount('#app');
```

```vue
<script setup lang="ts">
import { ForumulateComments } from '@forumulate/vue';
</script>

<template>
  <article>…</article>
  <ForumulateComments @load="() => console.log('comments ready')" />
</template>
```

Components: `ForumulateComments` (`topic`, `articleUrl`), `ForumulateWidget`
(`mode="search" | "ask"`, `placeholder`), `ForumulateSearch`,
`ForumulateChangelog`, `ForumulateFeed` (`kind="posts" | "topics" | "pages" | "releases"`,
`limit`, `tag`, `href="/blog/{slug}"`). All take `org`, `space`, `apiBase`,
`theme` (`light | dark | auto`), `locale`, `accent`, `radius`, `width`, `font`,
`nonce`, and emit `load` / `error`. Pass `components: true` to the plugin to
register them globally.

## Content

```vue
<script setup lang="ts">
import { usePosts } from '@forumulate/vue';
const { data, loading, error } = usePosts({ limit: 5 });
</script>

<template>
  <p v-if="loading">Loading…</p>
  <ul v-else-if="data">
    <li v-for="post in data.items" :key="post.id">{{ post.title }}</li>
  </ul>
</template>
```

Composables: `useForumulateClient`, `usePage`, `usePages`, `usePosts`,
`usePost`, `useTopics`, `useTopic`, `useReleases`, `useSearch` — each returns
`{ data, error, loading, refetch }` refs and accepts refs or getters as inputs.
For SSR data in Nuxt, use [`@forumulate/nuxt`](https://www.npmjs.com/package/@forumulate/nuxt).

## License

MIT

---

## About this repository

This repository is a public mirror, refreshed on each Forumulate release
(one commit per release). Pull requests are welcome; accepted changes are
applied upstream and arrive here with the next release.

- API reference: https://forumulate.com/reference
- Guides: https://forumulate.com/guides
- Community and support: https://forumulate.com/community
- Source: https://github.com/forumulate/vue
