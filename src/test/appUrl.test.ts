import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { getAppBaseUrl } from '@/utils/appUrl';

describe('getAppBaseUrl', () => {
  const originalEnv = import.meta.env;

  beforeEach(() => {
    vi.stubGlobal('window', {
      location: { origin: 'https://app.local' },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('uses the configured app URL when provided', () => {
    vi.stubEnv('VITE_APP_URL', 'https://mydomain.com');
    expect(getAppBaseUrl()).toBe('https://mydomain.com');
  });

  it('falls back to window.location.origin when no app URL is set', () => {
    vi.stubEnv('VITE_APP_URL', undefined);
    expect(getAppBaseUrl()).toBe('https://app.local');
  });

  it('normalizes bare domains by adding https', () => {
    vi.stubEnv('VITE_APP_URL', 'mydomain.com');
    expect(getAppBaseUrl()).toBe('https://mydomain.com');
  });
});
