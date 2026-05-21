'use client';

import { CreateLinkForm } from '@/components/link/create-link-form';
import { LinksTable } from '@/components/link/links-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLinks } from '@/hooks/use-links';

export default function DashboardPage() {
  const { data: links = [], isLoading } = useLinks();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Links</h1>
        <p className="text-muted-foreground">Create and manage your short links</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Shorten a URL</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateLinkForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            All links{' '}
            {links.length > 0 && (
              <span className="text-muted-foreground font-normal">({links.length})</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground">Loading…</div>
          ) : (
            <LinksTable links={links} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
