# Bug Report: Pagination Offset Issue

## Bug Description
The `getPaginated` function in `taskService.js` prevents users from accessing the first page of items.

### Expected Behavior
When making a `GET` request to `/tasks?page=1&limit=10`, the API should return the very first 10 items in the `tasks` array (indices `0` through `9`). Passing `page=1` represents the first logical page.

### Actual Behavior
Because `taskService.js` calculates the offset as `page * limit`, passing `page=1` with `limit=10` evaluates the offset to `10`. The result is that it skips the first 10 items entirely, showing the user the second page of items instead. Furthermore, the route handler `tasks.js` does `parseInt(page) || 1`, meaning if a user tries to circumvent the bug by passing `?page=0`, it simply defaults back to `1`. Thus, the first page of data is fundamentally inaccessible.

### How it was Discovered
This was discovered while writing the unit and integration tests. When setting up the `getPaginated` test suite, reviewing the default fallbacks in `routes/tasks.js` (`parseInt(page) || 1`) confirmed that passing `?page=0` is overwritten to `1`. If both `page=1` and `page=0` resolve to `page=1`, and `page=1 * limit` gives an offset of `limit`, the first chunk is impossible to retrieve.

### Proposed Fix
In `src/services/taskService.js`:
Modify the `getPaginated` function to subtract 1 from the page when calculating the offset.
```javascript
const getPaginated = (page, limit) => {
  const normalizedPage = Math.max(1, page); // Ensure it's at least 1
  const offset = (normalizedPage - 1) * limit;
  return tasks.slice(offset, offset + limit);
};
```
This guarantees that `page=1` yields an offset of `0`.
