# BBGM Untradables Extension - Implementation Notes

## Project Overview
Chrome extension for Basketball GM that manages "untouchable" players in trading. Allows users to save/load player selections per team per league with a dropdown UI.

## Key Technical Patterns

### 1. League & Team Scoping
- Extract league number from URL: `window.location.pathname.match(/\/l\/(\d+)\//)`
- Slugify team names: lowercase + replace spaces with hyphens + remove special chars
- Storage key format: `league-{leagueNumber}-team-{slugifiedTeamName}`
- Example: `league-4-team-los-angeles-lakers`

### 2. Chrome Extension Storage
- Use `chrome.storage.local` (not localStorage) - requires "storage" permission in manifest
- Async API with callback: `chrome.storage.local.set({key: value}, () => {})`
- Async retrieval: `chrome.storage.local.get([key], (result) => {})`

### 3. DOM Traversal for Dynamic Data
- Start from known element (button with ID)
- Traverse up: `while (element && !element.classList.contains('target')) { element = element.parentElement; }`
- Get siblings: `element.previousElementSibling`, `element.nextElementSibling`
- Always validate at each step before proceeding

### 4. Dropdown Implementation
- Structure: outer container `div.dropdown` → button `btn-secondary dropdown-toggle` → menu `div.dropdown-menu`
- Add/remove `show` class to toggle visibility
- Track state with `aria-expanded` attribute
- Close on click-outside with document listener checking `newButtonDiv.contains(e.target)`
- Menu items are `<a>` tags with `dropdown-item` class and `data-rr-ui-dropdown-item` attribute

### 5. SPA Navigation Detection
- Observe `<title>` element with `characterData: true` option
- Use exact match: `document.title === 'Trade'` (not includes)
- Re-initialize extension when title changes

### 6. MutationObserver Pattern
- Use for async DOM rendering (elements not available on page load)
- Always try immediate check first, then set up observer fallback
- Disconnect observer once element found
- Watch `document.body` with `{ childList: true, subtree: true }`

### 7. User Feedback - Toast Notifications
- Create div with `alert alert-success`/`alert alert-warning` classes (Bootstrap)
- Position fixed top-right: `position: fixed; top: 20px; right: 20px; z-index: 9999`
- CSS animation with keyframes (add to page once to avoid duplication)
- Auto-remove after 3000ms with `setTimeout(() => toast.remove(), 3000)`
- Check for existing styles: `if (!document.getElementById('id')) { createElement + append }`

### 8. Dynamic Checkbox Detection
- Select all checkboxes: `row.querySelectorAll('input[type="checkbox"]')`
- Index matters: `[1]` is often the "exclude" checkbox (index 0 might be row selector)
- Always filter: `checkbox?.checked && !checkbox?.disabled`
- Trigger changes: `checkbox.click()` to programmatically check/uncheck

## Manifest V3 Essentials
```json
{
  "manifest_version": 3,
  "permissions": ["scripting", "storage"],
  "host_permissions": ["https://domain.com/*"],
  "content_scripts": [{
    "matches": ["https://domain.com/*"],
    "js": ["content.js"]
  }]
}
```

## Common Pitfalls
- MutationObserver on `<head>` for title changes doesn't work - observe `<title>` directly
- Storage keys must be consistent (use slugify for team names)
- Title matching with `includes()` can be too broad - use exact match
- Disabled checkboxes must be filtered out
- Toast only adds styles once (check by ID)
- Event listeners inside loops can cause multiple registrations
