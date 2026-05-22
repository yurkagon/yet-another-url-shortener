'use client';

import Link from 'next/link';

import { ThemeToggle } from '@/components/theme-toggle';
import { Logo } from '@/components/wf/logo';
import { useMe } from '@/hooks/use-auth';

export function SiteHeader() {
  const { data: user } = useMe();

  return (
    <header className="flex items-center justify-between border-b border-[color:var(--wf-line)] px-10 py-[18px]">
      <Logo />
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {user ? (
          <Link
            href="/dashboard"
            className="wf-btn-solid inline-flex items-center justify-center px-3.5 py-[7px] text-[12px]"
          >
            Dashboard
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="wf-btn-ghost inline-flex items-center justify-center px-3 py-[6px] text-[12px]"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="wf-btn-solid inline-flex items-center justify-center px-3.5 py-[7px] text-[12px]"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
