/**
 * Time resources for MCP server
 * Provides local and server time information with timezone details
 */

import { ApiClient } from '../api/client.js';

interface TimeInfo {
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

/**
 * Get current local time with timezone information
 */
export function getLocalTime(): TimeInfo {
  const now = new Date();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Get timezone offset in minutes and convert to ±HH:MM format
  const offsetMinutes = now.getTimezoneOffset();
  const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
  const offsetMins = Math.abs(offsetMinutes) % 60;
  const offsetSign = offsetMinutes <= 0 ? '+' : '-';
  const timezone_offset = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMins.toString().padStart(2, '0')}`;
  
  // Format date and time components
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  
  const date = `${year}-${month}-${day}`;
  const time = `${hours}:${minutes}:${seconds}`;
  const datetime = `${date} ${time}`;
  
  return {
    datetime,
    timestamp: Math.floor(now.getTime() / 1000),
    timezone,
    timezone_offset,
    date,
    time,
    iso8601: now.toISOString(),
    utc_datetime: now.toISOString().replace('T', ' ').replace('Z', ''),
    utc_offset_seconds: -offsetMinutes * 60
  };
}

/**
 * Get server time from WordPress site with timezone information
 */
export async function getServerTime(apiClient: ApiClient): Promise<TimeInfo> {
  try {
    // Get site info which includes timezone information
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
      // Use GMT offset if timezone string not available
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
    // Fallback to local time if we can't determine server time
    console.error('Failed to get server time:', error);
    const localTime = getLocalTime();
    return {
      ...localTime,
      timezone: 'Server timezone unavailable (using local time as fallback)'
    };
  }
}