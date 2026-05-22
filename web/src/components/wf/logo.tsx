import Link from 'next/link';

import { PROJECT_LOGO_MARK, PROJECT_LOGO_TEXT, PROJECT_NAME } from '@/lib/brand';
import { cn } from '@/lib/utils';

interface LogoProps {
  href?: string;
  className?: string;
}

export function Logo({ href = '/', className }: LogoProps) {
  return (
    <Link
      href={href}
      title={PROJECT_NAME}
      className={cn(
        'inline-flex items-center gap-2 font-[family-name:var(--font-hand)] text-xl tracking-tight text-foreground',
        className,
      )}
    >
      <span
        aria-hidden
        className="inline-flex size-7 items-center justify-center rounded-md border-[1.5px] border-foreground bg-foreground text-background shadow-[2px_2px_0_0_var(--wf-ink)]"
      >
        <span className="font-[family-name:var(--font-hand)] text-sm leading-none">{PROJECT_LOGO_MARK}</span>
      </span>
      <span>{PROJECT_LOGO_TEXT}</span>
    </Link>
  );
}
