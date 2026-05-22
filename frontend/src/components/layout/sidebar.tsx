'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Logo } from '@/components/wf/logo';
import { cn } from '@/lib/utils';

const navItems: { href: string; label: string; glyph: string; exact?: boolean }[] = [
  { href: '/dashboard', label: 'Links', glyph: '🔗', exact: true },
  { href: '/dashboard/analytics', label: 'Analytics', glyph: '📊' },
  { href: '/dashboard/qr', label: 'QR codes', glyph: '⌗' },
  { href: '/dashboard/domains', label: 'Domains', glyph: '◇' },
  { href: '/dashboard/settings', label: 'Settings', glyph: '⚙' },
];

const workspaces = ['📁 Marketing', '📁 Personal', '📁 Side project'];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="flex w-[220px] shrink-0 flex-col gap-5 border-r border-[color:var(--wf-line)] bg-[color:var(--wf-tint)] p-[18px]">
      <Logo />

      <Link
        href="/dashboard?new=1"
        className="wf-btn-solid inline-flex items-center justify-center px-3 py-2 text-[13px]"
      >
        + New link
      </Link>

      <nav className="flex flex-col gap-0.5">
        {navItems.map(({ href, label, glyph, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-md border px-2.5 py-2 text-[13px]',
                active
                  ? 'border-[color:var(--wf-line)] bg-background font-semibold text-foreground'
                  : 'border-transparent text-[color:var(--wf-muted)]',
              )}
            >
              <span className="wf-icon wf-icon-circle h-4 w-4 text-[10px]">{glyph}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="h-px w-full bg-[color:var(--wf-line)]" />

      <div className="flex flex-col gap-1">
        <span className="px-2.5 text-[10px] uppercase tracking-wider text-[color:var(--wf-muted)]">
          Workspace
        </span>
        {workspaces.map((w) => (
          <div key={w} className="px-2.5 py-1.5 text-[12px] text-[color:var(--wf-muted)]">
            {w}
          </div>
        ))}
      </div>

      <div className="wf-box mt-auto flex flex-col gap-2 p-3">
        <span className="text-[10px] uppercase tracking-wider text-[color:var(--wf-muted)]">
          Free plan
        </span>
        <div className="relative h-1 w-full overflow-hidden rounded-full bg-[color:var(--wf-muted)]/30">
          <span className="absolute inset-y-0 left-0 w-[64%] rounded-full bg-foreground" />
        </div>
        <span className="text-[10px] text-[color:var(--wf-muted)]">32 / 50 links</span>
        <span className="text-[11px] text-[color:var(--wf-accent)]">Upgrade →</span>
      </div>
    </aside>
  );
}
