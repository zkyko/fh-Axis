/**
 * Enhanced date formatting with relative timestamps
 * Based on UI-update.md specifications
 * 
 * - Use relative timestamps for recent events: "2 minutes ago"
 * - Show absolute timestamp on hover: "December 5, 2024 at 2:30 PM"
 * - Switch to absolute format after 24 hours: "Dec 4 at 3:45 PM"
 * - Include timezone indicator where relevant
 */

/**
 * Get relative time string (e.g., "2 minutes ago", "5 hours ago")
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return null; // Use absolute format
  }
}

/**
 * Format absolute date with time
 * Format: "December 5, 2024 at 2:30 PM" or "Dec 4 at 3:45 PM"
 */
function formatAbsoluteDate(date: Date, includeYear: boolean = true): string {
  const options: Intl.DateTimeFormatOptions = {
    month: includeYear ? 'long' : 'short',
    day: 'numeric',
    ...(includeYear && { year: 'numeric' }),
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  
  const formatted = date.toLocaleDateString('en-US', options);
  // Convert "December 5, 2024, 2:30 PM" to "December 5, 2024 at 2:30 PM"
  return formatted.replace(', ', ' at ').replace(', ', ', ');
}

/**
 * Format date with relative timestamp for recent events
 * Returns relative time if < 24 hours, otherwise absolute format
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Never';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    // Use relative format if less than 24 hours
    if (diffHours < 24) {
      const relative = getRelativeTime(date);
      if (relative) {
        return relative;
      }
    }
    
    // Use absolute format for older dates
    const includeYear = new Date().getFullYear() !== date.getFullYear();
    return formatAbsoluteDate(date, includeYear);
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format date with full absolute timestamp (for tooltips/hover)
 * Format: "December 5, 2024 at 2:30 PM CST"
 */
export function formatDateFull(dateString: string | null | undefined, includeTimezone: boolean = false): string {
  if (!dateString) return 'Never';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      ...(includeTimezone && { timeZoneName: 'short' }),
    };
    
    const formatted = date.toLocaleDateString('en-US', options);
    return formatted.replace(', ', ' at ').replace(', ', ', ');
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format date without time
 * Format: "Dec 4, 2025"
 */
export function formatDateOnly(dateString: string | null | undefined): string {
  if (!dateString) return 'Never';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format relative timestamp with absolute tooltip
 * Returns an object with display text and tooltip text
 */
export function formatDateWithTooltip(dateString: string | null | undefined): {
  display: string;
  tooltip: string;
} {
  if (!dateString) {
    return { display: 'Never', tooltip: 'Never' };
  }
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return { display: 'Invalid date', tooltip: 'Invalid date' };
    }
    
    const display = formatDate(dateString);
    const tooltip = formatDateFull(dateString, true);
    
    return { display, tooltip };
  } catch {
    return { display: 'Invalid date', tooltip: 'Invalid date' };
  }
}

