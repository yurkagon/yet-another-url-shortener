import type { ClickModel, LinkModel, UserModel } from '@generated/prisma/models';

export type E2eStore = {
  users: UserModel[];
  links: LinkModel[];
  clicks: ClickModel[];
  redis: Map<string, string>;
};

export const createE2eStore = (): E2eStore => ({
  users: [],
  links: [],
  clicks: [],
  redis: new Map<string, string>(),
});

export const resetE2eStore = (store: E2eStore) => {
  store.users.length = 0;
  store.links.length = 0;
  store.clicks.length = 0;
  store.redis.clear();
};
