'use client';

import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

import { ThemeToggle } from '@/components/theme-toggle';
import { useLogout, useMe } from '@/hooks/use-auth';

export function Header() {
  const { data: user } = useMe();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onError: () => toast.error('Logout failed'),
    });
  };

  const initials = (user?.name ?? '?')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="flex items-center justify-between border-b border-[color:var(--wf-line)] bg-background px-7 py-3">
      <div className="flex items-center gap-3">
        <input
          placeholder="Search links…"
          className="wf-input h-9 w-[260px] text-[12px]"
          style={{ minHeight: 32 }}
        />
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <span className="wf-icon wf-icon-circle h-7 w-7 text-[11px]" aria-hidden>
          ?
        </span>
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] border-foreground bg-background text-[11px] font-[family-name:var(--font-hand)]">
          {initials || 'U'}
        </span>
        {user && (
          <span className="hidden text-[12px] text-[color:var(--wf-muted)] sm:inline">
            {user.name}
          </span>
        )}
        <button
          type="button"
          onClick={handleLogout}
          disabled={logout.isPending}
          title="Sign out"
          className="wf-btn-ghost inline-flex h-7 w-7 items-center justify-center"
        >
          <LogOut className="size-3.5" />
        </button>
      </div>
    </header>
  );
}
