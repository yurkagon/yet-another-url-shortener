import type { ClickModel, LinkModel, UserModel } from '@generated/prisma/models';

import type { E2eStore } from './e2e-store';

type SelectShape<TRecord> = Partial<Record<keyof TRecord, boolean>>;

const selectFields = <TRecord extends object>(record: TRecord, select?: SelectShape<TRecord>) => {
  if (!select) {
    return record;
  }

  return Object.fromEntries(
    Object.entries(select)
      .filter(([, isSelected]) => isSelected)
      .map(([key]) => [key, record[key as keyof TRecord]]),
  );
};

/** Matches the `OR` search shape used by LinkService.findAllByUser */
type LinkOrFilter = Array<{
  code?: { contains: string; mode?: string };
  originalUrl?: { contains: string; mode?: string };
}>;

type LinkWhereInput = {
  userId?: string;
  isArchived?: boolean;
  OR?: LinkOrFilter;
};

type LinkFindManyArgs = {
  where?: LinkWhereInput;
  orderBy?: { createdAt?: 'asc' | 'desc' };
  skip?: number;
  take?: number;
};

type LinkCountArgs = {
  where?: LinkWhereInput;
};

/** Resolve which links match a LinkWhereInput */
const filterLinks = (links: LinkModel[], where: LinkWhereInput = {}): LinkModel[] => {
  return links.filter((link) => {
    if (where.userId !== undefined && link.userId !== where.userId) return false;
    if (where.isArchived !== undefined && link.isArchived !== where.isArchived) return false;
    if (where.OR) {
      const search = where.OR[0]?.code?.contains ?? where.OR[0]?.originalUrl?.contains ?? '';
      const lower = search.toLowerCase();
      const matches =
        link.code.toLowerCase().includes(lower) || link.originalUrl.toLowerCase().includes(lower);
      if (!matches) return false;
    }
    return true;
  });
};

export const createPrismaMock = (store: E2eStore) => ({
  user: {
    findUnique: jest.fn(
      ({
        where,
        select,
      }: {
        where: Partial<Pick<UserModel, 'id' | 'email'>>;
        select?: SelectShape<UserModel>;
      }) => {
        const user = where.email
          ? store.users.find((candidate) => candidate.email === where.email)
          : store.users.find((candidate) => candidate.id === where.id);

        return user ? selectFields(user, select) : null;
      },
    ),
    create: jest.fn(({ data }: { data: Pick<UserModel, 'name' | 'email' | 'password'> }) => {
      const now = new Date();
      const user: UserModel = {
        id: `user-${store.users.length + 1}`,
        name: data.name,
        email: data.email,
        password: data.password,
        createdAt: now,
        updatedAt: now,
      };
      store.users.push(user);

      return user;
    }),
    findMany: jest.fn(({ select }: { select?: SelectShape<UserModel> }) =>
      store.users.map((user) => selectFields(user, select)),
    ),
  },
  link: {
    create: jest.fn(
      ({
        data,
      }: {
        data: Pick<LinkModel, 'code' | 'originalUrl'> & {
          user: { connect: Pick<UserModel, 'id'> };
        };
      }) => {
        const now = new Date();
        const link: LinkModel = {
          id: `link-${store.links.length + 1}`,
          code: data.code,
          originalUrl: data.originalUrl,
          isArchived: false,
          userId: data.user.connect.id,
          createdAt: now,
          updatedAt: now,
        };
        store.links.push(link);

        return link;
      },
    ),
    findUnique: jest.fn(({ where }: { where: Pick<LinkModel, 'code'> }) => {
      return store.links.find((link) => link.code === where.code) ?? null;
    }),
    findMany: jest.fn(({ where, orderBy, skip = 0, take }: LinkFindManyArgs) => {
      let results = filterLinks(store.links, where);

      if (orderBy?.createdAt) {
        results = [...results].sort((a, b) => {
          const diff = a.createdAt.getTime() - b.createdAt.getTime();
          return orderBy.createdAt === 'asc' ? diff : -diff;
        });
      }

      results = results.slice(skip);
      if (take !== undefined) results = results.slice(0, take);

      return results;
    }),
    count: jest.fn(({ where }: LinkCountArgs) => {
      return filterLinks(store.links, where).length;
    }),
  },
  click: {
    create: jest.fn(
      ({
        data,
      }: {
        data: Pick<ClickModel, 'ipAddress' | 'userAgent'> & {
          link: { connect: Pick<LinkModel, 'id'> };
        };
      }) => {
        const now = new Date();
        const click: ClickModel = {
          id: `click-${store.clicks.length + 1}`,
          linkId: data.link.connect.id,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          createdAt: now,
          updatedAt: now,
        };
        store.clicks.push(click);

        return Promise.resolve(click);
      },
    ),
    findMany: jest.fn(({ where }: { where?: { linkId?: string; link?: { code?: string } } }) => {
      if (where?.linkId !== undefined) {
        return store.clicks.filter((click) => click.linkId === where.linkId);
      }
      // Relation filter: { link: { code } } — resolve via store lookup
      if (where?.link?.code !== undefined) {
        const link = store.links.find((l) => l.code === where.link!.code);
        if (!link) return [];
        return store.clicks.filter((click) => click.linkId === link.id);
      }
      return store.clicks;
    }),
  },
});

export type PrismaMock = ReturnType<typeof createPrismaMock>;
