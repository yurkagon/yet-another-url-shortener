'use client';

import { BarChart3, Link2, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'My Links', icon: Link2 },
  { href: '/dashboard/stats', label: 'Statistics', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r shrink-0 flex flex-col gap-1 p-3 bg-background">
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
            pathname === href
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}

      <div className="mt-auto pt-3 border-t">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Plus className="size-4" />
          New link
        </Link>
      </div>
    </aside>
  );
}
