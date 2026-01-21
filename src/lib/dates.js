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

/**
 * Check if an event timestamp is in the future
 */
export function isEventUpcoming(timestamp) {
  return timestamp > Date.now();
}

/**
 * Format event date with better formatting
 */
export function formatEventDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((eventDate - today) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'day' : 'days'} ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

/**
 * Format relative event date (for upcoming events)
 */
export function formatRelativeEventDate(timestamp) {
  const now = Date.now();
  const diff = timestamp - now;
  
  if (diff < 0) {
    // Past event
    const absDiff = Math.abs(diff);
    const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    if (weeks < 4) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    return 'Over a year ago';
  } else {
    // Upcoming event
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 7) return `In ${days} ${days === 1 ? 'day' : 'days'}`;
    if (weeks < 4) return `In ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
    if (months < 12) return `In ${months} ${months === 1 ? 'month' : 'months'}`;
    return 'Over a year away';
  }
}

/**
 * Format event time portion
 */
export function formatEventTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Los_Angeles'
  });
}
