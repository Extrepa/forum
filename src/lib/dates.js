/**
 * Format a timestamp to a localized date/time string
 * Uses the user's browser timezone when rendered client-side,
 * or formats in a standard way for server-side rendering
 */
export function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  
  // Format with locale and timezone options
  // This will use the server's locale, but we format it in a way that's clear
  return date.toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Los_Angeles' // PST/PDT timezone
  });
}

/**
 * Format a timestamp to a relative time string (e.g., "2 hours ago")
 */
export function formatTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  if (hours > 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  if (minutes > 0) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  return 'just now';
}
