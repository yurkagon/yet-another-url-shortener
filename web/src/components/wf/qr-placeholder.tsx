import { cn } from '@/lib/utils';

interface QrPlaceholderProps {
  size?: number;
  className?: string;
}

export function QrPlaceholder({ size = 80, className }: QrPlaceholderProps) {
  const dots = 8 * 8;

  return (
    <div
      className={cn(
        'relative shrink-0 rounded-md border-[1.5px] border-foreground bg-background p-[6px]',
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <div
        className="grid h-full w-full"
        style={{
          gridTemplateColumns: 'repeat(8, 1fr)',
          gridTemplateRows: 'repeat(8, 1fr)',
          gap: 1,
        }}
      >
        {Array.from({ length: dots }).map((_, i) => (
          <div
            key={i}
            className="bg-foreground"
            style={{ opacity: ((i * 37) % 7) < 3 ? 1 : 0 }}
          />
        ))}
      </div>
      {(['top-left', 'top-right', 'bottom-left'] as const).map((corner) => (
        <span
          key={corner}
          className={cn(
            'absolute h-[18px] w-[18px] border-[3px] border-foreground bg-background',
            'after:absolute after:inset-[3px] after:bg-foreground',
            corner === 'top-left' && 'left-[6px] top-[6px]',
            corner === 'top-right' && 'right-[6px] top-[6px]',
            corner === 'bottom-left' && 'left-[6px] bottom-[6px]',
          )}
        />
      ))}
    </div>
  );
}
