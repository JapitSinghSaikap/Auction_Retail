/**
 * Format a number as currency (INR)
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date string as a readable date-time
 */
export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a timestamp as "time ago" (e.g. "2m ago")
 */
export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/**
 * Truncate a string to maxLen characters with ellipsis
 */
export function truncate(str, maxLen = 60) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
}

/**
 * Get a placeholder image URL for auctions
 */
export function getPlaceholderImage(title = 'Auction') {
  const encoded = encodeURIComponent(title.slice(0, 20));
  // Light-theme placeholder: dark product photo style (dark bg, white text)
  return `https://placehold.co/600x400/1a1a1a/ffffff?text=${encoded}`;
}
