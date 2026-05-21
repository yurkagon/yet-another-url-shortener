'use client';

import { Link2, LogOut } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useLogout, useMe } from '@/hooks/use-auth';

export function Header() {
  const { data: user } = useMe();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onError: () => toast.error('Logout failed'),
    });
  };

  return (
    <header className="border-b h-14 flex items-center justify-between px-6 bg-background">
      <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
        <Link2 className="size-5" />
        <span>Shrtnr</span>
      </Link>

      <div className="flex items-center gap-3">
        {user && (
          <span className="text-sm text-muted-foreground hidden sm:block">{user.name}</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          disabled={logout.isPending}
          title="Sign out"
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}
