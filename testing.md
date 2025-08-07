---

### **Improved Usage Testing Plan for MCP Server**

### **Pre-Test Setup (Critical Addition)**

**0. Environment Validation:**
- **Lando Environment:** The tests will be conducted on a WordPress instance running in a Lando environment. This allows us to activate and deactivate plugins as needed to simulate various configurations.
- **Check Active Plugins**: First, verify which plugins are active using the **MCP server**.
  ```
  Use tec-calendar-read-entities to check what plugins are available by testing endpoints.
  ```
- **Document Plugin Configuration**: Note which plugins are active as this affects available functionality. We can use the `lando wp plugin list` command to see the full list of installed plugins and their status.
  - **TEC (The Events Calendar)**: Base functionality - events, venues, organizers
  - **ECP (Events Pro)**: Multiple venues per event, recurring events, additional views
  - **ET (Event Tickets)**: Ticket functionality
  - **ETP (Event Tickets Plus)**: Advanced ticket features. Woocommerce integration.

---

### **Enhanced Test Structure**

**Test 1: Plugin Capability Discovery**
1.  **Discover Available Functionality**: **All interactions must be through the MCP server.** Query the MCP server to understand what endpoints/features are available.
2.  **Test Basic Connectivity**: Verify the MCP server responds correctly to basic requests.
3.  **Document Limitations**: Based on active plugins, note what functionality should/shouldn't be available.

**Test 2: Venue and Organizer Management** *(Enhanced)*
1.  **Create Venues and Organizers** *(same as original)*
2.  **Test Venue Limitations**:
    - **Scenario: ECP is NOT active**: Use `lando wp plugin deactivate events-calendar-pro` if it's active. Test that attempting to assign multiple venues to an event via the **MCP** either fails gracefully or only uses the first venue.
    - **Scenario: ECP IS active**: Use `lando wp plugin activate events-calendar-pro`. Test that multiple venue assignment works correctly via the **MCP**.
3.  **Edit Venues and Organizers** *(same as original)*
4.  **Test Edge Cases**:
    - Create a venue/organizer with minimal data.
    - Create a venue/organizer with maximum data (all fields populated).
    - Test special characters and unicode in names/addresses.
5.  **Delete Venues and Organizers** *(enhanced)*
    - Verify deletion fails gracefully via the **MCP** if a venue/organizer is assigned to existing events.
    - Test force deletion if supported.

**Test 3: Event Management** *(Significantly Enhanced)*

**3a. Basic Event Creation:**
1.  **Single Associations** *(same as original)*
2.  **Test Venue Assignment Based on Plugin State**:
    - **Scenario: ECP is active**: Test multiple venues via the **MCP** (should work).
    - **Scenario: ECP is NOT active**: Test multiple venues via the **MCP** (should fail gracefully or use the first venue only).
3.  **Test Organizer Assignment**:
    - Multiple organizers should work regardless of ECP status.
4.  **No Associations** *(same as original)*

**3b. Advanced Event Creation:**
1.  **Date and Time Variations**:
    - All-day events
    - Multi-day events
    - Events with different timezone handling
2.  **Content Variations**:
    - Events with minimal content
    - Events with rich content (HTML in description)
    - Events with special characters

**3c. Event Editing:**
1.  **Basic Edits** *(same as original)*
2.  **Association Changes**:
    - Add venues (test plugin limitations).
    - Remove venues (test that `venues: []` properly removes).
    - Add/remove organizers (test that `organizers: []` properly removes).
3.  **Date/Time Changes**:
    - Change start/end times.
    - Convert all-day to a timed event and vice versa.

**Test 4: Ticket Management** *(Plugin-Dependent)*

**4a. Pre-Ticket Tests:**
1.  **Verify ET Plugin Status**: Test if ticket endpoints are available. We can use `lando wp plugin is-active event-tickets` to check the status.
2.  **Skip Section If No ET**: If Event Tickets is not active, skip this entire section with appropriate messaging.

**4b. Ticket Creation** *(if ET is active)*:
1.  **Single Ticket Type** *(same as original)*
2.  **Multiple Ticket Types** *(same as original)*
3.  **Ticket Variations**:
    - Free tickets (price = 0)
    - Paid tickets
    - Limited quantity tickets
    - Unlimited tickets

**4c. Ticket Editing** *(if ET is active)*:
1.  **Price and Quantity Changes** *(same as original)*
2.  **Add/Remove Ticket Types** *(same as original)*
3.  **Advanced Ticket Features** *(if ETP is active)*:
    - **Scenario: ETP is active**: Use `lando wp plugin activate event-tickets-plus`. Test any ETP-specific features available via **MCP**.

---

### **Enhanced Error Handling and Reporting**

**Failure Documentation:**
1.  **Plugin State Context**: Include which plugins were active when the failure occurred.
2.  **Expected vs. Actual Behavior**: Document whether the failure was due to missing plugin functionality vs. actual bugs.
3.  **Graceful Degradation**: Note if the API handled missing functionality gracefully or threw errors.
4.  **API Response Analysis**: Include the full API response, not just error messages.

**Success Criteria:**
- All tests pass that should work with the current plugin configuration.
- Tests that should fail due to missing plugins fail gracefully with appropriate error messages.
- No unexpected errors or crashes occur.

---

### **Test Execution Strategy**

**Sequential Execution with Branching:**
- Execute tests in order but branch based on plugin availability, using Lando commands to manage the plugins.
- If a test fails due to missing plugin functionality, mark it as "SKIPPED - Plugin Not Active" rather than "FAILED".
- Only mark as "FAILED" if functionality should work with the current plugins but doesn't.

**Data Persistence Testing:**
- **All tests must use the MCP server as the primary interface.**
- After each CRUD operation, verify the change persisted by reading the entity back **through the MCP**.
- If a discrepancy is found, a secondary check can be performed using another method (e.g., `wp-cli` or direct database query) for diagnostic purposes only. The failure is still considered a failure of the MCP interaction.
- Test that relationships (event-venue, event-organizer) are properly maintained.

---

### **Enhanced Error Handling and Edge Case Testing**

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

### **Specific Test Cases Based on Debugging Experience**

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

**Database Consistency Checks:**
- After venue updates, verify `modified` timestamp changes
- After event creation with venues, verify `_EventVenueID` meta is correctly formatted
- After ECP plugin state changes, verify venue storage format adapts correctly

**Debug Log Monitoring:**
- Monitor `wp-content/debug.log` during all operations
- **Critical**: No PHP Fatal Errors should appear in logs
- PHP Warnings about use statements are acceptable (legacy code issue)
- Any TypeError or array_keys() errors indicate regression

**Cross-Plugin Compatibility:**
- Test with Event Tickets (ET) activated and deactivated
- Test with Events Pro (ECP) activated and deactivated
- Verify no conflicts between common submodule versions
- Test venue operations work regardless of ET plugin state
