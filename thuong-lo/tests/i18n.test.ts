import { beforeEach, describe, expect, it } from 'vitest';

import en from '../src/locales/en.json';
import vi from '../src/locales/vi.json';
import {
  DICTIONARIES,
  getLocale,
  setLocale,
  t,
  translate,
  type Dictionaries,
} from '../src/systems/i18n';

/**
 * Phase 0 has no save system yet, so these tests exist for two reasons: they
 * prove the Vitest pipeline runs against pure logic before Phase 6 leans on it,
 * and the key-parity check stops the two locale files drifting apart silently.
 */

const SYNTHETIC: Dictionaries = {
  vi: { present: 'có', greeting: 'Chào {name}' },
  en: { present: 'present', only_english: 'english only', greeting: 'Hello {name}' },
};

describe('translate', () => {
  it('returns the string from the requested locale', () => {
    expect(translate(SYNTHETIC, 'vi', 'present')).toBe('có');
    expect(translate(SYNTHETIC, 'en', 'present')).toBe('present');
  });

  it('falls back to English when the key is missing from the active locale', () => {
    expect(translate(SYNTHETIC, 'vi', 'only_english')).toBe('english only');
  });

  it('returns the key itself when it is missing from every locale', () => {
    expect(translate(SYNTHETIC, 'vi', 'no.such.key')).toBe('no.such.key');
  });

  it('substitutes named parameters', () => {
    expect(translate(SYNTHETIC, 'vi', 'greeting', { name: 'Lữ khách' })).toBe('Chào Lữ khách');
  });

  it('accepts numbers as parameter values', () => {
    expect(translate(DICTIONARIES, 'vi', 'debug.fps', { value: 60 })).toBe('FPS 60');
  });

  it('leaves an unsupplied placeholder visible instead of blanking it', () => {
    expect(translate(SYNTHETIC, 'vi', 'greeting', { other: 'x' })).toBe('Chào {name}');
  });
});

describe('active locale', () => {
  beforeEach(() => setLocale('vi'));

  it('starts on Vietnamese', () => {
    expect(getLocale()).toBe('vi');
    expect(t('title.tap_to_start')).toBe('Chạm để bắt đầu');
  });

  it('switches to English on request', () => {
    setLocale('en');
    expect(getLocale()).toBe('en');
    expect(t('title.tap_to_start')).toBe('Tap to start');
  });
});

describe('locale files', () => {
  it('define exactly the same keys, so nothing falls back by accident', () => {
    expect(Object.keys(vi).sort()).toEqual(Object.keys(en).sort());
  });

  it('leave no string empty', () => {
    for (const [key, value] of [...Object.entries(vi), ...Object.entries(en)]) {
      expect(value.trim(), `empty translation for ${key}`).not.toBe('');
    }
  });

  it('use matching placeholders in both languages', () => {
    const placeholders = (text: string): string[] => (text.match(/\{(\w+)\}/g) ?? []).sort();

    for (const [key, viText] of Object.entries(vi)) {
      const enText = (en as Record<string, string>)[key];
      expect(enText, `missing English string for ${key}`).toBeDefined();
      expect(placeholders(viText), `placeholder mismatch for ${key}`).toEqual(
        placeholders(enText ?? ''),
      );
    }
  });
});
