'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { formatShortLinkLabel } from '@/lib/brand';
import { type Link as LinkType } from '@/lib/api';
import { QrCodeModal } from './qr-code-modal';

interface LinksTableProps {
  links: LinkType[];
}

const APP_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/v1', '') ?? 'http://localhost:3000';

function buildShortUrl(code: string) {
  return `${APP_URL}/l/${code}`;
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return '1d ago';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export function LinksTable({ links }: LinksTableProps) {
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

  return (
    <div className="h-full overflow-auto">
      {/* Header row */}
      <div className="grid grid-cols-[2.4fr_2.6fr_0.8fr_0.8fr_0.8fr_60px] items-center gap-3 border-b border-[color:var(--wf-line)] bg-[color:var(--wf-tint)] px-4 py-3 text-[10px] uppercase tracking-wider text-[color:var(--wf-muted)]">
        <span>Short link</span>
        <span>Destination</span>
        <span className="text-right">Clicks</span>
        <span className="text-right">CTR</span>
        <span>Created</span>
        <span />
      </div>

      {links.map((link, i) => (
        <div
          key={link.code}
          className={`grid grid-cols-[2.4fr_2.6fr_0.8fr_0.8fr_0.8fr_60px] items-center gap-3 px-4 py-3.5 ${
            i === links.length - 1 ? '' : 'border-b border-[color:var(--wf-line)]'
          }`}
        >
          {/* Short link + QR thumb */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setQrCode(link.code)}
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
                className="truncate font-[family-name:var(--font-mono)] text-[13px] text-[color:var(--wf-accent)] hover:underline"
              >
                {formatShortLinkLabel(link.code)}
              </a>
              <button
                type="button"
                onClick={() => copy(link.code)}
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
            className="block truncate text-[12px] text-[color:var(--wf-muted)] hover:underline"
          >
            ↳ {link.originalUrl}
          </a>

          {/* Clicks */}
          <span className="text-right text-[13px] font-semibold">—</span>

          {/* CTR */}
          <span className="text-right text-[11px] text-[color:var(--wf-muted)]">—</span>

          {/* Created */}
          <span className="text-[11px] text-[color:var(--wf-muted)]">
            {timeAgo(link.createdAt)}
          </span>

          {/* Actions */}
          <div className="flex items-center justify-end gap-1.5">
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
