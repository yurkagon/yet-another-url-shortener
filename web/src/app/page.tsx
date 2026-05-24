'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { SiteHeader } from '@/components/layout/site-header';
import { QrPlaceholder } from '@/components/wf/qr-placeholder';
import { useMe } from '@/hooks/use-auth';
import { useCreateLink } from '@/hooks/use-links';
import { formatShortLinkLabel } from '@/lib/brand';
import { ApiError, linkService } from '@/services';

const extractCodeFromShortUrl = (shortUrl: string): string | null => {
  const match = /\/l\/([^/?#]+)/.exec(shortUrl);
  return match ? match[1] : null;
};

const shortenSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
});
type ShortenForm = z.infer<typeof shortenSchema>;

export default function LandingPage() {
  const { data: user } = useMe();
  const createLink = useCreateLink();
  const [result, setResult] = useState<{ short: string; original: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ShortenForm>({ resolver: zodResolver(shortenSchema) });

  const onSubmit = (data: ShortenForm) => {
    createLink.mutate(data.url, {
      onSuccess: (short) => {
        setResult({ short, original: data.url });
        reset();
        toast.success('Short link created!');
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : 'Failed to shorten URL');
      },
    });
  };

  const copy = () => {
    if (!result) return;
    void navigator.clipboard.writeText(result.short);
    toast.success('Copied to clipboard!');
  };

  const downloadQr = async () => {
    if (!result) return;
    const code = extractCodeFromShortUrl(result.short);
    if (!code) {
      toast.error('Could not derive short code');
      return;
    }
    try {
      const res = await fetch(linkService.qrUrl(code));
      if (!res.ok) throw new Error('Failed to fetch QR');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `link-${code}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download QR');
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Top nav ─────────────────────────────────────────── */}
      <SiteHeader />

      {/* ── Hero ────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col items-center gap-7 px-10 pb-20 pt-[70px]">
        <div className="flex flex-col items-center gap-2.5">
          <h1 className="font-[family-name:var(--font-hand)] text-[42px] font-bold leading-tight">
            Shorten any link.
          </h1>
          <h1 className="font-[family-name:var(--font-hand)] text-[42px] font-bold leading-tight text-[color:var(--wf-accent)]">
            Get a QR. Done.
          </h1>
        </div>

        <p className="max-w-[520px] text-center text-sm text-[color:var(--wf-muted)]">
          Paste a long URL. We give you a short link + QR code, instantly. No account needed for
          one-offs.
        </p>

        {/* Form */}
        <div className="w-full max-w-[680px]">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="wf-box flex items-center gap-2 p-2"
          >
            <span className="px-2 text-[color:var(--wf-muted)]" aria-hidden>
              🔗
            </span>
            <input
              {...register('url')}
              placeholder="https://your-very-long-link.example.com/article/2025/..."
              className="flex-1 bg-transparent px-1 py-2 text-[13px] outline-none placeholder:text-[color:var(--wf-muted)]"
            />
            <button
              type="submit"
              disabled={createLink.isPending}
              className="wf-btn-solid inline-flex items-center justify-center px-4 py-[10px] text-[13px] disabled:opacity-60"
            >
              {createLink.isPending ? 'Shortening…' : 'Shorten →'}
            </button>
          </form>
          {errors.url && (
            <p className="mt-2 text-center text-xs text-[color:var(--wf-accent)]">
              {errors.url.message}
            </p>
          )}

          <div className="mt-2.5 flex items-center justify-center gap-4">
            <span className="text-[11px] text-[color:var(--wf-muted)]">+ custom slug</span>
            <span className="text-[11px] text-[color:var(--wf-muted)]">+ QR code</span>
            <span className="text-[11px] text-[color:var(--wf-muted)]">+ click stats (free)</span>
          </div>
        </div>

        {/* Result preview card */}
        {result &&
          (() => {
            const code = extractCodeFromShortUrl(result.short);
            return (
              <div className="wf-box w-full max-w-[680px] p-[18px]">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-1 flex-col gap-1.5">
                    <span className="text-[11px] uppercase text-[color:var(--wf-muted)]">
                      Your short link
                    </span>
                    <a
                      href={result.short}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-[family-name:var(--font-mono)] text-[20px] text-[color:var(--wf-accent)] hover:underline"
                    >
                      {result.short}
                    </a>
                    <span className="truncate text-[11px] text-[color:var(--wf-muted)]">
                      ↳ {result.original}
                    </span>
                  </div>
                  {code ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={linkService.qrUrl(code)}
                      alt={`QR code for ${result.short}`}
                      width={88}
                      height={88}
                      className="shrink-0 rounded-md border-[1.5px] border-foreground bg-background p-[6px]"
                    />
                  ) : (
                    <QrPlaceholder size={88} />
                  )}
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={copy}
                      className="wf-btn-outline inline-flex items-center justify-center px-3 py-1.5 text-[12px]"
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => void downloadQr()}
                      disabled={!code}
                      className="wf-btn-outline inline-flex items-center justify-center px-3 py-1.5 text-[12px] disabled:opacity-50"
                    >
                      ⬇ QR
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

        {/* fallback empty preview when no result yet */}
        {!result && (
          <div className="wf-box w-full max-w-[680px] p-[18px]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-1 flex-col gap-1.5">
                <span className="text-[11px] uppercase text-[color:var(--wf-muted)]">
                  Your short link
                </span>
                <span className="font-[family-name:var(--font-mono)] text-[20px] text-[color:var(--wf-muted)]">
                  {formatShortLinkLabel('—')}
                </span>
                <span className="text-[11px] text-[color:var(--wf-muted)]">
                  ↳ paste a URL above to start
                </span>
              </div>
              <QrPlaceholder size={88} />
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled
                  className="wf-btn-outline inline-flex items-center justify-center px-3 py-1.5 text-[12px] opacity-50"
                >
                  Copy
                </button>
                <button
                  type="button"
                  disabled
                  className="wf-btn-outline inline-flex items-center justify-center px-3 py-1.5 text-[12px] opacity-50"
                >
                  ⬇ QR
                </button>
              </div>
            </div>
          </div>
        )}

        {!user && (
          <p className="text-sm text-[color:var(--wf-muted)]">
            <Link href="/register" className="text-[color:var(--wf-accent)] hover:underline">
              Create a free account →
            </Link>{' '}
            to keep your links and view stats.
          </p>
        )}
      </main>

      {/* ── Footer hints ────────────────────────────────────── */}
      <footer className="flex items-center justify-center gap-9 border-t border-[color:var(--wf-line)] py-7">
        <span className="flex items-center gap-1.5 text-[11px] text-[color:var(--wf-muted)]">
          <span className="wf-icon wf-icon-circle h-4 w-4 text-[10px]">✓</span>
          free forever
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-[color:var(--wf-muted)]">
          <span className="wf-icon wf-icon-circle h-4 w-4 text-[10px]">✓</span>
          no card required
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-[color:var(--wf-muted)]">
          <span className="wf-icon wf-icon-circle h-4 w-4 text-[10px]">✓</span>
          QR included
        </span>
      </footer>
    </div>
  );
}
