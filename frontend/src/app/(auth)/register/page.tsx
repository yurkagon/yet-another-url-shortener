'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useRegister } from '@/hooks/use-auth';
import { ApiError } from '@/lib/api';

const registerSchema = z.object({
  name: z.string().min(2, 'At least 2 characters').max(20),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters'),
});
type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const register_ = useRegister();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const passwordValue = watch('password') ?? '';
  const strength = scorePassword(passwordValue);

  const onSubmit = (data: RegisterForm) => {
    register_.mutate(data, {
      onError: (err) =>
        toast.error(err instanceof ApiError ? err.message : 'Registration failed'),
    });
  };

  return (
    <div className="flex w-full max-w-[440px] flex-col gap-5">
      <div className="wf-box wf-box-lg flex flex-col gap-5 p-8">
        <div className="flex flex-col items-center gap-1">
          <h1 className="font-[family-name:var(--font-hand)] text-[26px] font-bold">
            Create your account
          </h1>
          <p className="text-[12px] text-[color:var(--wf-muted)]">
            Free forever. No card needed.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="h-px flex-1 bg-[color:var(--wf-line)]" />
          <span className="text-[10px] uppercase tracking-wider text-[color:var(--wf-muted)]">
            With email
          </span>
          <span className="h-px flex-1 bg-[color:var(--wf-line)]" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-[color:var(--wf-muted)]">
              Name
            </span>
            <input
              placeholder="Maria Petrenko"
              {...register('name')}
              className="wf-input text-[13px]"
            />
            {errors.name && (
              <span className="text-[11px] text-[color:var(--wf-accent)]">
                {errors.name.message}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-[color:var(--wf-muted)]">
              Email
            </span>
            <input
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              className="wf-input text-[13px]"
            />
            {errors.email && (
              <span className="text-[11px] text-[color:var(--wf-accent)]">
                {errors.email.message}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-[color:var(--wf-muted)]">
              Password
            </span>
            <input
              type="password"
              placeholder="at least 8 characters"
              {...register('password')}
              className="wf-input text-[13px]"
            />
            <div className="mt-1 flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="h-1 flex-1 rounded-full"
                  style={{
                    background:
                      i < strength ? 'var(--wf-accent)' : 'rgba(107,105,96,0.3)',
                  }}
                />
              ))}
            </div>
            {errors.password && (
              <span className="text-[11px] text-[color:var(--wf-accent)]">
                {errors.password.message}
              </span>
            )}
          </label>

          <label className="mt-1 flex items-start gap-2">
            <span className="mt-[2px] inline-block h-3.5 w-3.5 border-[1.5px] border-foreground bg-background" />
            <span className="text-[11px] text-[color:var(--wf-muted)]">
              I agree to the Terms of Service and Privacy Policy
            </span>
          </label>

          <button
            type="submit"
            disabled={register_.isPending}
            className="wf-btn-solid mt-1 inline-flex w-full items-center justify-center px-4 py-2.5 text-[13px] disabled:opacity-60"
          >
            {register_.isPending ? 'Creating…' : 'Create account'}
          </button>
        </form>
      </div>

      <p className="text-center text-[11px] text-[color:var(--wf-muted)]">
        Already a member?{' '}
        <Link href="/login" className="text-[color:var(--wf-accent)]">
          Log in →
        </Link>
      </p>
    </div>
  );
}

function scorePassword(value: string): number {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  return score;
}
