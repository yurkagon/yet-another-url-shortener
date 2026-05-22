import Link from 'next/link';

import { ThemeToggle } from '@/components/theme-toggle';
import { Logo } from '@/components/wf/logo';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-[color:var(--wf-line)] px-6 py-4">
        <Logo />
        <div className="flex items-center gap-4 text-[11px] text-[color:var(--wf-muted)]">
          <ThemeToggle />
          <span className="hidden sm:block">Need help?</span>
          <Link href="/" className="text-[color:var(--wf-accent)]">
            ← Home
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">{children}</main>
    </div>
  );
}
