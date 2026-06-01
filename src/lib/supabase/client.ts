import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // navigator.locks acquired during signInWithPassword on one page can
        // block the auth client on the next page after a hard redirect. Bypass
        // the lock manager so REST calls are never stuck waiting for a lock.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lock: (_name: string, _timeout: number, fn: () => Promise<any>) => fn() as Promise<any>,
      },
    },
  );
}
