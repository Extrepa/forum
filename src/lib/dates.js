/**
 * Format a timestamp to a localized date/time string
 * Uses the user's browser timezone when rendered client-side,
 * or formats in a standard way for server-side rendering
 */
export function formatDateTime(timestamp) {
  // Handle null, undefined, or falsy values
  if (!timestamp) {
    return 'Unknown';
  }
  
  const date = new Date(timestamp);
  
  // Check if date is invalid
  if (isNaN(date.getTime())) {
    return 'Unknown';
  }
  
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
 * Format a timestamp to a date-only string (no time)
 */
export function formatDate(timestamp) {
  // Handle null, undefined, or falsy values
  if (!timestamp) {
    return 'Unknown';
  }
  
  const date = new Date(timestamp);
  
  // Check if date is invalid
  if (isNaN(date.getTime())) {
    return 'Unknown';
  }
  
  // Format date only (no time)
  return date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Los_Angeles' // PST/PDT timezone
  });
}

/**
 * Format a timestamp to a relative time string (e.g., "2 hours ago")
 */
export function formatTimeAgo(timestamp) {
  // Ensure timestamp is a valid number
  const ts = Number(timestamp);
  if (!ts || isNaN(ts) || ts <= 0) {
    return 'just now';
  }
  
  const now = Date.now();
  const diff = now - ts;
  
  // Handle future timestamps or invalid diffs
  if (diff < 0) {
    return 'just now';
  }
  
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
 * Format event date in large, prominent format (Month Day, Year)
 */
export function formatEventDateLarge(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
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
    if (days < 14) return `In ${days} ${days === 1 ? 'day' : 'days'}`;
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

/**
 * Parse a datetime-local string (YYYY-MM-DDTHH:mm) as local time and convert to UTC timestamp.
 * datetime-local inputs send local time strings, but Date.parse() interprets them as UTC.
 * This function explicitly parses as local time and returns UTC timestamp for storage.
 * 
 * @param {string} localDateTimeString - String in format "YYYY-MM-DDTHH:mm" (local time)
 * @returns {number|null} - UTC timestamp in milliseconds, or null if invalid
 */
export function parseLocalDateTimeToUTC(localDateTimeString) {
  if (!localDateTimeString || typeof localDateTimeString !== 'string') {
    return null;
  }
  const trimmed = localDateTimeString.trim();
  if (!trimmed) return null;
  
  // datetime-local format: "YYYY-MM-DDTHH:mm"
  const [datePart, timePart] = trimmed.split('T');
  if (!datePart || !timePart) return null;
  
  // Validate time format has both hours and minutes
  const timeParts = timePart.split(':');
  if (timeParts.length !== 2) return null;
  
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timeParts.map(Number);
  
  // Validate parsed values (check for undefined as well as NaN)
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day) || 
      Number.isNaN(hours) || Number.isNaN(minutes) ||
      hours === undefined || minutes === undefined) {
    return null;
  }
  
  // Create date in local timezone
  // Note: month is 0-indexed in Date constructor
  const localDate = new Date(year, month - 1, day, hours, minutes || 0, 0, 0);
  
  // Validate the date is valid
  if (Number.isNaN(localDate.getTime())) {
    return null;
  }
  
  // Return UTC timestamp (milliseconds since epoch)
  return localDate.getTime();
}

function partsToNumberMap(parts) {
  return parts.reduce((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = Number(part.value);
    }
    return acc;
  }, {});
}

function getTimeZoneOffsetMs(timestamp, timeZone) {
  const date = new Date(timestamp);
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = partsToNumberMap(dtf.formatToParts(date));
  const asUtc = Date.UTC(
    parts.year,
    (parts.month || 1) - 1,
    parts.day || 1,
    parts.hour || 0,
    parts.minute || 0,
    parts.second || 0,
    0
  );
  return asUtc - date.getTime();
}

function zonedDateTimeToUtcMs({ year, month, day, hour = 0, minute = 0, second = 0, millisecond = 0 }, timeZone) {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
  const offset1 = getTimeZoneOffsetMs(utcGuess, timeZone);
  const corrected = utcGuess - offset1;
  const offset2 = getTimeZoneOffsetMs(corrected, timeZone);
  if (offset2 !== offset1) {
    return utcGuess - offset2;
  }
  return corrected;
}

/**
 * Returns the UTC timestamp for the end of the calendar day of an event in the forum timezone.
 * This keeps events "open" through 11:59:59 PM local forum time.
 */
export function getEventDayCompletionTimestamp(timestamp, timeZone = 'America/Los_Angeles') {
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || ts <= 0) {
    return 0;
  }
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) {
    return 0;
  }

  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = partsToNumberMap(dtf.formatToParts(date));
  if (!parts.year || !parts.month || !parts.day) {
    return 0;
  }

  return zonedDateTimeToUtcMs(
    {
      year: parts.year,
      month: parts.month,
      day: parts.day,
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 999,
    },
    timeZone
  );
}
