console.log('[BBGM Untradables] Extension loaded');

const NEW_BUTTON_CONTAINER_ID = 'save-untouchables-container';

function getLeagueNumber() {
  const match = window.location.pathname.match(/\/l\/(\d+)\//);
  return match ? match[1] : null;
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
}

function getTeamName() {
  const bulkButton = document.querySelector('#trade-players-bulk-User');
  if (!bulkButton) {
    console.error('[BBGM Untradables] Bulk button not found');
    return null;
  }

  // Navigate up from button to find the row div
  let element = bulkButton;
  while (element && !element.classList.contains('row')) {
    element = element.parentElement;
  }

  if (!element) {
    console.error('[BBGM Untradables] Row div not found');
    return null;
  }

  // Find the h2 element before the row div
  const h2 = element.previousElementSibling;
  if (h2 && h2.tagName === 'H2') {
    const teamName = h2.textContent.trim();
    console.log(`[BBGM Untradables] Team name: ${teamName}`);
    return teamName;
  }

  console.error('[BBGM Untradables] H2 element not found before row div');
  return null;
}

function getStorageKey(teamName) {
  const leagueNumber = getLeagueNumber();
  const slugifiedTeamName = slugify(teamName);
  return `league-${leagueNumber}-team-${slugifiedTeamName}`;
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `alert alert-${type}`;
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.top = '20px';
  toast.style.right = '20px';
  toast.style.zIndex = '9999';
  toast.style.minWidth = '300px';
  toast.style.animation = 'fadeInOut 3s ease-in-out forwards';

  // Add animation to page if not already present
  if (!document.getElementById('bbgm-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'bbgm-toast-styles';
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(-10px); }
        10% { opacity: 1; transform: translateY(0); }
        90% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-10px); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  // Remove from DOM after animation completes
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function insertNewButton() {
  const bulkButton = document.querySelector('#trade-players-bulk-User');

  if (bulkButton) {
    const bulkExcludeDiv = bulkButton.parentElement;

    // Create outer container div
    const newButtonDiv = document.createElement('div');
    newButtonDiv.className = 'd-inline-block m-2 dropdown';
    newButtonDiv.id = NEW_BUTTON_CONTAINER_ID;

    // Create dropdown toggle button
    const newButton = document.createElement('button');
    newButton.type = 'button';
    newButton.className = 'btn-sm dropdown-toggle btn btn-secondary';
    newButton.textContent = 'Untouchables';
    newButton.setAttribute('aria-expanded', 'false');
    newButton.style.backgroundColor = '#4f4fd7';
    newButton.style.cursor = 'pointer';
    newButton.title = 'Extension feature: Save your untouchables list';

    // Create dropdown menu
    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'dropdown-menu';
    dropdownMenu.style.position = 'absolute';
    dropdownMenu.style.inset = '0px auto auto 0px';
    dropdownMenu.style.transform = 'translate3d(0px, 29px, 0px)';

    // Create "Save current selection" menu item
    const saveItem = document.createElement('a');
    saveItem.className = 'dropdown-item';
    saveItem.setAttribute('role', 'button');
    saveItem.setAttribute('tabindex', '0');
    saveItem.setAttribute('data-rr-ui-dropdown-item', '');
    saveItem.href = '#';
    saveItem.textContent = 'Save current selection';
    saveItem.addEventListener('click', (e) => {
      e.preventDefault();
      saveCheckedPlayersToStorage();
      toggleDropdown();
    });

    // Create "Clear saved players" menu item
    const clearItem = document.createElement('a');
    clearItem.className = 'dropdown-item';
    clearItem.setAttribute('role', 'button');
    clearItem.setAttribute('tabindex', '0');
    clearItem.setAttribute('data-rr-ui-dropdown-item', '');
    clearItem.href = '#';
    clearItem.textContent = 'Reset';
    clearItem.addEventListener('click', (e) => {
      e.preventDefault();
      clearSavedPlayers();
      toggleDropdown();
    });

    dropdownMenu.appendChild(saveItem);
    dropdownMenu.appendChild(clearItem);

    newButtonDiv.appendChild(newButton);
    newButtonDiv.appendChild(dropdownMenu);

    // Toggle dropdown when button is clicked
    const toggleDropdown = () => {
      const isExpanded = newButton.getAttribute('aria-expanded') === 'true';
      newButton.setAttribute('aria-expanded', !isExpanded);
      newButtonDiv.classList.toggle('show');
      dropdownMenu.classList.toggle('show');
    };

    newButton.addEventListener('click', toggleDropdown);

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!newButtonDiv.contains(e.target) && newButtonDiv.classList.contains('show')) {
        newButton.setAttribute('aria-expanded', 'false');
        newButtonDiv.classList.remove('show');
        dropdownMenu.classList.remove('show');
      }
    });

    // Insert before existing button
    bulkExcludeDiv.parentElement.insertBefore(newButtonDiv, bulkExcludeDiv.nextSibling);

    return newButton;
  }

  return null;
}

function getCheckedPlayers(teamName) {
  const teamHeader = Array.from(document.querySelectorAll('h2.mt-3')).find(
    (h2) => h2.textContent.trim() === teamName
  );

  if (!teamHeader) {
    console.error(`Team "${teamName}" not found`);
    return [];
  }

  const tableDiv = teamHeader.nextElementSibling;
  const tbody = tableDiv?.querySelector('tbody');

  if (!tbody) {
    console.error(`Table not found for team "${teamName}"`);
    return [];
  }

  return Array.from(tbody.querySelectorAll('tr'))
    .filter((row) => {
      const checkbox = row.querySelectorAll('input[type="checkbox"]')[1];
      return checkbox?.checked && !checkbox?.disabled;
    })
    .map((row) => row.querySelector('a')?.getAttribute('href'))
    .filter((href) => href);
}

function saveCheckedPlayersToStorage() {
  const teamName = getTeamName();
  if (!teamName) {
    console.error('[BBGM Untradables] Could not get team name');
    showToast('Error: Could not get team name');
    return;
  }

  const hrefs = getCheckedPlayers(teamName);
  const storageKey = getStorageKey(teamName);

  chrome.storage.local.set({ [storageKey]: hrefs }, () => {
    if (hrefs.length === 0) {
      const message = 'No players have been selected as untradables';
      console.log(`[BBGM Untradables] ${message}`);
      showToast(message, 'warning');
    } else {
      const message = `Saved ${hrefs.length} player(s) to untouchables list`;
      console.log(`[BBGM Untradables] ${message}`);
      showToast(message, 'success');
    }
  });
}

function clearSavedPlayers() {
  const teamName = getTeamName();
  if (!teamName) {
    console.error('[BBGM Untradables] Could not get team name');
    showToast('Error: Could not get team name');
    return;
  }

  const storageKey = getStorageKey(teamName);
  chrome.storage.local.set({ [storageKey]: [] }, () => {
    const message = 'Cleared saved untouchables list';
    console.log(`[BBGM Untradables] ${message}`);
    showToast(message, 'success');
  });
}

function setCheckedPlayersFromStorage(teamName) {
  const teamHeader = Array.from(document.querySelectorAll('h2.mt-3')).find(
    (h2) => h2.textContent.trim() === teamName
  );

  if (!teamHeader) {
    console.error(`Team "${teamName}" not found`);
    return false;
  }

  const tableDiv = teamHeader.nextElementSibling;
  const tbody = tableDiv?.querySelector('tbody');

  if (!tbody) {
    console.error(`Table not found for team "${teamName}"`);
    return false;
  }

  const storageKey = getStorageKey(teamName);

  chrome.storage.local.get([storageKey], (result) => {
    const stored = result[storageKey];

    if (!stored) {
      console.warn(`No stored data found for team "${teamName}"`);
      return;
    }

    let checkedCount = 0;
    Array.from(tbody.querySelectorAll('tr')).forEach((row) => {
      const href = row.querySelector('a')?.getAttribute('href');
      if (href && stored.includes(href)) {
        const checkbox = row.querySelectorAll('input[type="checkbox"]')[1];
        if (checkbox && !checkbox.checked) {
          checkbox.click();
          checkedCount++;
        }
      }
    });

    console.log(`Checked ${checkedCount} player(s)`);
  });

  return true;
}

function checkAndSetPlayersWhenTableLoads() {
  console.log('[BBGM Untradables] Checking if table is loaded...');

  const teamName = getTeamName();
  if (!teamName) {
    console.log('[BBGM Untradables] Could not get team name');
    return false;
  }

  const teamHeader = Array.from(document.querySelectorAll('h2.mt-3')).find(
    (h2) => h2.textContent.trim() === teamName
  );

  if (!teamHeader) {
    console.log('[BBGM Untradables] Team header not found yet');
    return false;
  }

  const tableDiv = teamHeader.nextElementSibling;
  const tbody = tableDiv?.querySelector('tbody');

  if (!tbody) {
    console.log('[BBGM Untradables] Table tbody not found yet');
    return false;
  }

  console.log('[BBGM Untradables] Table found, loading stored players...');
  setCheckedPlayersFromStorage(teamName);
  return true;
}

function isOnTradePage() {
  return document.title === 'Trade';
}

function initializeExtension() {
  if (!isOnTradePage()) {
    console.log('[BBGM Untradables] Not on Trade page, skipping initialization');
    return;
  }

  console.log('[BBGM Untradables] Initializing button insertion...');

  // Try immediately in case the button is already there
  let newButton = insertNewButton();
  if (newButton) {
    console.log('[BBGM Untradables] Button found on initial load');
  } else {
    console.log('[BBGM Untradables] Button not found, setting up observer...');
    // If not found, set up a MutationObserver to watch for it
    const observer = new MutationObserver(() => {
      newButton = insertNewButton();
      if (newButton) {
        console.log('[BBGM Untradables] Button found via observer');
        observer.disconnect();
      }
    });

    // Watch the entire document for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  console.log('[BBGM Untradables] Initializing table loading...');

  // Try immediately in case the table is already loaded
  if (checkAndSetPlayersWhenTableLoads()) {
    console.log('[BBGM Untradables] Players loaded on initial load');
  } else {
    console.log('[BBGM Untradables] Table not found, setting up observer...');
    // If not found, set up a MutationObserver to watch for the table
    const tableObserver = new MutationObserver(() => {
      if (checkAndSetPlayersWhenTableLoads()) {
        console.log('[BBGM Untradables] Players loaded via observer');
        tableObserver.disconnect();
      }
    });

    tableObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}

// Initialize on page load
console.log('[BBGM Untradables] Page title:', document.title);
initializeExtension();

// Watch for page title changes (indicates navigation in SPA)
const titleElement = document.querySelector('title');
if (titleElement) {
  const titleObserver = new MutationObserver(() => {
    console.log('[BBGM Untradables] Page title changed to:', document.title);
    initializeExtension();
  });

  titleObserver.observe(titleElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });
} else {
  console.warn('[BBGM Untradables] Title element not found');
}