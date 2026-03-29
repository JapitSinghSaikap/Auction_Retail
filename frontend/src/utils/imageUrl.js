const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Resolve any image URL to an absolute URL.
 * - '/uploads/...' → prepend API_URL
 * - 'http...'      → use as-is
 * - null/undefined → placeholder
 */
export function resolveImageUrl(url, fallbackTitle = 'Auction') {
  if (!url) return `https://placehold.co/600x400/1a1825/ffffff?text=${encodeURIComponent(fallbackTitle.slice(0, 20))}`;
  if (url.startsWith('/uploads')) return `${API_URL}${url}`;
  if (url.startsWith('http'))    return url;
  // relative path
  return `${API_URL}/${url}`;
}
