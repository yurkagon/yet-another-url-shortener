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

export const createPrismaMock = (store: E2eStore) => ({
  user: {
    findUnique: jest.fn(
      async ({
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
    create: jest.fn(async ({ data }: { data: Pick<UserModel, 'name' | 'email' | 'password'> }) => {
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
    findMany: jest.fn(async ({ select }: { select?: SelectShape<UserModel> }) =>
      store.users.map((user) => selectFields(user, select)),
    ),
  },
  link: {
    create: jest.fn(
      async ({
        data,
      }: {
        data: Pick<LinkModel, 'code' | 'originalUrl'> & {
          user: { connect: Pick<UserModel, 'id'> };
        };
      }) => {
        const now = new Date();
        const link: LinkModel = {
          code: data.code,
          originalUrl: data.originalUrl,
          userId: data.user.connect.id,
          createdAt: now,
          updatedAt: now,
        };
        store.links.push(link);

        return link;
      },
    ),
    findUnique: jest.fn(async ({ where }: { where: Pick<LinkModel, 'code'> }) => {
      return store.links.find((link) => link.code === where.code) ?? null;
    }),
  },
  click: {
    create: jest.fn(
      async ({
        data,
      }: {
        data: Pick<ClickModel, 'ipAddress' | 'userAgent'> & {
          link: { connect: Pick<LinkModel, 'code'> };
        };
      }) => {
        const now = new Date();
        const click: ClickModel = {
          id: `click-${store.clicks.length + 1}`,
          linkCode: data.link.connect.code,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          createdAt: now,
          updatedAt: now,
        };
        store.clicks.push(click);

        return click;
      },
    ),
    findMany: jest.fn(async ({ where }: { where: Pick<ClickModel, 'linkCode'> }) => {
      return store.clicks.filter((click) => click.linkCode === where.linkCode);
    }),
  },
});

export type PrismaMock = ReturnType<typeof createPrismaMock>;
