import { inject, type InjectionKey } from 'vue';
import type { EmbedOptions } from '@forumulate/embed';

/** Defaults every component and composable inherits. */
export type ForumulateDefaults = Partial<
  Pick<
    EmbedOptions,
    'org' | 'space' | 'apiBase' | 'theme' | 'locale' | 'accent' | 'radius' | 'width' | 'font' | 'nonce'
  >
>;

export const FORUMULATE_KEY: InjectionKey<ForumulateDefaults> = Symbol('forumulate');

/** The defaults from `app.use(ForumulatePlugin, …)`, or `{}`. */
export function useForumulateDefaults(): ForumulateDefaults {
  return inject(FORUMULATE_KEY, {});
}
