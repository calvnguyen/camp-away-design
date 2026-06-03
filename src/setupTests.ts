import '@testing-library/jest-dom';
import React from 'react';
import { afterEach, vi } from 'vitest';

// Mock next/navigation globally so components using usePathname/useRouter/useParams
// don't crash in the jsdom test environment.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn() }),
  usePathname: () => '/',
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/link so <Link href="..."> renders as a plain <a> in tests.
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => {
    return React.createElement('a', { href, ...props }, children);
  },
}));
import { cleanup } from '@testing-library/react';

// @react-three/fiber uses ResizeObserver internally; jsdom doesn't ship one.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Unmount React trees between tests so rendered DOM doesn't leak across cases.
afterEach(() => cleanup());

// Node 24 exposes a native `localStorage` global that is `undefined` unless the
// process is started with `--localstorage-file`, and it shadows jsdom's
// `window.localStorage` in the vitest jsdom environment. Install a small
// in-memory Storage so app code (and tests) that touch localStorage work.
if (typeof globalThis.localStorage === 'undefined' || globalThis.localStorage === null) {
  class MemoryStorage implements Storage {
    private store = new Map<string, string>();
    get length() {
      return this.store.size;
    }
    clear() {
      this.store.clear();
    }
    getItem(key: string) {
      return this.store.has(key) ? this.store.get(key)! : null;
    }
    key(index: number) {
      return Array.from(this.store.keys())[index] ?? null;
    }
    removeItem(key: string) {
      this.store.delete(key);
    }
    setItem(key: string, value: string) {
      this.store.set(key, String(value));
    }
  }
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemoryStorage(),
    configurable: true,
    writable: true,
  });
}
