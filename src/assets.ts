// Stored image paths stay portable between Android, local development and Pages.
export function assetUrl(src: string): string {
  return src.startsWith("/assets/")
    ? `${import.meta.env.BASE_URL}${src.slice(1)}`
    : src;
}
