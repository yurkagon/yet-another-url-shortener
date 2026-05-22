'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { formatShortLinkLabel } from '@/lib/brand';
import { type Link as LinkType } from '@/lib/api';
import { QrCodeModal } from './qr-code-modal';

interface LinksTableProps {
  links: LinkType[];
  view?: 'list' | 'grid';
}

const APP_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/v1', '') ?? 'http://localhost:3000';

function buildShortUrl(code: string) {
  return `${APP_URL}/l/${code}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Prevents row/card click from firing when an inner interactive element is clicked */
function stop(e: React.MouseEvent) {
  e.stopPropagation();
}

export function LinksTable({ links, view = 'list' }: LinksTableProps) {
  const router = useRouter();
  const [qrCode, setQrCode] = useState<string | null>(null);

  const copy = (code: string) => {
    void navigator.clipboard.writeText(buildShortUrl(code));
    toast.success('Copied!');
  };

  if (links.length === 0) {
    return (
      <div className="flex h-full items-center justify-center py-16 text-[13px] text-[color:var(--wf-muted)]">
        No links yet. Create your first one above.
      </div>
    );
  }

  if (view === 'grid') {
    return (
      <div className="h-full overflow-auto p-4">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
          {links.map((link) => (
            <div
              key={link.code}
              onClick={() => router.push(`/dashboard/${link.code}`)}
              className="wf-box flex cursor-pointer flex-col gap-3 p-4 transition-colors hover:bg-[color:var(--wf-tint)]"
            >
              {/* Top: QR + short URL */}
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={(e) => { stop(e); setQrCode(link.code); }}
                  className="wf-box-dashed flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-[1.5px] text-[9px] text-[color:var(--wf-muted)]"
                  title="QR"
                >
                  QR
                </button>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <a
                    href={buildShortUrl(link.code)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={stop}
                    className="truncate font-[family-name:var(--font-mono)] text-[13px] font-semibold text-[color:var(--wf-accent)] hover:underline"
                  >
                    {formatShortLinkLabel(link.code)}
                  </a>
                  <button
                    type="button"
                    onClick={(e) => { stop(e); copy(link.code); }}
                    className="self-start text-[10px] text-[color:var(--wf-muted)] hover:text-foreground"
                  >
                    ⎘ copy
                  </button>
                </div>
              </div>

              {/* Destination */}
              <a
                href={link.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={stop}
                className="block truncate text-[11px] text-[color:var(--wf-muted)] hover:underline"
                title={link.originalUrl}
              >
                ↳ {link.originalUrl}
              </a>

              {/* Footer: clicks + date */}
              <div
                className="flex items-center justify-between border-t border-[color:var(--wf-line)] pt-2.5"
                onClick={stop}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-[color:var(--wf-muted)]">
                    <span className="font-[family-name:var(--font-mono)] font-semibold text-foreground">
                      {link._count.clicks}
                    </span>{' '}
                    clicks
                  </span>
                  <span className="text-[10px] text-[color:var(--wf-muted)]">
                    {formatDate(link.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <QrCodeModal code={qrCode} onClose={() => setQrCode(null)} />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      {/* Header row */}
      <div className="grid grid-cols-[2.4fr_2.6fr_0.8fr_0.8fr_60px] items-center gap-3 border-b border-[color:var(--wf-line)] bg-[color:var(--wf-tint)] px-4 py-3 text-[10px] uppercase tracking-wider text-[color:var(--wf-muted)]">
        <span>Short link</span>
        <span>Destination</span>
        <span>Clicks</span>
        <span>Created</span>
        <span />
      </div>

      {links.map((link, i) => (
        <div
          key={link.code}
          onClick={() => router.push(`/dashboard/${link.code}`)}
          className={`grid cursor-pointer grid-cols-[2.4fr_2.6fr_0.8fr_0.8fr_60px] items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[color:var(--wf-tint)] ${
            i === links.length - 1 ? '' : 'border-b border-[color:var(--wf-line)]'
          }`}
        >
          {/* Short link + QR thumb */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={(e) => { stop(e); setQrCode(link.code); }}
              className="wf-box-dashed flex h-7 w-7 items-center justify-center rounded-md border-[1.5px] text-[9px] text-[color:var(--wf-muted)]"
              title="QR"
            >
              QR
            </button>
            <div className="flex min-w-0 flex-col gap-0.5">
              <a
                href={buildShortUrl(link.code)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={stop}
                className="truncate font-[family-name:var(--font-mono)] text-[13px] text-[color:var(--wf-accent)] hover:underline"
              >
                {formatShortLinkLabel(link.code)}
              </a>
              <button
                type="button"
                onClick={(e) => { stop(e); copy(link.code); }}
                className="self-start text-[10px] text-[color:var(--wf-muted)] hover:text-foreground"
              >
                ⎘ copy
              </button>
            </div>
          </div>

          {/* Destination */}
          <a
            href={link.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={stop}
            className="block truncate text-[12px] text-[color:var(--wf-muted)] hover:underline"
          >
            ↳ {link.originalUrl}
          </a>

          {/* Clicks */}
          <span className="font-[family-name:var(--font-mono)] text-[13px] font-semibold">
            {link._count.clicks}
          </span>

          {/* Created */}
          <span className="text-[11px] text-[color:var(--wf-muted)]">
            {formatDate(link.createdAt)}
          </span>

          {/* Actions — остання колонка, клік не потрібен (рядок вже клікабельний) */}
          <div className="flex items-center justify-end gap-1.5" onClick={stop}>
            <Link
              href={`/dashboard/${link.code}`}
              title="Stats"
              className="text-[14px] text-[color:var(--wf-muted)] hover:text-foreground"
            >
              ⋯
            </Link>
          </div>
        </div>
      ))}

      <QrCodeModal code={qrCode} onClose={() => setQrCode(null)} />
    </div>
  );
}
