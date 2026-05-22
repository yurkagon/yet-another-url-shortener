import Link from 'next/link';

import { cn } from '@/lib/utils';

interface LogoProps {
  href?: string;
  className?: string;
}

export function Logo({ href = '/', className }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-2 font-[family-name:var(--font-hand)] text-xl tracking-tight text-foreground',
        className,
      )}
    >
      <span
        aria-hidden
        className="inline-flex size-7 items-center justify-center rounded-md border-[1.5px] border-foreground bg-foreground text-background shadow-[2px_2px_0_0_var(--wf-ink)]"
      >
        <span className="font-[family-name:var(--font-hand)] text-base leading-none">s</span>
      </span>
      <span>
        snip<span className="text-[color:var(--wf-accent)]">.</span>ly
      </span>
    </Link>
  );
}
