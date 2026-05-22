export const PROJECT_NAME = 'yet-another-url-shortener';
export const PROJECT_SHORT = 'yaus';
export const PROJECT_TAGLINE = 'tiny links, big insight';

export function formatShortLinkLabel(code: string) {
  return `${PROJECT_SHORT}/${code}`;
}
