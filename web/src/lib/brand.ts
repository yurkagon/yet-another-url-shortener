export const PROJECT_NAME = 'yet-another-url-shortener';
export const PROJECT_DISPLAY = 'ya url shortener';
export const PROJECT_LOGO_MARK = 'ya';
export const PROJECT_LOGO_TEXT = 'url shortener';
export const PROJECT_SHORT = 'ya';
export const PROJECT_TAGLINE = 'tiny links, big insight';

export function formatShortLinkLabel(code: string) {
  return `${PROJECT_SHORT}/${code}`;
}
