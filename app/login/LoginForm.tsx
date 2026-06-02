'use client';

import { useId, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/Logo';

type Mode = 'signin' | 'signup';
type DemoRole = 'client' | 'designer';

const DEMO_CREDENTIALS: Record<DemoRole, { email: string; password: string } | null> = {
  client:
    process.env.NEXT_PUBLIC_DEMO_CLIENT_EMAIL && process.env.NEXT_PUBLIC_DEMO_CLIENT_PASSWORD
      ? {
          email: process.env.NEXT_PUBLIC_DEMO_CLIENT_EMAIL,
          password: process.env.NEXT_PUBLIC_DEMO_CLIENT_PASSWORD,
        }
      : null,
  designer:
    process.env.NEXT_PUBLIC_DEMO_DESIGNER_EMAIL && process.env.NEXT_PUBLIC_DEMO_DESIGNER_PASSWORD
      ? {
          email: process.env.NEXT_PUBLIC_DEMO_DESIGNER_EMAIL,
          password: process.env.NEXT_PUBLIC_DEMO_DESIGNER_PASSWORD,
        }
      : null,
};

export function LoginForm() {
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState<DemoRole | null>(null);

  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();
  const infoId = useId();
  const emailRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    try {
      if (mode === 'signin') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        window.location.href = '/login';
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setInfo('Check your email for a confirmation link, then sign in.');
        setMode('signin');
        setSubmitting(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setError(msg);
      emailRef.current?.focus();
      setSubmitting(false);
    }
  }

  const hasFieldError = Boolean(error && mode === 'signin');

  function switchMode() {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
    setInfo(null);
  }

  async function handleDemoSignIn(demoRole: DemoRole) {
    const creds = DEMO_CREDENTIALS[demoRole];
    if (!creds) return;
    setError(null);
    setInfo(null);
    setDemoLoading(demoRole);
    try {
      const { error: err } = await supabase.auth.signInWithPassword(creds);
      if (err) throw err;
      window.location.href = '/login';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setError(msg);
      setDemoLoading(null);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f6f3] px-4">
      <div className="w-full max-w-sm bg-white border border-[#e3e0da] rounded-2xl shadow-lg p-8">
        <div className="flex justify-center mb-6">
          <Logo variant="default" size="md" />
        </div>

        <h1 className="text-sm font-normal text-[#6b6560] text-center mb-6">
          {mode === 'signin' ? 'Design and review custom rental trailer homes.' : 'Create an account'}
        </h1>

        {info && (
          <p
            id={infoId}
            role="status"
            className="mb-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm px-3 py-2"
          >
            {info}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            role="alert"
            className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2"
          >
            {error}
          </p>
        )}

        {mode === 'signin' && (DEMO_CREDENTIALS.client || DEMO_CREDENTIALS.designer) && (
          <div className="mb-6">
            <p className="text-xs text-[#6b6560] text-center mb-3">Try a demo account</p>
            <div className="flex flex-col gap-2">
              {DEMO_CREDENTIALS.client && (
                <button
                  type="button"
                  onClick={() => handleDemoSignIn('client')}
                  disabled={demoLoading !== null || submitting}
                  className="w-full py-2.5 rounded-xl border border-[#e3e0da] bg-[#f7f6f3] text-[#1c1a17] text-sm font-medium hover:bg-[#ebe9e3] transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#2f6f4f] focus:ring-offset-2"
                >
                  {demoLoading === 'client' ? 'Signing in…' : 'Continue as Client Demo'}
                </button>
              )}
              {DEMO_CREDENTIALS.designer && (
                <button
                  type="button"
                  onClick={() => handleDemoSignIn('designer')}
                  disabled={demoLoading !== null || submitting}
                  className="w-full py-2.5 rounded-xl border border-[#e3e0da] bg-[#f7f6f3] text-[#1c1a17] text-sm font-medium hover:bg-[#ebe9e3] transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#2f6f4f] focus:ring-offset-2"
                >
                  {demoLoading === 'designer' ? 'Signing in…' : 'Continue as Designer Demo'}
                </button>
              )}
            </div>
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-[#e3e0da]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-[#6b6560]">or sign in with your account</span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor={emailId} className="block text-sm font-medium text-[#1c1a17] mb-1">
              Email
            </label>
            <input
              ref={emailRef}
              id={emailId}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={hasFieldError || undefined}
              aria-describedby={hasFieldError ? errorId : undefined}
              className="w-full rounded-xl border border-[#e3e0da] px-3 py-2.5 text-sm text-[#1c1a17] bg-white placeholder:text-[#6b6560] focus:outline-none focus:ring-2 focus:ring-[#2f6f4f] aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-red-300"
              placeholder="you@example.com"
            />
          </div>

          <div className="mb-6">
            <label htmlFor={passwordId} className="block text-sm font-medium text-[#1c1a17] mb-1">
              Password
            </label>
            <input
              id={passwordId}
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={hasFieldError || undefined}
              aria-describedby={hasFieldError ? errorId : undefined}
              className="w-full rounded-xl border border-[#e3e0da] px-3 py-2.5 text-sm text-[#1c1a17] bg-white placeholder:text-[#6b6560] focus:outline-none focus:ring-2 focus:ring-[#2f6f4f] aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-red-300"
              placeholder={mode === 'signin' ? '••••••••' : 'At least 6 characters'}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#2f6f4f] to-[#3d8a64] text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#2f6f4f] focus:ring-offset-2"
          >
            {submitting
              ? mode === 'signin'
                ? 'Signing in…'
                : 'Creating account…'
              : mode === 'signin'
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[#6b6560]">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={switchMode}
            className="font-semibold text-[#2f6f4f] hover:underline focus:outline-none focus:ring-2 focus:ring-[#2f6f4f] rounded"
          >
            {mode === 'signin' ? 'Create account' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
