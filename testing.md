# **Improved Usage Testing Plan for MCP Server**

## **Pre-Test Setup (Critical Addition)**

### 0. Environment Validation

- **Lando Environment:** The tests will be conducted on a WordPress instance running in a Lando environment. This allows us to activate and deactivate plugins as needed to simulate various configurations.
- **Check Active Plugins**: First, verify which plugins are active using the **MCP server**.

> Use tec-calendar-read-entities to check what plugins are available by testing endpoints.

- **Document Plugin Configuration**: Note which plugins are active as this affects available functionality. We can use the `lando wp plugin list` command to see the full list of installed plugins and their status.
  - **TEC (The Events Calendar)**: Base functionality - events, venues, organizers
  - **ECP (Events Pro)**: Multiple venues per event, recurring events, additional views
  - **ET (Event Tickets)**: Ticket functionality
  - **ETP (Event Tickets Plus)**: Advanced ticket features. Woocommerce integration.

---

## **Enhanced Test Structure**

### Test 1: Plugin Capability Discovery

1. **Discover Available Functionality**: **All interactions must be through the MCP server.** Query the MCP server to understand what endpoints/features are available.
2. **Test Basic Connectivity**: Verify the MCP server responds correctly to basic requests.
3. **Document Limitations**: Based on active plugins, note what functionality should/shouldn't be available.

### Test 2: Venue and Organizer Management** *(Enhanced)*

1. **Create Venues and Organizers** *(same as original)*
2. **Test Venue Limitations**:
    - **Scenario: ECP is NOT active**: Use `lando wp plugin deactivate events-calendar-pro` if it's active. Test that attempting to assign multiple venues to an event via the **MCP** either fails gracefully or only uses the first venue.
    - **Scenario: ECP IS active**: Use `lando wp plugin activate events-calendar-pro`. Test that multiple venue assignment works correctly via the **MCP**.
3. **Edit Venues and Organizers** *(same as original)*
4. **Test Edge Cases**:
    - Create a venue/organizer with minimal data.
    - Create a venue/organizer with maximum data (all fields populated).
    - Test special characters and unicode in names/addresses.
5. **Delete Venues and Organizers** *(enhanced)*
    - Verify deletion fails gracefully via the **MCP** if a venue/organizer is assigned to existing events.
    - Test force deletion if supported.

### Test 3: Event Management *(Significantly Enhanced)*

#### 3a. Basic Event Creation

1. **Single Associations** *(same as original)*
2. **Test Venue Assignment Based on Plugin State**:
    - **Scenario: ECP is active**: Test multiple venues via the **MCP** (should work).
    - **Scenario: ECP is NOT active**: Test multiple venues via the **MCP** (should fail gracefully or use the first venue only).
3. **Test Organizer Assignment**:
    - Multiple organizers should work regardless of ECP status.
4. **No Associations** *(same as original)*

#### 3b. Advanced Event Creation

1. **Date and Time Variations**:
    - All-day events
    - Multi-day events
    - Events with different timezone handling
2. **Content Variations**:
    - Events with minimal content
    - Events with rich content (HTML in description)
    - Events with special characters

#### 3c. Event Editing

1. **Basic Edits** *(same as original)*
2. **Association Changes**:
    - Add venues (test plugin limitations).
    - Remove venues (test that `venues: []` properly removes).
    - Add/remove organizers (test that `organizers: []` properly removes).
3. **Date/Time Changes**:
    - Change start/end times.
    - Convert all-day to a timed event and vice versa.

### Test 4: Ticket Management *(Plugin-Dependent)*

#### 4a. Pre-Ticket Tests

1. **Verify ET Plugin Status**: Test if ticket endpoints are available. We can use `lando wp plugin is-active event-tickets` to check the status.
2. **Skip Section If No ET**: If Event Tickets is not active, skip this entire section with appropriate messaging.

#### 4b. Ticket Creation *(if ET is active)*

1. **Single Ticket Type** *(same as original)*
2. **Multiple Ticket Types** *(same as original)*
3. **Ticket Variations**:
    - Free tickets (price = 0)
    - Paid tickets
    - Limited quantity tickets
    - Unlimited tickets

#### 4c. Ticket Editing *(if ET is active)*

1. **Price and Quantity Changes** *(same as original)*
2. **Add/Remove Ticket Types** *(same as original)*
3. **Advanced Ticket Features** *(if ETP is active)*:
    - **Scenario: ETP is active**: Use `lando wp plugin activate event-tickets-plus`. Test any ETP-specific features available via **MCP**.

---

## **Enhanced Error Handling and Reporting**

### Failure Documentation

1. **Plugin State Context**: Include which plugins were active when the failure occurred.
2. **Expected vs. Actual Behavior**: Document whether the failure was due to missing plugin functionality vs. actual bugs.
3. **Graceful Degradation**: Note if the API handled missing functionality gracefully or threw errors.
4. **API Response Analysis**: Include the full API response, not just error messages.

### Success Criteria

- All tests pass that should work with the current plugin configuration.
- Tests that should fail due to missing plugins fail gracefully with appropriate error messages.
- No unexpected errors or crashes occur.

---

## **Test Execution Strategy**

### Sequential Execution with Branching

- Execute tests in order but branch based on plugin availability, using Lando commands to manage the plugins.
- If a test fails due to missing plugin functionality, mark it as "SKIPPED - Plugin Not Active" rather than "FAILED".
- Only mark as "FAILED" if functionality should work with the current plugins but doesn't.

### Data Persistence Testing

- **All tests must use the MCP server as the primary interface.**
- After each CRUD operation, verify the change persisted by reading the entity back **through the MCP**.
- If a discrepancy is found, a secondary check can be performed using another method (e.g., `wp-cli` or direct database query) for diagnostic purposes only. The failure is still considered a failure of the MCP interaction.
- Test that relationships (event-venue, event-organizer) are properly maintained.

---

## **Enhanced Error Handling and Edge Case Testing**

**Test 5: Invalid Entity Testing** *(Critical for Production)*

**5a. Invalid IDs and Error Responses:**

1. **Invalid Venue Updates**:
   - Test updating non-existent venue ID (e.g., 99999) → Should return **HTTP 403/404**
   - Test updating wrong post type as venue (e.g., regular post ID 1) → Should return **HTTP 404**
   - Test updating with malformed venue ID (e.g., "invalid") → Should return appropriate error

2. **Invalid Organizer Updates**:
   - Test updating non-existent organizer ID → Should return **HTTP 403/404**
   - Test updating wrong post type as organizer → Should return **HTTP 404**

3. **Invalid Event Operations**:
   - Test creating event with non-existent venue IDs → Should handle gracefully
   - Test creating event with mix of valid/invalid venue IDs → Should filter invalid ones
   - Test updating event with invalid venue/organizer IDs → Should return appropriate errors

**5b. Malformed Data Testing:**

1. **Invalid Field Values**:
   - Test venue creation with invalid phone format
   - Test organizer creation with invalid email format
   - Test event creation with invalid date formats
   - Test events with invalid timezone values

2. **Missing Required Fields**:
   - Test creating entities without required fields → Should return **HTTP 400** with field validation errors
   - Test updating with empty required fields → Should handle appropriately

**5c. Boundary and Limit Testing:**

1. **Large Data Sets**:
   - Test events with maximum number of venues (when ECP active)
   - Test events with very long titles, descriptions
   - Test venues with very long addresses

2. **Special Characters and Encoding**:
   - Test entity names with unicode characters
   - Test addresses with special characters
   - Test HTML in description fields

**Expected HTTP Response Codes:**

- **200**: Successful read/update operations
- **201**: Successful create operations
- **400**: Bad request (validation errors, malformed data)
- **403**: Forbidden (insufficient permissions, policy violations)
- **404**: Not found (entity doesn't exist, wrong post type)
- **500**: Server error (should NOT occur in production - indicates bug)

**Error Response Format Testing:**

- Verify error responses include helpful error messages
- Test that error responses are properly formatted JSON
- Ensure sensitive information is not exposed in error messages

**Production Readiness Criteria:**

- **NO 500 errors** should occur during normal operations
- All error responses should be meaningful and actionable
- Edge cases should be handled gracefully without crashes
- Invalid data should be rejected with appropriate HTTP status codes

---

## **Specific Test Cases Based on Debugging Experience**

**Critical Regression Tests:**

1. **Multiple Venue Storage Validation**:
   - **ECP Active**: Create event with `venues: [413, 414]` → Verify both venues stored as separate database entries
   - **ECP Inactive**: Create event with `venues: [413, 414]` → Verify only first venue (413) stored as integer in database
   - Check database storage: `SELECT meta_value FROM wp_postmeta WHERE meta_key = '_EventVenueID'`

2. **Update Entity Response Validation**:
   - Update any venue → Should return HTTP 200 with updated venue data
   - Update any organizer → Should return HTTP 200 with updated organizer data
   - **Critical**: NO 500 errors should occur during updates

3. **Invalid Entity ID Testing**:
   - Update venue ID 1 (Hello World post) → Should return HTTP 404
   - Update venue ID 99999 (non-existent) → Should return HTTP 403
   - Update venue ID "invalid" → Should return appropriate validation error

4. **Occurrence ID vs Post ID Validation** *(Critical ECP Fix)*:
   - **Test Objective**: Verify that the MCP server returns real database post IDs, not occurrence IDs
   - **Background**: Events Pro uses "provisional IDs" (occurrence IDs) for recurring events that start around 10000000. These must be transformed to real post IDs for proper database relationships.

   **4a. Event Creation ID Validation**:
   - Create any event → Response `id` field should be a normal post ID (typically < 10000)
   - **Red Flag**: If `id` is > 10000000, this indicates occurrence ID is being returned instead of post ID
   - Verify `occurrence_id` field is present when occurrence ID transformation occurs
   - **Expected Response Format**:

     ```json
     {
       "id": 593,                    // Real post ID (low number)
       "occurrence_id": 10000178,    // Occurrence ID (high number, if applicable)
       "title": {...}
     }
     ```

   **4b. Ticket Association Validation**:
   - Create event → Note the returned `id` (should be real post ID)
   - Create ticket for that event using the `id` from step 1
   - Verify ticket's `event_id` field matches the event's real post ID
   - **Red Flag**: If ticket creation fails due to "event not found", this indicates occurrence ID was used instead of post ID

   **4c. Database Consistency Check**:
   - After event creation, verify the `id` returned by MCP matches the actual post ID in `wp_posts` table
   - Query: `SELECT ID FROM wp_posts WHERE post_type = 'tribe_events' ORDER BY ID DESC LIMIT 1`
   - The returned ID should match the `id` field from the MCP response

   **4d. Cross-Plugin Compatibility**:
   - Test with ECP (Events Pro) active and inactive
   - **ECP Active**: Occurrence ID transformation should work (transforms 10000XXX → real ID)
   - **ECP Inactive**: Should return real post IDs directly (no transformation needed)
   - Both scenarios should result in proper post IDs being returned

**Database Consistency Checks:**

- After venue updates, verify `modified` timestamp changes
- After event creation with venues, verify `_EventVenueID` meta is correctly formatted
- After ECP plugin state changes, verify venue storage format adapts correctly

**Debug Log Monitoring:**

- Monitor `wp-content/debug.log` during all operations
- **Critical**: No PHP Fatal Errors should appear in logs
- PHP Warnings about use statements are acceptable (legacy code issue)
- Any TypeError or array_keys() errors indicate regression

**Occurrence ID Transformation Debug Monitoring:**

- When ECP is active, monitor logs for occurrence ID transformation messages:
  - Look for: `Pro_Extension::filter_event_transform_entity called with ID: 10000XXX`
  - Look for: `Pro_Extension: Transformed ID 10000XXX to real post ID: XXX`
- **Red Flag**: If transformation messages appear but MCP still returns occurrence IDs, the filter chain is broken
- **Red Flag**: If no transformation messages appear but events have occurrence IDs, the filter isn't being called

**Cross-Plugin Compatibility:**

- Test with Event Tickets (ET) activated and deactivated
- Test with Events Pro (ECP) activated and deactivated
- Verify no conflicts between common submodule versions
- Test venue operations work regardless of ET plugin state

---

## **Test 6: Date Normalization Testing** *(Critical for Natural Language Support)*

**6a. Event Date Normalization:**

1. **Natural Language Event Creation**:
   - Test creating event with `start_date: "Friday 6pm"` → Repository should normalize to proper MySQL datetime
   - Test creating event with `start_date: "tomorrow 2pm"` → Should calculate correct future date
   - Test creating event with `start_date: "next Monday"` → Should handle week calculations
   - Test creating event with `start_date: "+3 days 10am"` → Should handle relative date arithmetic

2. **Standard Format Preservation**:
   - Test creating event with `start_date: "2025-08-15 18:00:00"` → Should preserve exact format
   - Test creating event with `start_date: "2025-08-15T18:00:00"` → Repository should normalize ISO format
   - Test creating event with `start_date: "August 15, 2025 6:00 PM"` → Should parse descriptive format

**6b. Ticket Date Normalization Testing** *(if ET is active)*:

1. **Basic Ticket Date Normalization**:
   - Create ticket with `start_date: "now"` → Should use current timestamp
   - Create ticket with `start_date: "today"` → Should use current day start (00:00:00)
   - Create ticket with `end_date: "today 11:59pm"` → Should use current day end
   - Create ticket with `start_date: "+1 day"` → Should calculate tomorrow's date
   - Create ticket with `end_date: "+2 days 4pm"` → Should handle multi-day relative dates

2. **Complex Natural Language Patterns**:
   - Create ticket with `start_date: "Friday 5:30 PM"` → Should handle named days with precise times
   - Create ticket with `end_date: "+1 day 18:00"` → Should combine relative dates with 24-hour times
   - Create ticket with `start_date: "tomorrow 10am"` → Should handle AM/PM with relative dates

3. **Sale Price Date Normalization**:
   - Create ticket with sale pricing using natural language dates:
            ```json
            {
            "price": 50,
            "sale_price": 35,
            "sale_price_start_date": "today",
            "sale_price_end_date": "+2 days 11:59pm"
            }
            ```
   - Verify all 4 date fields are properly normalized:
     - `start_date`, `end_date`, `sale_price_start_date`, `sale_price_end_date`

**6c. Comprehensive Date Format Coverage**:

Test all supported natural language formats:

| Input Format | Expected Behavior | Example |
|--------------|-------------------|---------|
| `"now"` | Current timestamp | `"2025-08-12 21:20:55"` |
| `"today"` | Current day start | `"2025-08-12 00:00:00"` |
| `"tomorrow"` | Next day start | `"2025-08-13 00:00:00"` |
| `"Friday"` | Next Friday | `"2025-08-15 00:00:00"` |
| `"+1 day"` | Tomorrow same time | `"2025-08-13 21:20:55"` |
| `"+2 days 10am"` | Day after tomorrow 10 AM | `"2025-08-14 10:00:00"` |
| `"Friday 6pm"` | Next Friday 6 PM | `"2025-08-15 18:00:00"` |
| `"today 11:59pm"` | Current day end | `"2025-08-12 23:59:00"` |

**6d. Date Normalization Error Handling**:

1. **Invalid Natural Language**:
   - Test with invalid strings like `"invalid date"` → Should handle gracefully
   - Test with empty strings `""` → Should not cause errors
   - Test with null values → Should handle appropriately

2. **Edge Cases**:
   - Test timezone handling with natural language dates
   - Test date normalization near daylight saving time transitions
   - Test with dates far in the future/past

**6e. Database Consistency Verification**:

1. **Verify Normalized Storage**:
   - After creating tickets with natural language dates, verify database storage shows MySQL format
   - Check that `_ticket_start_date` and `_ticket_end_date` meta fields contain normalized dates
   - Ensure sale price date fields are also properly normalized in database

2. **API Response Consistency**:
   - Verify that MCP read operations return the normalized dates
   - Check that ticket availability calculations work correctly with normalized dates
   - Ensure natural language dates are converted, not stored literally

**Expected Date Normalization Results:**

- **All natural language dates should be converted to MySQL datetime format (`Y-m-d H:i:s`)**
- **Standard formats should be preserved or normalized consistently**
- **Timezone handling should be respected throughout normalization**
- **No date parsing errors should appear in debug logs**
- **Ticket availability should work correctly with normalized dates**

**Production Readiness Criteria for Date Normalization:**

- **NO date parsing errors** should occur during normal operations
- All natural language dates should be successfully converted to database format
- Date normalization should work consistently across all creation pathways (REST API, ORM, legacy)
- Sale price date fields should be normalized with same reliability as basic date fields
- Timezone conversions should be handled properly throughout the normalization process

**Architecture Verification:**

1. **Repository-Level Processing**: Verify date normalization occurs at the repository level for all data sources
2. **Centralized Logic**: Confirm all date processing uses the centralized `Ticket::normalize_date_text_to_mysql()` method
3. **Multiple Pathway Coverage**: Test that MCP, REST API, admin UI, and ORM-based creation all normalize dates consistently
4. **No Regression**: Ensure standard date formats continue to work after natural language support is added

---

## **Technical Implementation Notes for Occurrence ID Fix**

**Root Cause (Fixed):**
The issue was in the REST API entity transformation pipeline where the `With_Transform_Organizers_And_Venues` trait was overriding the `transform_entity()` method without calling the parent method that applies occurrence ID transformation filters.

**Files Modified:**

1. **Events Pro Extension** (`events-pro/src/Events_Pro/REST/TEC/V1/Pro_Extension.php`)
   - Updated `filter_event_transform_entity()` method to replace occurrence IDs with real post IDs
   - Added priority 5 to ensure it runs before other transforms
   - Preserves occurrence ID in `occurrence_id` field for reference

2. **TEC Transform Trait** (`the-events-calendar/src/Events/REST/TEC/V1/Traits/With_Transform_Organizers_And_Venues.php`)
   - Modified `transform_entity()` to call `parent::transform_entity()` first
   - This ensures all filters (including occurrence ID transformation) are applied before venue/organizer transformations

**Filter Chain:**

1. `Post_Entity_Endpoint::transform_entity()` applies filters
2. `tec_rest_v1_tribe_events_transform_entity` filter transforms occurrence IDs
3. `With_Transform_Organizers_And_Venues::transform_entity()` handles venue/organizer formatting

**Testing Commands for Manual Verification:**

```bash
# Check if Pro_Extension filter is working
tail -f wp-content/debug.log | grep "Pro_Extension"

# Verify real post IDs in database
wp db query "SELECT ID, post_type FROM wp_posts WHERE post_type = 'tribe_events' ORDER BY ID DESC LIMIT 5"

# Check event-ticket relationships
wp db query "SELECT post_id, meta_key, meta_value FROM wp_postmeta WHERE meta_key LIKE '%event%' ORDER BY post_id DESC LIMIT 10"
```

**Regression Prevention:**

- Any future modifications to `transform_entity()` methods must ensure parent method is called
- Filter priority changes should be tested to ensure occurrence ID transformation happens before other transforms
- Both ECP active/inactive scenarios must be tested when making REST API changes

---

## **Technical Implementation Notes for Date Normalization**

**Root Challenge:**
Natural language date strings (like "tomorrow 10am", "+1 day", "Friday 6pm") needed consistent normalization across all input sources (MCP, REST API, admin UI) to ensure reliable database storage and functionality.

**Solution Architecture:**
Implemented centralized date normalization at the repository level to ensure all ticket creation pathways properly handle natural language dates.

**Files Modified:**

1. **Ticket Commerce Class** (`event-tickets/src/Tickets/Commerce/Ticket.php`)
   - Added centralized `normalize_date_text_to_mysql()` static method using `Date_I18n`
   - Updated `save()` method to normalize `start_date` and `end_date` fields
   - Updated `process_sale_price_dates()` method to normalize sale price date fields
   - Added `Date_I18n` import for timezone-aware date processing

2. **Tickets Repository** (`event-tickets/src/Tickets/Commerce/Repositories/Tickets_Repository.php`)
   - Added `normalize_date_field()` protected method for field-specific normalization
   - Overrode `set()` method to intercept and normalize date fields before storage
   - Covers all date fields: `start_date`, `end_date`, `sale_price_start_date`, `sale_price_end_date`

3. **REST API Endpoints Cleanup**
   - Removed duplicate `normalize_date_text_to_mysql()` methods from both `Tickets.php` and `Ticket.php` endpoints
   - Removed unused `Date_I18n` imports from REST endpoints

4. **MCP Server** (`mcp-server/src/tools/create-update.ts`)
   - Simplified to pass all date values through unchanged to WordPress
   - Removed redundant date normalization logic to avoid conflicts with repository layer
   - Date processing now handled entirely by WordPress repository layer

**Date Processing Flow:**

1. **MCP Server**: Passes all date values through unchanged (no normalization)
2. **Repository Layer**: Intercepts all `set()` operations and normalizes date fields using centralized method
3. **Ticket Class**: Provides centralized normalization logic and handles legacy save operations
4. **Database Storage**: All dates stored in consistent MySQL datetime format (`Y-m-d H:i:s`)

**Supported Natural Language Formats:**

- **Temporal**: `"now"`, `"today"`, `"tomorrow"`
- **Relative**: `"+1 day"`, `"+2 days 10am"`, `"-1 week"`
- **Named Days**: `"Friday"`, `"Monday 6pm"`, `"next Tuesday"`
- **Complex**: `"Friday 5:30 PM"`, `"tomorrow 11:59pm"`, `"+3 days 2:15pm"`

**Normalization Process:**

1. **Input Validation**: Check if value is string and non-empty
2. **Format Detection**: Detect if already in MySQL format (`YYYY-MM-DD HH:MM:SS`)
3. **Natural Language Processing**: Use WordPress `Date_I18n` class with timezone awareness
4. **Fallback Handling**: Return original value if normalization fails
5. **Consistent Output**: Always return MySQL datetime format or original value

**Testing Commands for Manual Verification:**

```bash
# Test natural language date processing
wp post meta get TICKET_ID _ticket_start_date
wp post meta get TICKET_ID _ticket_end_date

# Verify database consistency
wp db query "SELECT post_id, meta_key, meta_value FROM wp_postmeta WHERE meta_key LIKE '_ticket_%_date' ORDER BY post_id DESC LIMIT 10"

# Check for date parsing errors
tail -f wp-content/debug.log | grep -i "date\|time"
```

**Architecture Benefits:**

1. **Single Source of Truth**: Centralized normalization in `Ticket::normalize_date_text_to_mysql()`
2. **Complete Coverage**: Handles REST API, ORM, and legacy creation pathways
3. **Backward Compatibility**: Standard date formats continue to work unchanged
4. **Repository Pattern**: Date normalization occurs at data layer, not presentation layer
5. **Timezone Awareness**: Uses WordPress timezone settings for consistent processing

**Regression Prevention:**

- Any modifications to ticket creation must preserve the repository-level date normalization
- Changes to `Tickets_Repository::set()` method must maintain date field processing
- Updates to `Ticket::normalize_date_text_to_mysql()` should be tested across all creation pathways
- New date fields added to tickets should be included in normalization logic
