'use client';

import { BarChart2, Copy, ExternalLink, QrCode } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { type Link as LinkType } from '@/lib/api';
import { QrCodeModal } from './qr-code-modal';

interface LinksTableProps {
  links: LinkType[];
}

const APP_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/v1', '') ?? 'http://localhost:3000';

function buildShortUrl(code: string) {
  return `${APP_URL}/l/${code}`;
}

export function LinksTable({ links }: LinksTableProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);

  const copy = (code: string) => {
    void navigator.clipboard.writeText(buildShortUrl(code));
    toast.success('Copied!');
  };

  if (links.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        No links yet. Create your first one above.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Original URL</TableHead>
            <TableHead>Short link</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {links.map((link) => (
            <TableRow key={link.code}>
              <TableCell className="max-w-xs truncate">
                <a
                  href={link.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-muted-foreground"
                >
                  {link.originalUrl}
                </a>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="font-mono">
                  {link.code}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {new Date(link.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Copy short URL"
                    onClick={() => copy(link.code)}
                  >
                    <Copy className="size-4" />
                  </Button>
                  <a
                    href={buildShortUrl(link.code)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open short URL"
                    className={buttonVariants({ size: 'icon', variant: 'ghost' })}
                  >
                    <ExternalLink className="size-4" />
                  </a>
                  <Button
                    size="icon"
                    variant="ghost"
                    title="QR code"
                    onClick={() => setQrCode(link.code)}
                  >
                    <QrCode className="size-4" />
                  </Button>
                  <Link
                    href={`/dashboard/${link.code}`}
                    title="Analytics"
                    className={buttonVariants({ size: 'icon', variant: 'ghost' })}
                  >
                    <BarChart2 className="size-4" />
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <QrCodeModal code={qrCode} onClose={() => setQrCode(null)} />
    </>
  );
}
