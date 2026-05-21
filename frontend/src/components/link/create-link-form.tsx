'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateLink } from '@/hooks/use-links';
import { ApiError } from '@/lib/api';

const schema = z.object({
  url: z.string().url('Enter a valid URL'),
});

type FormData = z.infer<typeof schema>;

export function CreateLinkForm() {
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
      },
      onError: (err) => {
        const message = err instanceof ApiError ? err.message : 'Failed to create link';
        toast.error(message);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-2">
      <div className="flex-1 space-y-1">
        <Label htmlFor="url" className="sr-only">
          URL
        </Label>
        <Input
          id="url"
          placeholder="https://example.com/your/long/url"
          {...register('url')}
        />
        {errors.url && <p className="text-destructive text-sm">{errors.url.message}</p>}
      </div>
      <Button type="submit" disabled={createLink.isPending} className="shrink-0">
        {createLink.isPending ? 'Creating…' : 'Shorten URL'}
      </Button>
    </form>
  );
}
