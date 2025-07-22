import { z } from 'zod';
import { ApiClient } from '../api/client.js';
import { getLocalTime, getServerTime } from '../resources/time.js';
import { formatError } from '../utils/error-handling.js';

/**
 * Schema for datetime tool input (no input required)
 */
export const DateTimeSchema = z.object({});

/**
 * Input shape for MCP SDK
 */
export const DateTimeInputSchema = {};

/**
 * Get current date/time information
 */
export async function getCurrentDateTime(
  _input: z.infer<typeof DateTimeSchema>,
  apiClient: ApiClient
) {
  try {
    // Get both local and server time
    const localTime = getLocalTime();
    const serverTime = await getServerTime(apiClient);

    const result = {
      local: localTime,
      server: serverTime,
      usage_hints: {
        date_format: "YYYY-MM-DD HH:MM:SS",
        example_event_dates: {
          today_3pm: `${localTime.date} 15:00:00`,
          tomorrow_10am: `${new Date(Date.now() + 86400000).toISOString().split('T')[0]} 10:00:00`,
          next_week: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
        }
      }
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: `Current Date/Time Information:
          
Local Time: ${localTime.datetime} (${localTime.timezone})
Server Time: ${serverTime.datetime} (${serverTime.timezone})

Use local time for creating events relative to user's timezone.
Use server time when you need WordPress server context.`,
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [formatError(error)],
      isError: true,
    };
  }
}

/**
 * JSON Schema for datetime tool
 */
export const DateTimeJsonSchema = {
  type: 'object' as const,
  properties: {},
  additionalProperties: false
};

/**
 * Tool definition for datetime
 */
export const dateTimeTool = {
  name: 'calendar_current_datetime',
  description: `Get current date and time information for both local and WordPress server timezones.

⚠️ CRITICAL: You MUST call this tool BEFORE:
- Creating any events (to calculate proper dates)
- Filtering events by date (to know what "today", "this week", etc. means)
- Any operation involving dates or times

This tool returns:
- Local time (user's timezone) - use for creating events
- Server time (WordPress timezone) - use for server context
- Helpful date format examples

Example response includes formatted dates for "today at 3pm", "tomorrow at 10am", etc.`,
  inputSchema: DateTimeInputSchema,
  jsonSchema: DateTimeJsonSchema,
};