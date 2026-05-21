'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Copy, ExternalLink, Link2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMe } from '@/hooks/use-auth';
import { useCreateLink } from '@/hooks/use-links';
import { ApiError } from '@/lib/api';

const shortenSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
});

type ShortenForm = z.infer<typeof shortenSchema>;

export default function LandingPage() {
  const { data: user } = useMe();
  const createLink = useCreateLink();
  const [shortUrl, setShortUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ShortenForm>({ resolver: zodResolver(shortenSchema) });

  const onSubmit = (data: ShortenForm) => {
    if (!user) {
      toast.error('Please sign in to shorten links');
      return;
    }

    createLink.mutate(data.url, {
      onSuccess: (url) => {
        setShortUrl(url);
        reset();
        toast.success('Short link created!');
      },
      onError: (err) => {
        const message = err instanceof ApiError ? err.message : 'Failed to shorten URL';
        toast.error(message);
      },
    });
  };

  const copyToClipboard = () => {
    if (!shortUrl) return;
    void navigator.clipboard.writeText(shortUrl);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <Link2 className="size-5" />
          <span>Shrtnr</span>
        </div>
        <nav className="flex items-center gap-3">
          {user ? (
            <Link href="/dashboard" className={buttonVariants({ size: 'sm' })}>
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                Sign in
              </Link>
              <Link href="/register" className={buttonVariants({ size: 'sm' })}>
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 gap-8">
        <div className="text-center space-y-3 max-w-xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Shorten. Share. Track.
          </h1>
          <p className="text-muted-foreground text-lg">
            Turn long URLs into clean, trackable short links in seconds.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col sm:flex-row w-full max-w-lg gap-2"
        >
          <div className="flex-1 space-y-1">
            <Input
              placeholder="https://example.com/very/long/url"
              {...register('url')}
              className="h-11"
            />
            {errors.url && <p className="text-destructive text-sm">{errors.url.message}</p>}
          </div>
          <Button type="submit" className="h-11 shrink-0" disabled={createLink.isPending}>
            Shorten
            <ArrowRight className="size-4 ml-1" />
          </Button>
        </form>

        {shortUrl && (
          <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/40 text-sm max-w-lg w-full">
            <a
              href={shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 truncate font-medium hover:underline"
            >
              {shortUrl}
            </a>
            <Button size="icon" variant="ghost" onClick={copyToClipboard} title="Copy">
              <Copy className="size-4" />
            </Button>
            <a
              href={shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open"
              className={buttonVariants({ size: 'icon', variant: 'ghost' })}
            >
              <ExternalLink className="size-4" />
            </a>
          </div>
        )}

        {!user && (
          <p className="text-sm text-muted-foreground">
            <Link href="/register" className="underline underline-offset-4 hover:text-primary">
              Create a free account
            </Link>{' '}
            to shorten links and view analytics.
          </p>
        )}
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Shrtnr
      </footer>
    </div>
  );
}
