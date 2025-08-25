/**
 * Time utilities for formatting dates and times
 */

export interface TimeInfo {
  datetime: string;
  timestamp: number;
  timezone: string;
  timezone_offset: string;
  date: string;
  time: string;
  iso8601: string;
  utc_datetime: string;
  utc_offset_seconds: number;
}

import type { ApiClient } from '../api/client.js';
import * as chrono from 'chrono-node';
import { getLogger } from './logger.js';

/**
 * Get current local time information
 */
export function getLocalTimeInfo(): TimeInfo {
  const now = new Date();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offset = -now.getTimezoneOffset();
  const offsetHours = Math.floor(Math.abs(offset) / 60);
  const offsetMinutes = Math.abs(offset) % 60;
  const offsetSign = offset >= 0 ? '+' : '-';
  const timezoneOffset = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;

  // Format current datetime
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return {
    datetime: `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`,
    timestamp: Math.floor(now.getTime() / 1000),
    timezone,
    timezone_offset: timezoneOffset,
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}:${seconds}`,
    iso8601: now.toISOString(),
    utc_datetime: now.toISOString().replace('T', ' ').replace('Z', ''),
    utc_offset_seconds: offset * 60,
  };
}

/**
 * Get WordPress server time information with timezone details.
 */
export async function getServerTimeInfo(apiClient: ApiClient): Promise<TimeInfo> {
  try {
    const siteInfo = await apiClient.getSiteInfo();
    const serverDate = new Date();

    let timezone = 'UTC';
    let timezone_offset = '+00:00';

    if (siteInfo?.timezone_string) {
      timezone = siteInfo.timezone_string;

      // Calculate offset for the server timezone
      const serverTz = new Date().toLocaleString('en-US', { timeZone: timezone });
      const serverTime = new Date(serverTz);
      const utcTime = new Date(serverDate.toISOString());
      const offsetMs = serverTime.getTime() - utcTime.getTime();
      const offsetMinutes = Math.round(offsetMs / 60000);
      const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
      const offsetMins = Math.abs(offsetMinutes) % 60;
      const offsetSign = offsetMinutes >= 0 ? '+' : '-';
      timezone_offset = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMins.toString().padStart(2, '0')}`;
    } else if (siteInfo?.gmt_offset !== undefined) {
      const offset = parseFloat(siteInfo.gmt_offset);
      const offsetHours = Math.floor(Math.abs(offset));
      const offsetMins = Math.round((Math.abs(offset) - offsetHours) * 60);
      const offsetSign = offset >= 0 ? '+' : '-';
      timezone_offset = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMins.toString().padStart(2, '0')}`;
      timezone = `GMT${timezone_offset}`;
    }

    // Format server time
    const serverDateFormatted = serverDate.toLocaleString('en-US', {
      timeZone: timezone === 'UTC' ? 'UTC' : timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const [datePart, timePart] = serverDateFormatted.split(', ');
    const [month, day, year] = datePart.split('/');
    const date = `${year}-${month}-${day}`;
    const time = timePart;
    const datetime = `${date} ${time}`;

    return {
      datetime,
      timestamp: Math.floor(serverDate.getTime() / 1000),
      timezone,
      timezone_offset,
      date,
      time,
      iso8601: serverDate.toISOString(),
      utc_datetime: serverDate.toISOString().replace('T', ' ').replace('Z', ''),
      utc_offset_seconds: siteInfo?.gmt_offset ? parseFloat(siteInfo.gmt_offset) * 3600 : 0
    };
  } catch (error) {
    getLogger().warn('Failed to get server time, using local time as fallback:', error);
    const localTime = getLocalTimeInfo();
    return {
      ...localTime,
      timezone: 'Server timezone unavailable (using local time as fallback)'
    };
  }
}

/**
 * Format a Date object as YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a Date object as YYYY-MM-DD HH:MM:SS
 */
export function formatDateTime(date: Date): string {
  const dateStr = formatDate(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}:${seconds}`;
}

/**
 * Parse a variety of flexible date strings into a Date object where possible.
 * Supports:
 * - Preferred formats: "YYYY-MM-DD HH:MM:SS" and ISO with `T`.
 * - Relative formats like "+2 days", "+3 hours".
 * - "tomorrow", "today" (optionally with time).
 * - "next <weekday>" optionally with a time (e.g., "next monday 9am").
 * Returns null when parsing is not possible.
 */
export function parseFlexibleDate(input: string): Date | null {
  if (!input || typeof input !== 'string') return null;
  const s = input.trim();

  // Prefer chrono for natural language and common formats.
  try {
    // Use casual parser for broad phrases like "next monday 9am", "tomorrow 2pm", "+2 days".
    const d = chrono.casual.parseDate(s, new Date(), { forwardDate: true });
    if (d && Number.isFinite(d.getTime())) return d;
  } catch {
    // ignore and fall back
  }

  // Try strict parser as a fallback.
  try {
    const results = chrono.parse(s);
    if (results && results.length > 0) {
      const d = results[0].date();
      if (Number.isFinite(d.getTime())) return d;
    }
  } catch {
    // ignore
  }

  // Try ISO/Date constructor last.
  const isoLike = s.replace(' ', 'T').replace('Z', '');
  const tryIso = new Date(isoLike);
  if (Number.isFinite(tryIso.getTime())) return tryIso;

  const fallback = new Date(s);
  if (Number.isFinite(fallback.getTime())) return fallback;

  return null;
}

/**
 * Get date offsets for common use cases
 */
export function getDateOffsets() {
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  return {
    today: formatDate(now),
    tomorrow: formatDate(tomorrow),
    nextWeek: formatDate(nextWeek),
    todayAt3pm: `${formatDate(now)} 15:00:00`,
    tomorrowAt10am: `${formatDate(tomorrow)} 10:00:00`,
  };
}