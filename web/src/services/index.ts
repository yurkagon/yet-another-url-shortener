export { ApiError } from './api.service';

import { AuthService } from './auth.service';
import { LinkService } from './link.service';
import { StatisticsService } from './statistics.service';

export { AuthService } from './auth.service';
export type { User, AuthResponse } from './auth.service';

export { LinkService } from './link.service';
export type { Link, LinkListParams, PaginatedLinks } from './link.service';

export { StatisticsService } from './statistics.service';
export type { DailyClick, MyOverview, TopLink } from './statistics.service';

export const authService = new AuthService();
export const linkService = new LinkService();
export const statisticsService = new StatisticsService();
