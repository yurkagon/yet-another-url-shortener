'use client';

import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { linkApi } from '@/lib/api';

interface QrCodeModalProps {
  code: string | null;
  onClose: () => void;
}

export function QrCodeModal({ code, onClose }: QrCodeModalProps) {
  if (!code) return null;

  const qrUrl = linkApi.qrUrl(code);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `qr-${code}.png`;
    a.click();
  };

  return (
    <Dialog open={!!code} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>QR Code</DialogTitle>
          <DialogDescription>Scan to open the short link</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt={`QR code for ${code}`} className="rounded-lg border size-56" />

          <Button variant="outline" onClick={handleDownload} className="w-full">
            <Download className="size-4 mr-2" />
            Download PNG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
