/** Scene identifiers, kept in one place so a typo becomes a compile error. */
export const SceneKey = {
  Boot: 'boot',
  Preload: 'preload',
  Title: 'title',
} as const;

export type SceneKey = (typeof SceneKey)[keyof typeof SceneKey];
