'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useLogin } from '@/hooks/use-auth';
import { ApiError } from '@/services';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (data: LoginForm) => {
    login.mutate(data, {
      onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Login failed'),
    });
  };

  return (
    <div className="flex w-full max-w-[420px] flex-col gap-5">
      <div className="wf-box wf-box-lg flex flex-col gap-5 p-8">
        <div className="flex flex-col items-center gap-1">
          <h1 className="font-[family-name:var(--font-hand)] text-[26px] font-bold">
            Welcome back
          </h1>
          <p className="text-[12px] text-[color:var(--wf-muted)]">
            Log in to manage your links
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
            <span className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-[color:var(--wf-muted)]">
                Password
              </span>
            </span>
            <input
              type="password"
              placeholder="••••••••"
              {...register('password')}
              className="wf-input text-[13px]"
            />
            {errors.password && (
              <span className="text-[11px] text-[color:var(--wf-accent)]">
                {errors.password.message}
              </span>
            )}
          </label>

          <button
            type="submit"
            disabled={login.isPending}
            className="wf-btn-solid mt-1 inline-flex w-full items-center justify-center px-4 py-2.5 text-[13px] disabled:opacity-60"
          >
            {login.isPending ? 'Logging in…' : 'Log in'}
          </button>
        </form>
      </div>

      <p className="text-center text-[11px] text-[color:var(--wf-muted)]">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-[color:var(--wf-accent)]">
          Sign up →
        </Link>
      </p>
      <p className="text-center text-[10px] text-[color:var(--wf-muted)]">
        By logging in you agree to our Terms &amp; Privacy
      </p>
    </div>
  );
}
