'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useCreateLink } from '@/hooks/use-links';
import { ApiError } from '@/lib/api';

const schema = z.object({
  url: z.string().url('Enter a valid URL'),
});

type FormData = z.infer<typeof schema>;

interface CreateLinkFormProps {
  onSuccess?: () => void;
}

export function CreateLinkForm({ onSuccess }: CreateLinkFormProps) {
  const createLink = useCreateLink();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => {
    createLink.mutate(data.url, {
      onSuccess: () => {
        toast.success('Short link created!');
        reset();
        onSuccess?.();
      },
      onError: (err) => {
        const message = err instanceof ApiError ? err.message : 'Failed to create link';
        toast.error(message);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-[color:var(--wf-muted)]">
          Paste a long URL
        </span>
        <div className="flex items-center gap-2">
          <input
            id="url"
            placeholder="https://example.com/your/long/url"
            {...register('url')}
            className="wf-input flex-1 text-[13px]"
          />
          <button
            type="submit"
            disabled={createLink.isPending}
            className="wf-btn-solid inline-flex items-center justify-center px-4 py-2.5 text-[13px] disabled:opacity-60"
          >
            {createLink.isPending ? 'Shortening…' : 'Shorten →'}
          </button>
        </div>
        {errors.url && (
          <span className="text-[11px] text-[color:var(--wf-accent)]">{errors.url.message}</span>
        )}
      </div>
    </form>
  );
}
