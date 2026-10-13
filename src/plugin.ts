import type { App } from 'vue';
import { COMPONENTS } from './components.js';
import { FORUMULATE_KEY, type ForumulateDefaults } from './key.js';

export { FORUMULATE_KEY, useForumulateDefaults, type ForumulateDefaults } from './key.js';

/**
 * `app.use(ForumulatePlugin, { org: 'acme', space: 'blog', theme: 'auto' })` —
 * set the defaults once for every component and composable. Pass
 * `components: true` to also register the components globally by name.
 */
export const ForumulatePlugin = {
  install(app: App, options: ForumulateDefaults & { components?: boolean } = {}) {
    const { components, ...defaults } = options;
    app.provide(FORUMULATE_KEY, defaults);
    if (components) {
      for (const [name, comp] of Object.entries(COMPONENTS)) app.component(name, comp);
    }
  },
};
