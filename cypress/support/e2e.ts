// This file injects a REPL UI into the Cypress Test Runner
//@ts-nocheck
import { queries } from '@testing-library/dom';

// Helper function to safely access window.top
const getTopWindow = (): Window => {
  const topWindow = window.top;
  if (!topWindow) {
    throw new Error("window.top is null");
  }
  return topWindow;
};

// SVG Icons for a more futuristic UI
const ICONS = {
  chevronUp: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>`,
  chevronDown: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
  close: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  run: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`,
  export: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
  reset: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v6h6"></path><path d="M3 13a9 9 0 1 0 3-7.7L3 8"></path></svg>`,
  success: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
  error: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
  warning: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF9800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
};

// Define available commands for autocomplete
const availableCommands = [
  // Navigation & Origin Commands
  { command: 'goto()', description: 'Navigate to a URL', example: 'goto("https://example.com")' },
  { command: 'visit()', description: 'Navigate to a URL', example: 'visit("https://example.com")' },
  { command: 'origin()', description: 'Execute commands in the context of a different origin', example: 'origin("https://example.com", () => { cy.get(".button").click() })' },

  // Action Commands
  { command: 'click()', description: 'Click on an element with text', example: 'click("Login")' },
  { command: 'click() with get', description: 'Click on an element by CSS selector', example: 'click(".button", "get")' },
  { command: 'write()', description: 'Type text into an input field', example: 'write("username", "Username")' },
  { command: 'write() with get', description: 'Type text into an input field by CSS selector', example: 'write("username", "#username", "get")' },
  { command: 'type()', description: 'Type text into an input field by CSS selector', example: 'type("Hello", "#input")' },
  { command: 'clear()', description: 'Clear the content of an input field', example: 'clear("#input")' },
  { command: 'check()', description: 'Check a checkbox or radio button', example: 'check("#checkbox")' },
  { command: 'uncheck()', description: 'Uncheck a checkbox', example: 'uncheck("#checkbox")' },
  { command: 'select()', description: 'Select an option from a dropdown', example: 'select("#dropdown", "Option 1")' },
  { command: 'get()', description: 'Select elements by CSS selector', example: 'get(".button")' },
  { command: 'contains()', description: 'Find elements containing specific text', example: 'contains("Submit")' },

  // Assertion Commands
  { command: 'shouldContain()', description: 'Assert that an element contains specific text', example: 'shouldContain("#element", "Expected text")' },
  { command: 'shouldBeVisible()', description: 'Assert that an element is visible', example: 'shouldBeVisible("#element")' },
  { command: 'shouldHaveValue()', description: 'Assert that an element has a specific value', example: 'shouldHaveValue("#input", "Expected value")' },

  // Network & Session Commands
  { command: 'intercept()', description: 'Intercept a network request', example: 'intercept("GET", "/api/users", "getUsers")' },
  { command: 'waitForAlias()', description: 'Wait for an aliased resource to resolve', example: 'waitForAlias("getUsers")' },
  { command: 'session()', description: 'Create or restore a session', example: 'session("user", () => { cy.login() })' },

  // Utility Commands
  { command: 'wait()', description: 'Wait for a specified amount of time', example: 'wait(1000)' },
  { command: 'reload()', description: 'Reload the current page', example: 'reload()' },
  { command: 'screenshot()', description: 'Take a screenshot', example: 'screenshot("homepage")' },
  { command: 'closeBrowser()', description: 'Close the browser (not needed in Cypress)', example: 'closeBrowser()' },
];

// Wait for the Cypress UI to fully load
Cypress.on('test:before:run', () => {
  console.log('[CLICY DEBUG] Test before run - Recreating UI');

  // Remove existing UI if it exists to ensure fresh event listeners
  const existingUI = getTopWindow().document.querySelector('#clicy-repl');
  if (existingUI) {
    console.log('[CLICY DEBUG] Removing existing UI');
    existingUI.remove();
  }

  // Check if the server is running
  console.log('[CLICY DEBUG] Checking if server is running...');

  // Function to check server connection with retries
  const checkServerWithRetries = (retries = 15, delay = 2000) => {
    console.log(`[CLICY DEBUG] Checking server connection (attempt ${16 - retries}/15)...`);

    fetch('http://localhost:4000/commands', {
      method: 'GET',
      signal: AbortSignal.timeout(1000)
    })
      .then(() => {
        console.log('[CLICY DEBUG] Server is running');
      })
      .catch(error => {
        console.error(`[CLICY DEBUG] Server connection attempt ${16 - retries} failed:`, error);

        if (retries > 1) {
          // Try again after delay
          setTimeout(() => checkServerWithRetries(retries - 1, delay), delay);
        } else {
          // All retries failed, show notification
          console.error('[CLICY DEBUG] All server connection attempts failed');

          // Create a notification at the top of the screen
          const notification = getTopWindow().document.createElement('div');
          notification.id = 'clicy-server-notification';
          notification.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: rgba(255, 152, 0, 0.9); /* Orange for warning instead of red */
            color: white;
            padding: 12px 20px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            z-index: 100000;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            display: flex;
            justify-content: center;
            align-items: center;
          `;

          const messageSpan = getTopWindow().document.createElement('span');
          messageSpan.textContent = 'Waiting for Clicy server to start... Commands will not work until the server is ready.';

          const retryButton = getTopWindow().document.createElement('button');
          retryButton.textContent = 'Retry Connection';
          retryButton.style.cssText = `
            margin-left: 16px;
            padding: 6px 12px;
            background: white;
            color: #FF9800;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: background-color 0.2s;
          `;

          retryButton.addEventListener('mouseover', () => {
            retryButton.style.backgroundColor = '#f5f5f5';
          });

          retryButton.addEventListener('mouseout', () => {
            retryButton.style.backgroundColor = 'white';
          });

          retryButton.addEventListener('click', () => {
            // Update message to show we're retrying
            messageSpan.textContent = 'Retrying connection to Clicy server...';
            retryButton.disabled = true;
            retryButton.style.opacity = '0.5';

            // Check if the server is now running
            fetch('http://localhost:4000/commands', { method: 'GET' })
              .then(() => {
                // Server is running now, update notification
                notification.style.backgroundColor = 'rgba(76, 175, 80, 0.9)';
                messageSpan.textContent = 'Server is now running! Clicy commands will work.';
                retryButton.style.display = 'none';

                // Add a close button
                const closeButton = getTopWindow().document.createElement('button');
                closeButton.textContent = '✕';
                closeButton.style.cssText = `
                  margin-left: 16px;
                  width: 24px;
                  height: 24px;
                  background: transparent;
                  color: white;
                  border: 1px solid white;
                  border-radius: 50%;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 12px;
                `;

                closeButton.addEventListener('click', () => {
                  notification.remove();
                });

                notification.appendChild(closeButton);

                // Auto-remove after 3 seconds
                setTimeout(() => {
                  notification.remove();
                }, 3000);
              })
              .catch(() => {
                // Server still not running, update the message
                messageSpan.textContent = 'Server still not responding. The server should start automatically, but it may take longer than expected.';
                retryButton.disabled = false;
                retryButton.style.opacity = '1';
              });
          });

          const closeButton = getTopWindow().document.createElement('button');
          closeButton.textContent = '✕';
          closeButton.style.cssText = `
            margin-left: 16px;
            width: 24px;
            height: 24px;
            background: transparent;
            color: white;
            border: 1px solid white;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
          `;

          closeButton.addEventListener('click', () => {
            notification.remove();
          });

          notification.appendChild(messageSpan);
          notification.appendChild(retryButton);
          notification.appendChild(closeButton);

          getTopWindow().document.body.appendChild(notification);
        }
      });
  };

  // Start checking with retries
  checkServerWithRetries();

  // Check if we have a saved collapsed state
  const isCollapsed = getTopWindow().localStorage.getItem('clicy-collapsed') === 'true';

  // Create the REPL UI container with futuristic styling
  const replContainer = getTopWindow().document.createElement('div');
  replContainer.id = 'clicy-repl';
  replContainer.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #1e3c72, #2a5298, #1a2530);
    border-top: 1px solid rgba(74, 136, 255, 0.4);
    display: flex;
    flex-direction: column;
    z-index: 9999;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4), 0 -2px 10px rgba(74, 136, 255, 0.2), 0 0 30px rgba(74, 136, 255, 0.1);
    ${isCollapsed ? 'transform: translateY(calc(100% - 40px));' : ''}
    border-radius: 16px 16px 0 0;
    overflow: hidden;
    backdrop-filter: blur(5px);
  `; 

  // Create the header bar with enhanced futuristic styling
  const headerBar = getTopWindow().document.createElement('div');
  headerBar.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 24px;
    background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
    border-bottom: ${isCollapsed ? 'none' : '1px solid rgba(74, 136, 255, 0.3)'};
    cursor: pointer;
    user-select: none;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  `;

  // Add a subtle animated glow effect to the header
  const headerGlow = getTopWindow().document.createElement('div');
  headerGlow.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(74, 136, 255, 0.1), transparent);
    transform: translateX(-100%);
    animation: header-glow 8s infinite;
    pointer-events: none;
  `;

  // Add the animation keyframes to the document
  const styleSheet = getTopWindow().document.createElement('style');
  styleSheet.textContent = `
    @keyframes header-glow {
      0% { transform: translateX(-100%); }
      50% { transform: translateX(100%); }
      100% { transform: translateX(-100%); }
    }
  `;
  getTopWindow().document.head.appendChild(styleSheet);

  headerBar.appendChild(headerGlow);

  // Create the title with enhanced favicon
  const titleContainer = getTopWindow().document.createElement('div');
  titleContainer.style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
  `;

  // Add favicon with glowing effect
  const faviconContainer = getTopWindow().document.createElement('div');
  faviconContainer.style.cssText = `
    position: relative;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const faviconGlow = getTopWindow().document.createElement('div');
  faviconGlow.style.cssText = `
    position: absolute;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(74, 136, 255, 0.5);
    filter: blur(6px);
    animation: pulse 2s infinite;
  `;

  const favicon = getTopWindow().document.createElement('img');
  favicon.src = 'http://localhost:4000/favicon.ico?v=' + new Date().getTime();
  favicon.style.cssText = `
    width: 20px;
    height: 20px;
    border-radius: 50%;
    position: relative;
    z-index: 1;
    box-shadow: 0 0 10px rgba(74, 136, 255, 0.7);
  `;

  faviconContainer.appendChild(faviconGlow);
  faviconContainer.appendChild(favicon);

  // Add pulse animation
  const pulseStyle = getTopWindow().document.createElement('style');
  pulseStyle.textContent = `
    @keyframes pulse {
      0% { transform: scale(0.95); opacity: 0.7; }
      50% { transform: scale(1.05); opacity: 0.9; }
      100% { transform: scale(0.95); opacity: 0.7; }
    }
  `;
  getTopWindow().document.head.appendChild(pulseStyle);

  const title = getTopWindow().document.createElement('div');
  title.textContent = 'CliCy Commands';
  title.style.cssText = `
    font-weight: 600;
    font-size: 16px;
    color: rgba(255, 255, 255, 0.95);
    letter-spacing: 0.7px;
    text-shadow: 0 0 10px rgba(74, 136, 255, 0.7), 0 2px 4px rgba(0, 0, 0, 0.5);
    background: linear-gradient(to right, #ffffff, #88b8ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  `;

  titleContainer.appendChild(favicon);
  titleContainer.appendChild(title);

  // Create the toggle button with enhanced styling
  const toggleButton = getTopWindow().document.createElement('div');
  toggleButton.innerHTML = isCollapsed ? ICONS.chevronUp : ICONS.chevronDown;
  toggleButton.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    color: rgba(255, 255, 255, 0.9);
    background: linear-gradient(135deg, rgba(74, 136, 255, 0.2), rgba(74, 136, 255, 0.4));
    border-radius: 50%;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid rgba(74, 136, 255, 0.3);
    box-shadow: 0 0 10px rgba(74, 136, 255, 0.2);
  `;

  // Add enhanced hover effect to toggle button
  toggleButton.addEventListener('mouseover', () => {
    toggleButton.style.background = 'linear-gradient(135deg, rgba(74, 136, 255, 0.4), rgba(74, 136, 255, 0.6))';
    toggleButton.style.boxShadow = '0 0 15px rgba(74, 136, 255, 0.5)';
    toggleButton.style.transform = 'scale(1.05)';
  });

  toggleButton.addEventListener('mouseout', () => {
    toggleButton.style.background = 'linear-gradient(135deg, rgba(74, 136, 255, 0.2), rgba(74, 136, 255, 0.4))';
    toggleButton.style.boxShadow = '0 0 10px rgba(74, 136, 255, 0.2)';
    toggleButton.style.transform = 'scale(1)';
  });

  // Add click event to toggle collapse
  headerBar.addEventListener('click', () => {
    const currentlyCollapsed = replContainer.style.transform !== '';

    if (currentlyCollapsed) {
      // Expand
      replContainer.style.transform = '';
      toggleButton.innerHTML = ICONS.chevronDown;
      headerBar.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
      getTopWindow().localStorage.setItem('clicy-collapsed', 'false');
    } else {
      // Collapse
      replContainer.style.transform = 'translateY(calc(100% - 48px))';
      toggleButton.innerHTML = ICONS.chevronUp;
      headerBar.style.borderBottom = 'none';
      getTopWindow().localStorage.setItem('clicy-collapsed', 'true');
    }
  });

  // Assemble the header
  headerBar.appendChild(titleContainer);
  headerBar.appendChild(toggleButton);

  // Create the content container with enhanced styling
  const contentContainer = getTopWindow().document.createElement('div');
  contentContainer.style.cssText = `
    padding: 20px;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #0f2027, #203a43);
    position: relative;
    overflow: hidden;
  `;

  // Add subtle background pattern
  const patternOverlay = getTopWindow().document.createElement('div');
  patternOverlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: radial-gradient(rgba(74, 136, 255, 0.1) 1px, transparent 1px);
    background-size: 20px 20px;
    pointer-events: none;
    opacity: 0.3;
  `;

  contentContainer.appendChild(patternOverlay);

  // Create the input field with enhanced styling
  const inputContainer = getTopWindow().document.createElement('div');
  inputContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    margin-bottom: 20px;
    position: relative;
    z-index: 1;
  `;

  // This will be the container for the input and dropdown to ensure proper positioning
  const inputAndDropdownContainer = getTopWindow().document.createElement('div');
  inputAndDropdownContainer.style.cssText = `
    position: relative;
    width: 100%;
  `;

  inputContainer.appendChild(inputAndDropdownContainer);

  const commandInput = getTopWindow().document.createElement('input');
  commandInput.type = 'text';
  commandInput.placeholder = 'Enter Cypress command (e.g., contains("Login").click())';
  commandInput.style.cssText = `
    flex: 1;
    padding: 14px 18px;
    font-family: 'Consolas', monospace;
    font-size: 15px;
    color: #e0e0e0;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(74, 136, 255, 0.3);
    border-radius: 12px 12px 0 0;
    outline: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 10px rgba(74, 136, 255, 0.1);
    caret-color: #4a88ff;
    letter-spacing: 0.5px;
    width: 600px; /* Increased width from default */
  `;

  // Create the command preview area with enhanced styling
  const commandPreview = getTopWindow().document.createElement('div');
  commandPreview.id = 'clicy-preview';
  commandPreview.style.cssText = `
    padding: 10px 18px;
    font-family: 'Consolas', monospace;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(74, 136, 255, 0.3);
    border-top: none;
    border-radius: 0 0 12px 12px;
    min-height: 24px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow-x: auto;
    white-space: nowrap;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.1);
  `;
  commandPreview.textContent = 'Preview: cy.';

  // Add a label for the preview
  const previewLabel = getTopWindow().document.createElement('span');
  previewLabel.style.cssText = `
    color: rgba(255, 255, 255, 0.5);
    margin-right: 8px;
  `;
  previewLabel.textContent = 'Preview: ';

  // Add the actual preview content
  const previewContent = getTopWindow().document.createElement('span');
  previewContent.style.cssText = `
    color: #4a88ff;
  `;
  previewContent.textContent = 'cy.';

  // Clear the preview and add the label and content
  commandPreview.textContent = '';
  commandPreview.appendChild(previewLabel);
  commandPreview.appendChild(previewContent);

  // Add enhanced focus effect
  commandInput.addEventListener('focus', () => {
    commandInput.style.borderColor = '#4a88ff';
    commandInput.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 0 3px rgba(74, 136, 255, 0.3), 0 0 15px rgba(74, 136, 255, 0.2)';
    commandInput.style.background = 'rgba(0, 0, 0, 0.4)';
    // Add subtle animation to the preview area when input is focused
    commandPreview.style.transform = 'translateY(2px)';
  });

  commandInput.addEventListener('blur', () => {
    commandInput.style.borderColor = 'rgba(74, 136, 255, 0.3)';
    commandInput.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 10px rgba(74, 136, 255, 0.1)';
    commandInput.style.background = 'rgba(0, 0, 0, 0.3)';
    // Reset preview area animation
    commandPreview.style.transform = 'translateY(0)';
  });

  // Create the autocomplete dropdown with enhanced styling
  const autocompleteDropdown = getTopWindow().document.createElement('div');
  autocompleteDropdown.id = 'clicy-autocomplete';
  autocompleteDropdown.style.cssText = `
    position: absolute; /* Position relative to its nearest positioned ancestor */
    top: 100%; /* Position below the input field */
    left: 0; /* Align with the left edge of the input field */
    width: 600px; /* Increased width to match input field */
    max-width: 90vw; /* Responsive - won't exceed 90% of viewport width */
    background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
    border: 1px solid rgba(74, 136, 255, 0.4);
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(74, 136, 255, 0.2), 0 0 40px rgba(0, 0, 0, 0.3);
    max-height: 550px; /* Increased maximum height */
    overflow-y: auto; /* Enable vertical scrolling */
    z-index: 100000; /* Increased z-index to ensure it appears above everything */
    display: none;
    backdrop-filter: blur(10px);
    animation: dropdown-appear 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    margin-top: 5px; /* Small gap between input and dropdown */
  `;

  // Add dropdown animation
  const dropdownStyle = getTopWindow().document.createElement('style');
  dropdownStyle.textContent = `
    @keyframes dropdown-appear {
      0% { opacity: 0; transform: translateY(-5px) scale(0.98); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* Custom scrollbar for the dropdown */
    #clicy-autocomplete::-webkit-scrollbar {
      width: 8px;
    }

    #clicy-autocomplete::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 4px;
    }

    #clicy-autocomplete::-webkit-scrollbar-thumb {
      background: rgba(74, 136, 255, 0.5);
      border-radius: 4px;
    }

    #clicy-autocomplete::-webkit-scrollbar-thumb:hover {
      background: rgba(74, 136, 255, 0.7);
    }
  `;
  getTopWindow().document.head.appendChild(dropdownStyle);

  // Append the dropdown to the inputAndDropdownContainer instead of the document body
  inputAndDropdownContainer.appendChild(autocompleteDropdown);

  // Populate the dropdown with available commands
  availableCommands.forEach(cmd => {
    const item = getTopWindow().document.createElement('div');
    item.className = 'autocomplete-item';
    item.style.cssText = `
      padding: 16px;
      cursor: pointer;
      border-bottom: 1px solid rgba(74, 136, 255, 0.15);
      display: flex;
      flex-direction: column;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      width: 100%;
      box-sizing: border-box;
      height: 150px; /* Fixed height to ensure consistent sizing */
      overflow: hidden; /* Hide overflow content to avoid nested scrolling */
      position: relative;
      background: rgba(0, 0, 0, 0.2);
    `;

    // Add hover effect for autocomplete items
    item.addEventListener('mouseover', () => {
      item.style.background = 'linear-gradient(135deg, rgba(74, 136, 255, 0.1), rgba(74, 136, 255, 0.2))';
      item.style.borderLeft = '3px solid rgba(74, 136, 255, 0.8)';
      item.style.paddingLeft = '13px';
    });

    item.addEventListener('mouseout', () => {
      item.style.background = 'rgba(0, 0, 0, 0.2)';
      item.style.borderLeft = 'none';
      item.style.paddingLeft = '16px';
    });

    const commandText = getTopWindow().document.createElement('div');
    commandText.style.cssText = `
      font-weight: 600;
      margin-bottom: 8px;
      color: rgba(255, 255, 255, 0.95);
      font-size: 17px;
      letter-spacing: 0.5px;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      background: linear-gradient(to right, #ffffff, #88b8ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    `;
    commandText.textContent = cmd.command;

    const descriptionText = getTopWindow().document.createElement('div');
    descriptionText.style.cssText = `
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 10px;
      line-height: 1.5;
      max-width: 100%;
      overflow-wrap: break-word;
      letter-spacing: 0.3px;
    `;
    descriptionText.textContent = cmd.description;

    const exampleText = window.top.document.createElement('div');
    exampleText.style.cssText = `
      font-size: 12px;
      color: #4a88ff;
      font-family: 'Consolas', monospace;
      background: linear-gradient(135deg, rgba(74, 136, 255, 0.1), rgba(74, 136, 255, 0.2));
      padding: 8px 12px;
      border-radius: 8px;
      display: block; /* Changed to block for full width */
      border-left: 3px solid #4a88ff;
      word-break: break-word; /* Ensures long text wraps properly */
      white-space: normal; /* Ensures text wraps */
      overflow-wrap: break-word; /* Helps with long words */
      width: 100%; /* Full width of container */
      box-sizing: border-box; /* Include padding in width calculation */
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), 0 0 4px rgba(74, 136, 255, 0.2);
    `;
    exampleText.textContent = `Example: ${cmd.example}`;

    item.appendChild(commandText);
    item.appendChild(descriptionText);
    item.appendChild(exampleText);

    // Add click event to insert the command into the input
    item.addEventListener('click', () => {
      // Reset active command mode
      activeCommandMode = null;

      // If it's just the command with empty parentheses, position cursor inside
      if (cmd.command === 'goto()' || cmd.command === 'click()' || cmd.command === 'closeBrowser()' ||
          cmd.command === 'get()' || cmd.command === 'contains()') {
        const baseCommand = cmd.command.slice(0, -2); // Remove the "()"
        commandInput.value = baseCommand + "()";
        autocompleteDropdown.style.display = 'none';
        commandInput.focus();

        // Position cursor inside the parentheses
        const cursorPos = baseCommand.length + 1;
        commandInput.setSelectionRange(cursorPos, cursorPos);
      }
      // For write() which has two parameters, position after first quote
      else if (cmd.command === 'write()') {
        commandInput.value = "write(\"\", \"\")";
        autocompleteDropdown.style.display = 'none';
        commandInput.focus();

        // Position cursor after first quote
        const cursorPos = 7;
        commandInput.setSelectionRange(cursorPos, cursorPos);
      }
      // Special handling for click with get
      else if (cmd.command === 'click() with get') {
        commandInput.value = cmd.example;
        autocompleteDropdown.style.display = 'none';
        commandInput.focus();

        // Set active command mode for element inspection
        activeCommandMode = 'click-get';

        // Automatically activate inspection mode
        inspectButton.click();
      }
      // Special handling for write with get
      else if (cmd.command === 'write() with get') {
        commandInput.value = cmd.example;
        autocompleteDropdown.style.display = 'none';
        commandInput.focus();

        // Set active command mode for element inspection
        activeCommandMode = 'write-get';

        // Automatically activate inspection mode
        inspectButton.click();
      }
      // Special handling for type()
      else if (cmd.command === 'type()') {
        commandInput.value = cmd.example;
        autocompleteDropdown.style.display = 'none';
        commandInput.focus();

        // Set active command mode for element inspection
        activeCommandMode = 'type';

        // Automatically activate inspection mode
        inspectButton.click();
      }
      // Special handling for clear()
      else if (cmd.command === 'clear()') {
        commandInput.value = cmd.example;
        autocompleteDropdown.style.display = 'none';
        commandInput.focus();

        // Set active command mode for element inspection
        activeCommandMode = 'clear';

        // Automatically activate inspection mode
        inspectButton.click();
      }
      // Special handling for check()
      else if (cmd.command === 'check()') {
        commandInput.value = cmd.example;
        autocompleteDropdown.style.display = 'none';
        commandInput.focus();

        // Set active command mode for element inspection
        activeCommandMode = 'check';

        // Automatically activate inspection mode
        inspectButton.click();
      }
      // Special handling for uncheck()
      else if (cmd.command === 'uncheck()') {
        commandInput.value = cmd.example;
        autocompleteDropdown.style.display = 'none';
        commandInput.focus();

        // Set active command mode for element inspection
        activeCommandMode = 'uncheck';

        // Automatically activate inspection mode
        inspectButton.click();
      }
      // Special handling for select()
      else if (cmd.command === 'select()') {
        commandInput.value = cmd.example;
        autocompleteDropdown.style.display = 'none';
        commandInput.focus();

        // Set active command mode for element inspection
        activeCommandMode = 'select';

        // Automatically activate inspection mode
        inspectButton.click();
      }
      // Special handling for shouldContain()
      else if (cmd.command === 'shouldContain()') {
        commandInput.value = cmd.example;
        autocompleteDropdown.style.display = 'none';
        commandInput.focus();

        // Set active command mode for element inspection
        activeCommandMode = 'shouldContain';

        // Automatically activate inspection mode
        inspectButton.click();
      }
      // Special handling for shouldBeVisible()
      else if (cmd.command === 'shouldBeVisible()') {
        commandInput.value = cmd.example;
        autocompleteDropdown.style.display = 'none';
        commandInput.focus();

        // Set active command mode for element inspection
        activeCommandMode = 'shouldBeVisible';

        // Automatically activate inspection mode
        inspectButton.click();
      }
      // Special handling for shouldHaveValue()
      else if (cmd.command === 'shouldHaveValue()') {
        commandInput.value = cmd.example;
        autocompleteDropdown.style.display = 'none';
        commandInput.focus();

        // Set active command mode for element inspection
        activeCommandMode = 'shouldHaveValue';

        // Automatically activate inspection mode
        inspectButton.click();
      }
      // Fallback to just inserting the example
      else {
        commandInput.value = cmd.example;
        autocompleteDropdown.style.display = 'none';
        commandInput.focus();
      }
    });

    autocompleteDropdown.appendChild(item);
  });

  // Add the dropdown to the inputAndDropdownContainer
  inputAndDropdownContainer.appendChild(autocompleteDropdown);

  // Add the inputAndDropdownContainer to the inputContainer
  inputContainer.appendChild(inputAndDropdownContainer);

  // Create the buttons container
  const buttonsContainer = window.top.document.createElement('div');
  buttonsContainer.style.cssText = `
    display: flex;
    gap: 16px;
  `;

  // Create the Run button with enhanced futuristic styling
  const runButton = window.top.document.createElement('button');
  runButton.innerHTML = ICONS.run;
  runButton.title = "Run the command";
  runButton.style.cssText = `
    width: 52px;
    height: 52px;
    background: linear-gradient(135deg, #43a047, #2e7d32);
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2), 0 0 15px rgba(46, 125, 50, 0.3);
    position: relative;
    overflow: hidden;
  `;

  // Add glow effect to run button
  const runButtonGlow = window.top.document.createElement('div');
  runButtonGlow.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at center, rgba(255, 255, 255, 0.8), transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  `;

  runButton.appendChild(runButtonGlow);

  // Add enhanced hover effect
  runButton.addEventListener('mouseover', () => {
    runButton.style.transform = 'translateY(-3px) scale(1.05)';
    runButton.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.3), 0 0 20px rgba(46, 125, 50, 0.5)';
    runButtonGlow.style.opacity = '0.4';
  });

  runButton.addEventListener('mouseout', () => {
    runButton.style.transform = 'translateY(0) scale(1)';
    runButton.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.2), 0 0 15px rgba(46, 125, 50, 0.3)';
    runButtonGlow.style.opacity = '0';
  });

  // Add click effect
  runButton.addEventListener('mousedown', () => {
    runButton.style.transform = 'translateY(0) scale(0.95)';
    runButtonGlow.style.opacity = '0.6';
  });

  runButton.addEventListener('mouseup', () => {
    runButton.style.transform = 'translateY(-3px) scale(1.05)';
    runButtonGlow.style.opacity = '0.4';
  });

  // Create the Export button with enhanced futuristic styling
  const exportButton = window.top.document.createElement('button');
  exportButton.innerHTML = ICONS.export;
  exportButton.title = "Export all commands to a file";
  exportButton.style.cssText = `
    width: 52px;
    height: 52px;
    background: linear-gradient(135deg, #2196F3, #1976D2);
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2), 0 0 15px rgba(33, 150, 243, 0.3);
    position: relative;
    overflow: hidden;
  `;

  // Add glow effect to export button
  const exportButtonGlow = window.top.document.createElement('div');
  exportButtonGlow.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at center, rgba(255, 255, 255, 0.8), transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  `;

  exportButton.appendChild(exportButtonGlow);

  // Add enhanced hover effect
  exportButton.addEventListener('mouseover', () => {
    exportButton.style.transform = 'translateY(-3px) scale(1.05)';
    exportButton.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.3), 0 0 20px rgba(33, 150, 243, 0.5)';
    exportButtonGlow.style.opacity = '0.4';
  });

  exportButton.addEventListener('mouseout', () => {
    exportButton.style.transform = 'translateY(0) scale(1)';
    exportButton.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.2), 0 0 15px rgba(33, 150, 243, 0.3)';
    exportButtonGlow.style.opacity = '0';
  });

  // Add click effect
  exportButton.addEventListener('mousedown', () => {
    exportButton.style.transform = 'translateY(0) scale(0.95)';
    exportButtonGlow.style.opacity = '0.6';
  });

  exportButton.addEventListener('mouseup', () => {
    exportButton.style.transform = 'translateY(-3px) scale(1.05)';
    exportButtonGlow.style.opacity = '0.4';
  });

  // Create the Reset button with enhanced futuristic styling
  const resetButton = window.top.document.createElement('button');
  resetButton.innerHTML = ICONS.reset;
  resetButton.title = "Reset all commands";
  resetButton.style.cssText = `
    width: 52px;
    height: 52px;
    background: linear-gradient(135deg, #f44336, #d32f2f);
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2), 0 0 15px rgba(244, 67, 54, 0.3);
    position: relative;
    overflow: hidden;
  `;

  // Add glow effect to reset button
  const resetButtonGlow = window.top.document.createElement('div');
  resetButtonGlow.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at center, rgba(255, 255, 255, 0.8), transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  `;

  resetButton.appendChild(resetButtonGlow);

  // Add enhanced hover effect
  resetButton.addEventListener('mouseover', () => {
    resetButton.style.transform = 'translateY(-3px) scale(1.05)';
    resetButton.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.3), 0 0 20px rgba(244, 67, 54, 0.5)';
    resetButtonGlow.style.opacity = '0.4';
  });

  resetButton.addEventListener('mouseout', () => {
    resetButton.style.transform = 'translateY(0) scale(1)';
    resetButton.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.2), 0 0 15px rgba(244, 67, 54, 0.3)';
    resetButtonGlow.style.opacity = '0';
  });

  // Add click effect
  resetButton.addEventListener('mousedown', () => {
    resetButton.style.transform = 'translateY(0) scale(0.95)';
    resetButtonGlow.style.opacity = '0.6';
  });

  resetButton.addEventListener('mouseup', () => {
    resetButton.style.transform = 'translateY(-3px) scale(1.05)';
    resetButtonGlow.style.opacity = '0.4';
  });

  // Create the Inspect Element button with enhanced futuristic styling
  const inspectButton = window.top.document.createElement('button');
  inspectButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>';
  inspectButton.title = "Inspect Element";
  inspectButton.style.cssText = `
    width: 52px;
    height: 52px;
    background: linear-gradient(135deg, #9c27b0, #673ab7);
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2), 0 0 15px rgba(156, 39, 176, 0.3);
    position: relative;
    overflow: hidden;
  `;

  // Add glow effect to inspect button
  const inspectButtonGlow = window.top.document.createElement('div');
  inspectButtonGlow.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at center, rgba(255, 255, 255, 0.8), transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  `;

  inspectButton.appendChild(inspectButtonGlow);

  // Add enhanced hover effect
  inspectButton.addEventListener('mouseover', () => {
    inspectButton.style.transform = 'translateY(-3px) scale(1.05)';
    inspectButton.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.3), 0 0 20px rgba(156, 39, 176, 0.5)';
    inspectButtonGlow.style.opacity = '0.4';
  });

  inspectButton.addEventListener('mouseout', () => {
    inspectButton.style.transform = 'translateY(0) scale(1)';
    inspectButton.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.2), 0 0 15px rgba(156, 39, 176, 0.3)';
    inspectButtonGlow.style.opacity = '0';
  });

  // Add click effect
  inspectButton.addEventListener('mousedown', () => {
    inspectButton.style.transform = 'translateY(0) scale(0.95)';
    inspectButtonGlow.style.opacity = '0.6';
  });

  inspectButton.addEventListener('mouseup', () => {
    inspectButton.style.transform = 'translateY(-3px) scale(1.05)';
    inspectButtonGlow.style.opacity = '0.4';
  });

  // Create the Smart Selector Toggle button
  const smartSelectorButton = window.top.document.createElement('button');
  smartSelectorButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>';
  smartSelectorButton.title = "Toggle Smart Selectors";
  smartSelectorButton.style.cssText = `
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #ff9800, #ff5722);
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1);
  `;

  // Add hover effect
  smartSelectorButton.addEventListener('mouseover', () => {
    smartSelectorButton.style.transform = 'translateY(-2px)';
    smartSelectorButton.style.boxShadow = '0 6px 10px rgba(0, 0, 0, 0.2), 0 1px 3px rgba(0, 0, 0, 0.1), 0 0 10px rgba(255, 152, 0, 0.5)';
  });

  smartSelectorButton.addEventListener('mouseout', () => {
    smartSelectorButton.style.transform = 'translateY(0)';
    smartSelectorButton.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1)';
  });

  // Default to using smart selectors
  let useSmartSelectors = true;

  // Update button appearance based on current state
  const updateSmartSelectorButtonState = () => {
    if (useSmartSelectors) {
      smartSelectorButton.style.background = 'linear-gradient(135deg, #ff9800, #ff5722)';
      smartSelectorButton.title = "Smart Selectors: ON (click to toggle)";
    } else {
      smartSelectorButton.style.background = 'linear-gradient(135deg, #9e9e9e, #616161)';
      smartSelectorButton.title = "Smart Selectors: OFF (click to toggle)";
    }
  };

  // Initialize button state
  updateSmartSelectorButtonState();

  // Add click event to toggle smart selectors
  smartSelectorButton.addEventListener('click', () => {
    useSmartSelectors = !useSmartSelectors;
    updateSmartSelectorButtonState();

    // Update status message
    statusMessage.innerHTML = '';
    const iconSpan = window.top.document.createElement('span');
    iconSpan.innerHTML = useSmartSelectors
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff9800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    iconSpan.style.cssText = `
      margin-right: 8px;
      vertical-align: middle;
    `;

    const textSpan = window.top.document.createElement('span');
    textSpan.textContent = useSmartSelectors
      ? 'Smart Selectors enabled. Using @testing-library/dom for better selector suggestions.'
      : 'Smart Selectors disabled. Using basic CSS selectors.';
    textSpan.style.cssText = `
      vertical-align: middle;
    `;

    statusMessage.appendChild(iconSpan);
    statusMessage.appendChild(textSpan);
    statusMessage.style.borderLeftColor = useSmartSelectors ? '#4CAF50' : '#ff9800';
    statusMessage.style.backgroundColor = useSmartSelectors ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)';
  });

  // Create the status message
  const statusMessage = window.top.document.createElement('div');
  statusMessage.id = 'clicy-status';
  statusMessage.style.cssText = `
    margin-top: 16px;
    font-family: 'Consolas', monospace;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.9);
    padding: 12px 16px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.2);
    border-left: 4px solid #4a88ff;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    min-height: 20px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(5px);
    letter-spacing: 0.3px;
    position: relative;
    overflow: hidden;
  `;

  // Add subtle glow effect
  const statusGlow = window.top.document.createElement('div');
  statusGlow.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(74, 136, 255, 0.5), transparent);
    animation: statusGlow 2s infinite;
  `;

  // Add keyframes for the glow animation
  const statusStyleSheet = window.top.document.createElement('style');
  statusStyleSheet.textContent = `
    @keyframes statusGlow {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  `;
  window.top.document.head.appendChild(statusStyleSheet);

  statusMessage.appendChild(statusGlow);

  // Set initial message
  statusMessage.textContent = 'Ready to execute commands';
  statusMessage.style.borderLeftColor = '#4a88ff';
  statusMessage.style.backgroundColor = 'rgba(74, 136, 255, 0.1)';

  // Inspection mode variables
  let isInspectionMode = false;
  let highlightOverlay: HTMLElement | null = null;
  let tooltipElement: HTMLElement | null = null;
  let autIframe: HTMLIFrameElement | null = null;
  let iframeDocument: Document | null = null;
  let focusableElements: HTMLElement[] = []; // Array to store focusable elements
  let currentFocusIndex = -1; // Index of currently focused element
  let activeCommandMode: 'click-get' | 'write-get' | 'type' | 'clear' | 'check' | 'uncheck' | 'select' | 'get' | 'shouldContain' | 'shouldBeVisible' | 'shouldHaveValue' | null = null; // Track the active command mode

  // Function to get the AUT iframe
  const getAutIframe = (): HTMLIFrameElement | null => {
    return window.top.document.querySelector('iframe.aut-iframe');
  };

  // Function to get the best selector for an element
  const getBestSelector = (element: HTMLElement): string => {
    // Try to get the id
    if (element.id) {
      return `#${element.id}`;
    }

    // Try to get a data-testid attribute
    if (element.getAttribute('data-testid')) {
      return `[data-testid="${element.getAttribute('data-testid')}"]`;
    }

    // Try to get a data-cy attribute
    if (element.getAttribute('data-cy')) {
      return `[data-cy="${element.getAttribute('data-cy')}"]`;
    }

    // Try to get a class
    if (element.className && typeof element.className === 'string' && element.className.trim()) {
      // Get the first class
      const className = element.className.trim().split(/\\s+/)[0];
      return `.${className}`;
    }

    // Try to get a name attribute
    if (element.getAttribute('name')) {
      return `[name="${element.getAttribute('name')}"]`;
    }

    // Try to get a type and value for inputs
    if (element.tagName.toLowerCase() === 'input' && element.getAttribute('type') && element.getAttribute('value')) {
      return `input[type="${element.getAttribute('type')}"][value="${element.getAttribute('value')}"]`;
    }

    // Fallback to tag name with any available attribute
    const tagName = element.tagName.toLowerCase();
    if (element.attributes.length > 0) {
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        if (attr.name !== 'style' && attr.name !== 'class' && attr.value) {
          return `${tagName}[${attr.name}="${attr.value}"]`;
        }
      }
    }

    // Last resort: tag name with text content if it's short enough
    const textContent = element.textContent?.trim();
    if (textContent && textContent.length < 30) {
      return `${tagName}:contains("${textContent}")`;
    }

    // Absolute fallback
    return tagName;
  };

  // Function to get a smart selector using @testing-library/dom
  const getSmartSelector = (element: HTMLElement): string => {
    try {
      // Try to get a suggested query from @testing-library/dom
      const suggestions = queries.getSuggestedQuery(element, 'get');

      if (suggestions) {
        // Convert the suggestion to a Cypress-friendly selector
        if (suggestions.queryName === 'getByRole') {
          return `[role="${suggestions.queryValue}"]`;
        } else if (suggestions.queryName === 'getByLabelText') {
          return `label:contains("${suggestions.queryValue}")`;
        } else if (suggestions.queryName === 'getByText') {
          return `:contains("${suggestions.queryValue}")`;
        } else if (suggestions.queryName === 'getByTestId') {
          return `[data-testid="${suggestions.queryValue}"]`;
        } else if (suggestions.queryName === 'getByAltText') {
          return `[alt="${suggestions.queryValue}"]`;
        } else if (suggestions.queryName === 'getByTitle') {
          return `[title="${suggestions.queryValue}"]`;
        } else if (suggestions.queryName === 'getByDisplayValue') {
          return `[value="${suggestions.queryValue}"]`;
        } else if (suggestions.queryName === 'getByPlaceholderText') {
          return `[placeholder="${suggestions.queryValue}"]`;
        }
      }

      // If no suggestion found or not convertible to Cypress selector, fall back to getBestSelector
      return getBestSelector(element);
    } catch (error) {
      console.error('[CLICY DEBUG] Error getting smart selector:', error);
      // Fall back to getBestSelector in case of error
      return getBestSelector(element);
    }
  };

  // Function to get the appropriate selector based on user preference
  const getSelector = (element: HTMLElement): string => {
    return useSmartSelectors ? getSmartSelector(element) : getBestSelector(element);
  };

  // Create highlight overlay (will be added to DOM when needed)
  const createHighlightOverlay = (doc: Document) => {
    const overlay = doc.createElement('div');
    overlay.style.cssText = `
      position: absolute;
      pointer-events: none;
      border: 2px dashed rgba(156, 39, 176, 0.8);
      background-color: rgba(156, 39, 176, 0.1);
      border-radius: 2px;
      z-index: 99999;
      box-shadow: 0 0 10px rgba(156, 39, 176, 0.3);
      transition: all 0.15s ease-in-out;
    `;
    return overlay;
  };

  // Create tooltip element (will be added to DOM when needed)
  const createTooltip = (doc: Document) => {
    const tooltip = doc.createElement('div');
    tooltip.style.cssText = `
      position: absolute;
      background-color: #2c3e50;
      color: white;
      padding: 6px 10px;
      border-radius: 4px;
      font-family: 'Consolas', monospace;
      font-size: 12px;
      pointer-events: none;
      z-index: 100000;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      max-width: 300px;
      word-break: break-all;
      border-left: 3px solid #9c27b0;
    `;
    return tooltip;
  };

  // Handle inspection mode
  inspectButton.addEventListener('click', () => {
    // Toggle inspection mode
    isInspectionMode = !isInspectionMode;

    if (isInspectionMode) {
      // Reset keyboard navigation state
      focusableElements = [];
      currentFocusIndex = -1;

      // Find the AUT iframe
      autIframe = getAutIframe();

      if (!autIframe) {
        // Show error message if iframe not found
        statusMessage.innerHTML = '';
        const iconSpan = window.top.document.createElement('span');
        iconSpan.innerHTML = ICONS.error;
        iconSpan.style.cssText = `
          margin-right: 8px;
          vertical-align: middle;
        `;

        const textSpan = window.top.document.createElement('span');
        textSpan.textContent = 'Error: Application iframe not found. Please make sure the application is loaded.';
        textSpan.style.cssText = `
          vertical-align: middle;
        `;

        statusMessage.appendChild(iconSpan);
        statusMessage.appendChild(textSpan);
        statusMessage.style.borderLeftColor = '#f44336';
        statusMessage.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';

        isInspectionMode = false;
        return;
      }

      // Get the iframe's document
      try {
        iframeDocument = autIframe.contentDocument || (autIframe.contentWindow && autIframe.contentWindow.document);

        if (!iframeDocument) {
          throw new Error('Could not access iframe document');
        }
      } catch (error) {
        // Show error message if iframe document not accessible
        statusMessage.innerHTML = '';
        const iconSpan = window.top.document.createElement('span');
        iconSpan.innerHTML = ICONS.error;
        iconSpan.style.cssText = `
          margin-right: 8px;
          vertical-align: middle;
        `;

        const textSpan = window.top.document.createElement('span');
        textSpan.textContent = `Error: Could not access application iframe content. ${error.message}`;
        textSpan.style.cssText = `
          vertical-align: middle;
        `;

        statusMessage.appendChild(iconSpan);
        statusMessage.appendChild(textSpan);
        statusMessage.style.borderLeftColor = '#f44336';
        statusMessage.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';

        isInspectionMode = false;
        return;
      }

      // Update button to show active state
      inspectButton.style.backgroundColor = '#673ab7';
      inspectButton.style.boxShadow = '0 0 0 3px rgba(156, 39, 176, 0.3), 0 0 10px rgba(156, 39, 176, 0.2)';

      // Update status message
      statusMessage.innerHTML = '';
      const iconSpan = window.top.document.createElement('span');
      iconSpan.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>';
      iconSpan.style.cssText = `
        margin-right: 8px;
        vertical-align: middle;
      `;

      const textSpan = window.top.document.createElement('span');
      textSpan.innerHTML = 'Inspection mode active. Hover over elements in the application and click to select.<br>' +
                          '<strong>Keyboard Navigation:</strong> Press <kbd>Tab</kbd> to cycle through elements, <kbd>Enter</kbd> to select, <kbd>ESC</kbd> to cancel.';
      textSpan.style.cssText = `
        vertical-align: middle;
        line-height: 1.5;
      `;

      // Style for keyboard shortcuts
      const style = window.top.document.createElement('style');
      style.textContent = `
        #clicy-status kbd {
          background-color: #f7f7f7;
          border: 1px solid #ccc;
          border-radius: 3px;
          box-shadow: 0 1px 0 rgba(0,0,0,0.2);
          color: #333;
          display: inline-block;
          font-family: monospace;
          font-size: 11px;
          line-height: 1;
          padding: 2px 4px;
          margin: 0 2px;
          vertical-align: middle;
        }
      `;
      getTopWindow().document.head.appendChild(style);

      statusMessage.appendChild(iconSpan);
      statusMessage.appendChild(textSpan);
      statusMessage.style.borderLeftColor = '#9c27b0';
      statusMessage.style.backgroundColor = 'rgba(156, 39, 176, 0.1)';

      // Create highlight overlay and tooltip if they don't exist
      if (!highlightOverlay && iframeDocument) {
        highlightOverlay = createHighlightOverlay(iframeDocument);
        iframeDocument.body.appendChild(highlightOverlay);
      }

      if (!tooltipElement && iframeDocument) {
        tooltipElement = createTooltip(iframeDocument);
        iframeDocument.body.appendChild(tooltipElement);
      }

      // Change cursor style for the iframe document
      if (iframeDocument) {
        iframeDocument.body.style.cursor = 'crosshair';
      }

      // Add mouseover event listener to highlight elements in the iframe
      if (iframeDocument) {
        iframeDocument.addEventListener('mouseover', handleMouseOver);
      }

      // Add click event listener to select elements in the iframe
      if (iframeDocument) {
        iframeDocument.addEventListener('click', handleElementClick);
      }

      // Add ESC key listener to cancel inspection mode
      // We add this to both the iframe and the top document to ensure it works regardless of focus
      if (iframeDocument) {
        iframeDocument.addEventListener('keydown', handleKeyDown);
      }
      window.top.document.addEventListener('keydown', handleKeyDown);
    } else {
      // Exit inspection mode
      exitInspectionMode();
    }
  });

  // Handle mouse over elements during inspection
  const handleMouseOver = (event: MouseEvent) => {
    if (!isInspectionMode || !highlightOverlay || !tooltipElement || !iframeDocument) return;

    // Get the target element
    const targetElement = event.target as HTMLElement;

    // Get element position and dimensions
    const rect = targetElement.getBoundingClientRect();

    // Get the iframe's position
    const iframeRect = autIframe?.getBoundingClientRect() || { top: 0, left: 0 };

    // Position the highlight overlay relative to the iframe
    highlightOverlay.style.top = `${rect.top}px`;
    highlightOverlay.style.left = `${rect.left}px`;
    highlightOverlay.style.width = `${rect.width}px`;
    highlightOverlay.style.height = `${rect.height}px`;
    highlightOverlay.style.display = 'block';

    // Get the selector for this element
    const selector = getSelector(targetElement);

    // Position the tooltip
    tooltipElement.textContent = selector;
    tooltipElement.style.top = `${rect.top - tooltipElement.offsetHeight - 5}px`;
    tooltipElement.style.left = `${rect.left}px`;
    tooltipElement.style.display = 'block';

    // Adjust tooltip position if it goes off-screen
    const tooltipRect = tooltipElement.getBoundingClientRect();

    // Adjust left position if needed
    if (rect.left < 0) {
      tooltipElement.style.left = '0px';
    } else if (rect.left + tooltipRect.width > iframeDocument.documentElement.clientWidth) {
      tooltipElement.style.left = `${iframeDocument.documentElement.clientWidth - tooltipRect.width}px`;
    }

    // Adjust top position if needed
    if (rect.top - tooltipElement.offsetHeight - 5 < 0) {
      tooltipElement.style.top = `${rect.bottom + 5}px`;
    }

    // Prevent event propagation
    event.stopPropagation();
  };

  // Handle element click during inspection
  const handleElementClick = (event: MouseEvent) => {
    if (!isInspectionMode) return;

    // Get the target element
    const targetElement = event.target as HTMLElement;

    // Get the selector for this element
    const selector = getSelector(targetElement);

    // Check if we have an active command mode
    if (activeCommandMode === 'click-get') {
      // Insert the selector for click with get
      commandInput.value = `click("${selector}", "get")`;
    } else if (activeCommandMode === 'write-get') {
      // For write command, we need to check if there's already text in the input
      const writeMatch = commandInput.value.match(/write\(['"]?(.*?)['"]?,/);
      if (writeMatch && writeMatch[1]) {
        // Preserve the existing text
        const text = writeMatch[1];
        commandInput.value = `write("${text}", "${selector}", "get")`;
      } else {
        // If no text found, just add the selector with empty text
        commandInput.value = `write("", "${selector}", "get")`;

        // Position cursor inside the first quotes for the user to enter text
        setTimeout(() => {
          commandInput.setSelectionRange(7, 7);
          commandInput.focus();
        }, 0);
      }
    } else if (activeCommandMode === 'type') {
      // For type command, we need to check if there's already text in the input
      const typeMatch = commandInput.value.match(/type\(['"]?(.*?)['"]?,/);
      if (typeMatch && typeMatch[1]) {
        // Preserve the existing text
        const text = typeMatch[1];
        commandInput.value = `type("${text}", "${selector}")`;
      } else {
        // If no text found, just add the selector with empty text
        commandInput.value = `type("", "${selector}")`;

        // Position cursor inside the first quotes for the user to enter text
        setTimeout(() => {
          commandInput.setSelectionRange(6, 6);
          commandInput.focus();
        }, 0);
      }
    } else if (activeCommandMode === 'clear') {
      // Insert the selector for clear command
      commandInput.value = `clear("${selector}")`;
    } else if (activeCommandMode === 'check') {
      // Insert the selector for check command
      commandInput.value = `check("${selector}")`;
    } else if (activeCommandMode === 'uncheck') {
      // Insert the selector for uncheck command
      commandInput.value = `uncheck("${selector}")`;
    } else if (activeCommandMode === 'select') {
      // For select command, we need to add a value parameter
      commandInput.value = `select("${selector}", "")`;

      // Position cursor inside the second quotes for the user to enter the value
      setTimeout(() => {
        commandInput.setSelectionRange(commandInput.value.length - 2, commandInput.value.length - 2);
        commandInput.focus();
      }, 0);
    } else if (activeCommandMode === 'get') {
      // Insert the selector for get command
      commandInput.value = `get("${selector}")`;
    } else if (activeCommandMode === 'shouldContain') {
      // For shouldContain command, we need to add a text parameter
      commandInput.value = `shouldContain("${selector}", "")`;

      // Position cursor inside the second quotes for the user to enter the text
      setTimeout(() => {
        commandInput.setSelectionRange(commandInput.value.length - 2, commandInput.value.length - 2);
        commandInput.focus();
      }, 0);
    } else if (activeCommandMode === 'shouldBeVisible') {
      // Insert the selector for shouldBeVisible command
      commandInput.value = `shouldBeVisible("${selector}")`;
    } else if (activeCommandMode === 'shouldHaveValue') {
      // For shouldHaveValue command, we need to add a value parameter
      commandInput.value = `shouldHaveValue("${selector}", "")`;

      // Position cursor inside the second quotes for the user to enter the value
      setTimeout(() => {
        commandInput.setSelectionRange(commandInput.value.length - 2, commandInput.value.length - 2);
        commandInput.focus();
      }, 0);
    } else {
      // If no active command mode, check the current input value
      const command = commandInput.value;

      // Check if we're in a click or write command based on input value
      if (command.startsWith('click(')) {
        // Replace the selector in click('selector', 'get')
        commandInput.value = `click("${selector}", "get")`;
      } else if (command.startsWith('write(')) {
        // For write command, we need to preserve the text
        const writeMatch = command.match(/write\(['"]?(.*?)['"]?,/);
        if (writeMatch && writeMatch[1]) {
          const text = writeMatch[1];
          commandInput.value = `write("${text}", "${selector}", "get")`;
        } else {
          // If no text found, just add the selector
          commandInput.value = `write("", "${selector}", "get")`;

          // Position cursor inside the first quotes
          setTimeout(() => {
            commandInput.setSelectionRange(7, 7);
            commandInput.focus();
          }, 0);
        }
      } else {
        // Default to a get command
        commandInput.value = `get("${selector}")`;
      }
    }

    // Update status message
    statusMessage.innerHTML = '';
    const iconSpan = window.top.document.createElement('span');
    iconSpan.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    iconSpan.style.cssText = `
      margin-right: 8px;
      vertical-align: middle;
      color: #4CAF50;
    `;

    const textSpan = window.top.document.createElement('span');

    // Show different message based on active command mode
    if (activeCommandMode === 'click-get') {
      textSpan.textContent = `Selected element for click: ${selector}`;
    } else if (activeCommandMode === 'write-get') {
      textSpan.textContent = `Selected input element: ${selector}`;
    } else if (activeCommandMode === 'type') {
      textSpan.textContent = `Selected input element for type: ${selector}`;
    } else if (activeCommandMode === 'clear') {
      textSpan.textContent = `Selected input element to clear: ${selector}`;
    } else if (activeCommandMode === 'check') {
      textSpan.textContent = `Selected checkbox to check: ${selector}`;
    } else if (activeCommandMode === 'uncheck') {
      textSpan.textContent = `Selected checkbox to uncheck: ${selector}`;
    } else if (activeCommandMode === 'select') {
      textSpan.textContent = `Selected dropdown: ${selector}`;
    } else if (activeCommandMode === 'get') {
      textSpan.textContent = `Selected element for get: ${selector}`;
    } else if (activeCommandMode === 'shouldContain') {
      textSpan.textContent = `Selected element for assertion: ${selector}`;
    } else if (activeCommandMode === 'shouldBeVisible') {
      textSpan.textContent = `Selected element for visibility assertion: ${selector}`;
    } else if (activeCommandMode === 'shouldHaveValue') {
      textSpan.textContent = `Selected input for value assertion: ${selector}`;
    } else {
      textSpan.textContent = `Selected element: ${selector}`;
    }

    textSpan.style.cssText = `
      vertical-align: middle;
    `;

    statusMessage.appendChild(iconSpan);
    statusMessage.appendChild(textSpan);
    statusMessage.style.borderLeftColor = '#4CAF50';
    statusMessage.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';

    // Exit inspection mode
    exitInspectionMode();

    // Focus the command input
    commandInput.focus();

    // Prevent default behavior and event propagation
    event.preventDefault();
    event.stopPropagation();
  };

  // Function to find all focusable elements in the iframe
  const findFocusableElements = (): HTMLElement[] => {
    if (!iframeDocument) return [];

    // Selector for potentially focusable elements
    const selector = 'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"]), [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"], [role="tab"]';

    // Get all elements matching the selector
    const elements = Array.from(iframeDocument.querySelectorAll(selector)) as HTMLElement[];

    // Filter out hidden elements and those with display:none or visibility:hidden
    return elements.filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' &&
             style.visibility !== 'hidden' &&
             el.offsetWidth > 0 &&
             el.offsetHeight > 0;
    });
  };

  // Function to focus an element by index
  const focusElementByIndex = (index: number) => {
    if (index >= 0 && index < focusableElements.length && highlightOverlay && tooltipElement) {
      const element = focusableElements[index];
      currentFocusIndex = index;

      // Get element position and dimensions
      const rect = element.getBoundingClientRect();

      // Position the highlight overlay
      highlightOverlay.style.top = `${rect.top}px`;
      highlightOverlay.style.left = `${rect.left}px`;
      highlightOverlay.style.width = `${rect.width}px`;
      highlightOverlay.style.height = `${rect.height}px`;
      highlightOverlay.style.display = 'block';

      // Get the selector for this element
      const selector = getSelector(element);

      // Position the tooltip
      tooltipElement.textContent = selector;
      tooltipElement.style.top = `${rect.top - tooltipElement.offsetHeight - 5}px`;
      tooltipElement.style.left = `${rect.left}px`;
      tooltipElement.style.display = 'block';

      // Adjust tooltip position if it goes off-screen
      const tooltipRect = tooltipElement.getBoundingClientRect();

      // Adjust left position if needed
      if (rect.left < 0) {
        tooltipElement.style.left = '0px';
      } else if (rect.left + tooltipRect.width > (iframeDocument?.documentElement.clientWidth || 0)) {
        tooltipElement.style.left = `${(iframeDocument?.documentElement.clientWidth || 0) - tooltipRect.width}px`;
      }

      // Adjust top position if needed
      if (rect.top - tooltipElement.offsetHeight - 5 < 0) {
        tooltipElement.style.top = `${rect.bottom + 5}px`;
      }
    }
  };

  // Handle keydown events (for ESC, Tab, and Enter keys)
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isInspectionMode) return;

    if (event.key === 'Escape') {
      exitInspectionMode();
      event.preventDefault();
      event.stopPropagation();
    } else if (event.key === 'Tab') {
      // If this is the first Tab press, initialize the focusable elements
      if (focusableElements.length === 0) {
        focusableElements = findFocusableElements();
        currentFocusIndex = -1;
      }

      if (focusableElements.length > 0) {
        // Calculate the next index, wrapping around if necessary
        const nextIndex = event.shiftKey
          ? (currentFocusIndex <= 0 ? focusableElements.length - 1 : currentFocusIndex - 1)
          : (currentFocusIndex >= focusableElements.length - 1 ? 0 : currentFocusIndex + 1);

        focusElementByIndex(nextIndex);

        event.preventDefault();
        event.stopPropagation();
      }
    } else if (event.key === 'Enter' && currentFocusIndex >= 0 && currentFocusIndex < focusableElements.length) {
      // Simulate a click on the currently focused element
      const element = focusableElements[currentFocusIndex];

      // Get the selector for this element
      const selector = getSelector(element);

      // Check if we have an active command mode
      if (activeCommandMode === 'click-get') {
        // Insert the selector for click with get
        commandInput.value = `click("${selector}", "get")`;
      } else if (activeCommandMode === 'write-get') {
        // For write command, we need to check if there's already text in the input
        const writeMatch = commandInput.value.match(/write\(['"]?(.*?)['"]?,/);
        if (writeMatch && writeMatch[1]) {
          // Preserve the existing text
          const text = writeMatch[1];
          commandInput.value = `write("${text}", "${selector}", "get")`;
        } else {
          // If no text found, just add the selector with empty text
          commandInput.value = `write("", "${selector}", "get")`;

          // Position cursor inside the first quotes for the user to enter text
          setTimeout(() => {
            commandInput.setSelectionRange(7, 7);
            commandInput.focus();
          }, 0);
        }
      } else if (activeCommandMode === 'type') {
        // For type command, we need to check if there's already text in the input
        const typeMatch = commandInput.value.match(/type\(['"]?(.*?)['"]?,/);
        if (typeMatch && typeMatch[1]) {
          // Preserve the existing text
          const text = typeMatch[1];
          commandInput.value = `type("${text}", "${selector}")`;
        } else {
          // If no text found, just add the selector with empty text
          commandInput.value = `type("", "${selector}")`;

          // Position cursor inside the first quotes for the user to enter text
          setTimeout(() => {
            commandInput.setSelectionRange(6, 6);
            commandInput.focus();
          }, 0);
        }
      } else if (activeCommandMode === 'clear') {
        // Insert the selector for clear command
        commandInput.value = `clear("${selector}")`;
      } else if (activeCommandMode === 'check') {
        // Insert the selector for check command
        commandInput.value = `check("${selector}")`;
      } else if (activeCommandMode === 'uncheck') {
        // Insert the selector for uncheck command
        commandInput.value = `uncheck("${selector}")`;
      } else if (activeCommandMode === 'select') {
        // For select command, we need to add a value parameter
        commandInput.value = `select("${selector}", "")`;

        // Position cursor inside the second quotes for the user to enter the value
        setTimeout(() => {
          commandInput.setSelectionRange(commandInput.value.length - 2, commandInput.value.length - 2);
          commandInput.focus();
        }, 0);
      } else if (activeCommandMode === 'get') {
        // Insert the selector for get command
        commandInput.value = `get("${selector}")`;
      } else if (activeCommandMode === 'shouldContain') {
        // For shouldContain command, we need to add a text parameter
        commandInput.value = `shouldContain("${selector}", "")`;

        // Position cursor inside the second quotes for the user to enter the text
        setTimeout(() => {
          commandInput.setSelectionRange(commandInput.value.length - 2, commandInput.value.length - 2);
          commandInput.focus();
        }, 0);
      } else if (activeCommandMode === 'shouldBeVisible') {
        // Insert the selector for shouldBeVisible command
        commandInput.value = `shouldBeVisible("${selector}")`;
      } else if (activeCommandMode === 'shouldHaveValue') {
        // For shouldHaveValue command, we need to add a value parameter
        commandInput.value = `shouldHaveValue("${selector}", "")`;

        // Position cursor inside the second quotes for the user to enter the value
        setTimeout(() => {
          commandInput.setSelectionRange(commandInput.value.length - 2, commandInput.value.length - 2);
          commandInput.focus();
        }, 0);
      } else {
        // If no active command mode, check the current input value
        const command = commandInput.value;

        // Check if we're in a click or write command based on input value
        if (command.startsWith('click(')) {
          // Replace the selector in click('selector', 'get')
          commandInput.value = `click("${selector}", "get")`;
        } else if (command.startsWith('write(')) {
          // For write command, we need to preserve the text
          const writeMatch = command.match(/write\(['"]?(.*?)['"]?,/);
          if (writeMatch && writeMatch[1]) {
            const text = writeMatch[1];
            commandInput.value = `write("${text}", "${selector}", "get")`;
          } else {
            // If no text found, just add the selector
            commandInput.value = `write("", "${selector}", "get")`;

            // Position cursor inside the first quotes
            setTimeout(() => {
              commandInput.setSelectionRange(7, 7);
              commandInput.focus();
            }, 0);
          }
        } else {
          // Default to a get command
          commandInput.value = `get("${selector}")`;
        }
      }

      // Update status message
      statusMessage.innerHTML = '';
      const iconSpan = window.top.document.createElement('span');
      iconSpan.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      iconSpan.style.cssText = `
        margin-right: 8px;
        vertical-align: middle;
        color: #4CAF50;
      `;

      const textSpan = window.top.document.createElement('span');

      // Show different message based on active command mode
      if (activeCommandMode === 'click-get') {
        textSpan.textContent = `Selected element for click: ${selector}`;
      } else if (activeCommandMode === 'write-get') {
        textSpan.textContent = `Selected input element: ${selector}`;
      } else if (activeCommandMode === 'type') {
        textSpan.textContent = `Selected input element for type: ${selector}`;
      } else if (activeCommandMode === 'clear') {
        textSpan.textContent = `Selected input element to clear: ${selector}`;
      } else if (activeCommandMode === 'check') {
        textSpan.textContent = `Selected checkbox to check: ${selector}`;
      } else if (activeCommandMode === 'uncheck') {
        textSpan.textContent = `Selected checkbox to uncheck: ${selector}`;
      } else if (activeCommandMode === 'select') {
        textSpan.textContent = `Selected dropdown: ${selector}`;
      } else if (activeCommandMode === 'get') {
        textSpan.textContent = `Selected element for get: ${selector}`;
      } else if (activeCommandMode === 'shouldContain') {
        textSpan.textContent = `Selected element for assertion: ${selector}`;
      } else if (activeCommandMode === 'shouldBeVisible') {
        textSpan.textContent = `Selected element for visibility assertion: ${selector}`;
      } else if (activeCommandMode === 'shouldHaveValue') {
        textSpan.textContent = `Selected input for value assertion: ${selector}`;
      } else {
        textSpan.textContent = `Selected element: ${selector}`;
      }

      textSpan.style.cssText = `
        vertical-align: middle;
      `;

      statusMessage.appendChild(iconSpan);
      statusMessage.appendChild(textSpan);
      statusMessage.style.borderLeftColor = '#4CAF50';
      statusMessage.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';

      // Exit inspection mode
      exitInspectionMode();

      // Focus the command input
      commandInput.focus();

      event.preventDefault();
      event.stopPropagation();
    }
  };

  // Check if an element is part of the REPL panel
  const isPartOfReplPanel = (element: HTMLElement): boolean => {
    let current: HTMLElement | null = element;

    while (current) {
      if (current === replContainer) {
        return true;
      }
      current = current.parentElement;
    }

    return false;
  };

  // Hide highlight and tooltip
  const hideHighlightAndTooltip = () => {
    if (highlightOverlay) {
      highlightOverlay.style.display = 'none';
    }

    if (tooltipElement) {
      tooltipElement.style.display = 'none';
    }
  };

  // Exit inspection mode
  const exitInspectionMode = () => {
    isInspectionMode = false;

    // Reset button style
    inspectButton.style.backgroundColor = '';
    inspectButton.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1)';

    // Hide highlight and tooltip
    hideHighlightAndTooltip();

    // Reset cursor in the iframe
    if (iframeDocument) {
      iframeDocument.body.style.cursor = '';

      // Remove event listeners from iframe
      iframeDocument.removeEventListener('mouseover', handleMouseOver);
      iframeDocument.removeEventListener('click', handleElementClick);
      iframeDocument.removeEventListener('keydown', handleKeyDown);

      // Remove highlight and tooltip from iframe if they exist
      if (highlightOverlay && highlightOverlay.parentNode) {
        highlightOverlay.parentNode.removeChild(highlightOverlay);
        highlightOverlay = null;
      }

      if (tooltipElement && tooltipElement.parentNode) {
        tooltipElement.parentNode.removeChild(tooltipElement);
        tooltipElement = null;
      }
    }

    // Remove event listener from top document
    window.top.document.removeEventListener('keydown', handleKeyDown);

    // Reset status message if it's still showing inspection mode
    if (statusMessage.textContent?.includes('Inspection mode active')) {
      statusMessage.textContent = 'Ready to execute commands';
      statusMessage.style.borderLeftColor = '#4a88ff';
      statusMessage.style.backgroundColor = 'rgba(74, 136, 255, 0.1)';
    }

    // Reset iframe references
    autIframe = null;
    iframeDocument = null;

    // Reset keyboard navigation state
    focusableElements = [];
    currentFocusIndex = -1;

    // Reset active command mode
    activeCommandMode = null;
  };


  // Add timeout to fetch request
  const fetchWithTimeout = (url, options, timeout = 10000) => {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), timeout)
      )
    ]);
  };

  // Try to fetch with retry logic
  const fetchWithRetry = (url, options, retries = 3, delay = 1000) => {
    return new Promise((resolve, reject) => {
      const attempt = (attemptsLeft) => {
        fetchWithTimeout(url, options)
          .then(resolve)
          .catch(error => {
            if (attemptsLeft === 0) {
              console.error('[CLICY DEBUG] All retry attempts failed:', error);
              reject(error);
              return;
            }

            console.log(`[CLICY DEBUG] Retrying connection (${retries - attemptsLeft + 1}/${retries})...`);
            statusMessage.textContent = `Retrying connection (${retries - attemptsLeft + 1}/${retries})...`;
            statusMessage.style.borderLeftColor = '#FF9800';
            statusMessage.style.backgroundColor = 'rgba(255, 152, 0, 0.1)';
            statusMessage.style.color = 'rgba(255, 255, 255, 0.9)';
            setTimeout(() => attempt(attemptsLeft - 1), delay);
          });
      };

      attempt(retries);
    });
  };

  // Add event listeners
  runButton.addEventListener('click', () => {
    console.log('[CLICY DEBUG] Run button clicked');
    const command = commandInput.value.trim();
    if (!command) {
      statusMessage.textContent = 'Please enter a command';
      statusMessage.style.borderLeftColor = '#f44336';
      statusMessage.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
      statusMessage.style.color = 'rgba(255, 255, 255, 0.9)';
      return;
    }

    // Check for potential canvas-related commands that might cause duplicate declarations
    if (command.includes('createCanvas') || command.includes('getContext')) {
      console.warn('[CLICY DEBUG] Detected potential canvas-related command that might cause duplicate declarations');

      // Show a warning message to the user
      statusMessage.innerHTML = '';
      const iconSpan = window.top.document.createElement('span');
      iconSpan.innerHTML = ICONS.warning;
      iconSpan.style.cssText = `
        margin-right: 8px;
        vertical-align: middle;
      `;

      const textSpan = window.top.document.createElement('span');
      textSpan.textContent = 'Warning: This command might cause duplicate declarations. Consider using a different approach.';
      textSpan.style.cssText = `
        vertical-align: middle;
      `;

      statusMessage.appendChild(iconSpan);
      statusMessage.appendChild(textSpan);
      statusMessage.style.borderLeftColor = '#FF9800';
      statusMessage.style.backgroundColor = 'rgba(255, 152, 0, 0.1)';

      // Don't execute the command to prevent errors
      return;
    }

    // Process special commands like goto, click, write, get, contains
    let processedCommand = command;

    // Handle goto command with URL processing
    if (processedCommand.startsWith('goto(')) {
      // Extract the URL from goto('url')
      const urlMatch = processedCommand.match(/goto\(['"]?(.*?)['"]?\)/);
      if (urlMatch && urlMatch[1]) {
        let url = urlMatch[1];

        // Add https:// protocol if the URL doesn't have one
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }

        processedCommand = `visit("${url}")`;
      }
    }
    // Handle click command
    else if (processedCommand.startsWith('click(')) {
      // Check if the command includes a selector type
      if (processedCommand.split(',').length > 1) {
        // Extract selector and selector type from click('selector', 'selectorType')
        const clickMatch = processedCommand.match(/click\(['"]?(.*?)['"]?,\s*['"]?(.*?)['"]?\)/);
        if (clickMatch && clickMatch[1] && clickMatch[2]) {
          const selector = clickMatch[1];
          const selectorType = clickMatch[2];

          if (selectorType === 'get') {
            processedCommand = `get("${selector}").click()`;
          } else {
            // Default to contains
            processedCommand = `contains("${selector}").click()`;
          }
        }
      } else {
        // Extract the label from click('label')
        const labelMatch = processedCommand.match(/click\(['"]?(.*?)['"]?\)/);
        if (labelMatch && labelMatch[1]) {
          const label = labelMatch[1];
          processedCommand = `contains("${label}").click()`;
        }
      }
    }
    // Handle write command
    else if (processedCommand.startsWith('write(')) {
      // Check if the command includes a selector type
      if (processedCommand.split(',').length > 2) {
        // Extract text, selector, and selector type from write('text', 'selector', 'selectorType')
        const writeMatch = processedCommand.match(/write\(['"]?(.*?)['"]?,\s*['"]?(.*?)['"]?,\s*['"]?(.*?)['"]?\)/);
        if (writeMatch && writeMatch[1] && writeMatch[2] && writeMatch[3]) {
          const text = writeMatch[1];
          const selector = writeMatch[2];
          const selectorType = writeMatch[3];

          if (selectorType === 'get') {
            processedCommand = `get("${selector}").type("${text}")`;
          } else {
            // Default to contains
            processedCommand = `contains("${selector}").parent().find('input').type("${text}")`;
          }
        }
      } else {
        // Extract text and field from write('text', 'field')
        const writeMatch = processedCommand.match(/write\(['"]?(.*?)['"]?,\s*['"]?(.*?)['"]?\)/);
        if (writeMatch && writeMatch[1] && writeMatch[2]) {
          const text = writeMatch[1];
          const field = writeMatch[2];
          processedCommand = `contains("${field}").parent().find('input').type("${text}")`;
        }
      }
    }
    // Handle get command
    else if (processedCommand.startsWith('get(')) {
      // Extract the selector from get('selector')
      const selectorMatch = processedCommand.match(/get\(['"]?(.*?)['"]?\)/);
      if (selectorMatch && selectorMatch[1]) {
        const selector = selectorMatch[1];
        processedCommand = `get("${selector}")`;
      }
    }
    // Handle contains command
    else if (processedCommand.startsWith('contains(')) {
      // Extract the text from contains('text')
      const textMatch = processedCommand.match(/contains\(['"]?(.*?)['"]?\)/);
      if (textMatch && textMatch[1]) {
        const text = textMatch[1];
        processedCommand = `contains("${text}")`;
      }
    }
    // Handle shouldBeVisible command
    else if (processedCommand.startsWith('shouldBeVisible(')) {
      // Extract the selector from shouldBeVisible('selector')
      const selectorMatch = processedCommand.match(/shouldBeVisible\(['"]?(.*?)['"]?\)/);
      if (selectorMatch && selectorMatch[1]) {
        const selector = selectorMatch[1];
        processedCommand = `get("${selector}").should("be.visible")`;
      }
    }
    // Handle shouldContain command
    else if (processedCommand.startsWith('shouldContain(')) {
      // Extract the selector and text from shouldContain('selector', 'text')
      const match = processedCommand.match(/shouldContain\(['"]?(.*?)['"]?,\s*['"]?(.*?)['"]?\)/);
      if (match && match[1] && match[2]) {
        const selector = match[1];
        const text = match[2];
        processedCommand = `get("${selector}").should("contain", "${text}")`;
      }
    }
    // Handle shouldHaveValue command
    else if (processedCommand.startsWith('shouldHaveValue(')) {
      // Extract the selector and value from shouldHaveValue('selector', 'value')
      const match = processedCommand.match(/shouldHaveValue\(['"]?(.*?)['"]?,\s*['"]?(.*?)['"]?\)/);
      if (match && match[1] && match[2]) {
        const selector = match[1];
        const value = match[2];
        processedCommand = `get("${selector}").should("have.value", "${value}")`;
      }
    }
    // Handle wait command with numeric suffix (e.g., wait3000 or wait3000())
    else if (/^wait\d+(\(\))?$/.test(processedCommand)) {
      // Extract the number from the command (e.g., 3000 from wait3000 or wait3000())
      const waitTime = processedCommand.replace(/wait(\d+)(?:\(\))?/, '$1');
      if (!isNaN(parseInt(waitTime))) {
        // Use a safer approach that avoids duplicate function declarations
        processedCommand = `wait(${waitTime})`;

        // Add a comment to explain the fix
        console.log(`[CLICY DEBUG] Converted wait${waitTime} to wait(${waitTime}) to avoid potential duplicate function declarations`);
      }
    }

    // Convert the command to Cypress syntax
    const cypressCommand = `cy.${processedCommand}`;

    statusMessage.textContent = 'Sending command...';
    statusMessage.style.borderLeftColor = '#2196F3';
    statusMessage.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';
    statusMessage.style.color = 'rgba(255, 255, 255, 0.9)';

    // Send the command to the server
    const serverUrl = 'http://localhost:4000/command';
    statusMessage.textContent = `Sending command to ${serverUrl}...`;
    statusMessage.style.borderLeftColor = '#2196F3';
    statusMessage.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';
    statusMessage.style.color = 'rgba(255, 255, 255, 0.9)';

    // Debug log
    console.log(`[CLICY DEBUG] Sending command: ${cypressCommand}`);

    fetchWithRetry(serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ command: cypressCommand }),
    })
      .then(response => {
        console.log(`[CLICY DEBUG] Server response status: ${response.status}`);
        return (response as Response).json();
      })
      .then(data => {
        console.log(`[CLICY DEBUG] Server response data:`, data);
        if (data.success) {
          // Create success message with icon
          statusMessage.innerHTML = '';

          const iconSpan = window.top.document.createElement('span');
          iconSpan.innerHTML = ICONS.success;
          iconSpan.style.cssText = `
            margin-right: 8px;
            vertical-align: middle;
          `;

          const textSpan = window.top.document.createElement('span');
          textSpan.textContent = 'Command executed successfully';
          textSpan.style.cssText = `
            vertical-align: middle;
          `;

          statusMessage.appendChild(iconSpan);
          statusMessage.appendChild(textSpan);

          statusMessage.style.borderLeftColor = '#4CAF50';
          statusMessage.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
          statusMessage.style.color = 'rgba(255, 255, 255, 0.9)';
          commandInput.value = '';
        } else {
          // Create error message with icon
          statusMessage.innerHTML = '';

          const iconSpan = window.top.document.createElement('span');
          iconSpan.innerHTML = ICONS.error;
          iconSpan.style.cssText = `
            margin-right: 8px;
            vertical-align: middle;
          `;

          const textSpan = window.top.document.createElement('span');
          textSpan.textContent = `Error: ${data.error}`;
          textSpan.style.cssText = `
            vertical-align: middle;
          `;

          statusMessage.appendChild(iconSpan);
          statusMessage.appendChild(textSpan);

          statusMessage.style.borderLeftColor = '#f44336';
          statusMessage.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
          statusMessage.style.color = 'rgba(255, 255, 255, 0.9)';
        }
      })
      .catch(error => {
        console.error(`[CLICY DEBUG] Fetch error:`, error);

        // Clear the status message
        statusMessage.innerHTML = '';

        // Create error message with icon
        const iconSpan = window.top.document.createElement('span');
        iconSpan.innerHTML = ICONS.error;
        iconSpan.style.cssText = `
          margin-right: 8px;
          vertical-align: middle;
        `;

        const textSpan = window.top.document.createElement('span');
        textSpan.textContent = `Error: ${(error as Error).message}. Waiting for server to respond...`;
        textSpan.style.cssText = `
          vertical-align: middle;
        `;

        statusMessage.appendChild(iconSpan);
        statusMessage.appendChild(textSpan);

        // Add a button to retry the connection
        const startServerButton = window.top.document.createElement('button');
        startServerButton.textContent = 'Retry Connection';
        startServerButton.style.cssText = `
          margin-left: 10px;
          padding: 4px 8px;
          background: #4a88ff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        `;

        startServerButton.addEventListener('click', () => {
          // Update status message
          statusMessage.innerHTML = '';
          const loadingSpan = window.top.document.createElement('span');
          loadingSpan.textContent = 'Starting server...';
          statusMessage.appendChild(loadingSpan);
          statusMessage.style.borderLeftColor = '#2196F3';
          statusMessage.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';
          statusMessage.style.color = 'rgba(255, 255, 255, 0.9)';

          // Start the server using the start.ts script
          try {
            // Use fetch to call a local endpoint that will trigger the server start
            // This is just a ping to see if we can reach the server after a delay
            setTimeout(() => {
              // Open a new window to run the npm command
              const serverWindow = window.top.open('', '_blank');
              if (serverWindow) {
                serverWindow.document.write(`
                  <html>
                    <head>
                      <title>Starting Clicy Server</title>
                      <style>
                        body { 
                          font-family: Arial, sans-serif; 
                          background: #1a2530;
                          color: white;
                          padding: 20px;
                        }
                        pre {
                          background: rgba(0,0,0,0.2);
                          padding: 10px;
                          border-radius: 4px;
                          overflow: auto;
                        }
                      </style>
                    </head>
                    <body>
                      <h2>Starting Clicy Server</h2>
                      <p>Please keep this window open while using Clicy.</p>
                      <p>You can close this window when you're done using Clicy.</p>
                      <p>Running: <code>npm run clicy:server</code></p>
                      <pre id="output">Starting server...\n</pre>
                      <script>
                        // This script would ideally start the server, but browser security prevents it
                        // Instead, we'll show instructions
                        document.getElementById('output').textContent += 'For security reasons, the browser cannot start the server automatically.\\n\\n';
                        document.getElementById('output').textContent += 'Please open a terminal and run:\\n';
                        document.getElementById('output').textContent += 'npm run clicy:server\\n\\n';
                        document.getElementById('output').textContent += 'Or use the combined command that starts both server and Cypress:\\n';
                        document.getElementById('output').textContent += 'npm run clicy:start\\n';
                      </script>
                    </body>
                  </html>
                `);
                serverWindow.document.close();
              }

              // Check if the server is now running
              fetch('http://localhost:4000/commands', { method: 'GET' })
                .then(() => {
                  // Server is running now
                  statusMessage.innerHTML = '';
                  const successSpan = window.top.document.createElement('span');
                  successSpan.innerHTML = ICONS.success;
                  successSpan.style.cssText = `
                    margin-right: 8px;
                    vertical-align: middle;
                  `;

                  const successTextSpan = window.top.document.createElement('span');
                  successTextSpan.textContent = 'Server started successfully! Try your command again.';
                  successTextSpan.style.cssText = `
                    vertical-align: middle;
                  `;

                  statusMessage.appendChild(successSpan);
                  statusMessage.appendChild(successTextSpan);
                  statusMessage.style.borderLeftColor = '#4CAF50';
                  statusMessage.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
                  statusMessage.style.color = 'rgba(255, 255, 255, 0.9)';
                })
                .catch(() => {
                  // Server still not running
                  statusMessage.innerHTML = '';
                  const errorSpan = window.top.document.createElement('span');
                  errorSpan.innerHTML = ICONS.error;
                  errorSpan.style.cssText = `
                    margin-right: 8px;
                    vertical-align: middle;
                  `;

                  const errorTextSpan = window.top.document.createElement('span');
                  errorTextSpan.textContent = 'Could not start server automatically. Please run "npm run clicy:server" in a terminal, or use "npm run clicy:start" to start both server and Cypress.';
                  errorTextSpan.style.cssText = `
                    vertical-align: middle;
                  `;

                  statusMessage.appendChild(errorSpan);
                  statusMessage.appendChild(errorTextSpan);
                  statusMessage.style.borderLeftColor = '#f44336';
                  statusMessage.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
                  statusMessage.style.color = 'rgba(255, 255, 255, 0.9)';
                });
            }, 2000);
          } catch (err) {
            console.error('[CLICY DEBUG] Error starting server:', err);
            statusMessage.innerHTML = '';
            const errorSpan = window.top.document.createElement('span');
            errorSpan.innerHTML = ICONS.error;
            errorSpan.style.cssText = `
              margin-right: 8px;
              vertical-align: middle;
            `;

            const errorTextSpan = window.top.document.createElement('span');
            errorTextSpan.textContent = `Error starting server: ${err.message}. Please run "npm run clicy:server" in a terminal, or use "npm run clicy:start" to start both server and Cypress.`;
            errorTextSpan.style.cssText = `
              vertical-align: middle;
            `;

            statusMessage.appendChild(errorSpan);
            statusMessage.appendChild(errorTextSpan);
            statusMessage.style.borderLeftColor = '#f44336';
            statusMessage.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
            statusMessage.style.color = 'rgba(255, 255, 255, 0.9)';
          }
        });

        statusMessage.appendChild(startServerButton);

        // Add a link to the documentation
        const docLink = window.top.document.createElement('a');
        docLink.href = 'https://github.com/yourusername/clicy#troubleshooting';
        docLink.target = '_blank';
        docLink.textContent = 'View troubleshooting guide';
        docLink.style.cssText = `
          margin-left: 10px;
          color: #4a88ff;
          text-decoration: underline;
          cursor: pointer;
          font-size: 12px;
        `;

        statusMessage.appendChild(docLink);

        statusMessage.style.borderLeftColor = '#f44336';
        statusMessage.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
        statusMessage.style.color = 'rgba(255, 255, 255, 0.9)';
      });
  });

  exportButton.addEventListener('click', () => {
    statusMessage.textContent = 'Exporting commands...';
    statusMessage.style.borderLeftColor = '#2196F3';
    statusMessage.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';
    statusMessage.style.color = 'rgba(255, 255, 255, 0.9)';

    const serverUrl = 'http://localhost:4000/export';

    fetchWithRetry(serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => (response as Response).json())
      .then(data => {
        if (data.success) {
          // Create success message with icon
          statusMessage.innerHTML = '';

          const iconSpan = window.top.document.createElement('span');
          iconSpan.innerHTML = ICONS.success;
          iconSpan.style.cssText = `
            margin-right: 8px;
            vertical-align: middle;
          `;

          const textSpan = window.top.document.createElement('span');
          textSpan.textContent = 'Commands exported successfully';
          textSpan.style.cssText = `
            vertical-align: middle;
          `;

          statusMessage.appendChild(iconSpan);
          statusMessage.appendChild(textSpan);

          statusMessage.style.borderLeftColor = '#4CAF50';
          statusMessage.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
          statusMessage.style.color = 'rgba(255, 255, 255, 0.9)';
        } else {
          // Create error message with icon
          statusMessage.innerHTML = '';

          const iconSpan = window.top.document.createElement('span');
          iconSpan.innerHTML = ICONS.error;
          iconSpan.style.cssText = `
            margin-right: 8px;
            vertical-align: middle;
          `;

          const textSpan = window.top.document.createElement('span');
          textSpan.textContent = `Error: ${data.error}`;
          textSpan.style.cssText = `
            vertical-align: middle;
          `;

          statusMessage.appendChild(iconSpan);
          statusMessage.appendChild(textSpan);

          statusMessage.style.borderLeftColor = '#f44336';
          statusMessage.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
          statusMessage.style.color = 'rgba(255, 255, 255, 0.9)';
        }
      })
      .catch(error => {
        console.error('Export error:', error);

        // Clear the status message
        statusMessage.innerHTML = '';

        // Create error message with icon
        const iconSpan = window.top.document.createElement('span');
        iconSpan.innerHTML = ICONS.error;
        iconSpan.style.cssText = `
          margin-right: 8px;
          vertical-align: middle;
        `;

        const textSpan = window.top.document.createElement('span');
        textSpan.textContent = `Error: ${(error as Error).message}. Waiting for server to respond...`;
        textSpan.style.cssText = `
          vertical-align: middle;
        `;

        statusMessage.appendChild(iconSpan);
        statusMessage.appendChild(textSpan);

        // Add a button to retry the connection
        const startServerButton = window.top.document.createElement('button');
        startServerButton.textContent = 'Retry Connection';
        startServerButton.style.cssText = `
          margin-left: 10px;
          padding: 4px 8px;
          background: #4a88ff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        `;

        startServerButton.addEventListener('click', () => {
          // Update status message
          statusMessage.innerHTML = '';
          const loadingSpan = window.top.document.createElement('span');
          loadingSpan.textContent = 'Starting server...';
          statusMessage.appendChild(loadingSpan);
          statusMessage.style.borderLeftColor = '#2196F3';
          statusMessage.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';
          statusMessage.style.color = 'rgba(255, 255, 255, 0.9)';

          // Start the server using the start.ts script
          try {
            // Use fetch to call a local endpoint that will trigger the server start
            // This is just a ping to see if we can reach the server after a delay
            setTimeout(() => {
              // Open a new window to run the npm command
              const serverWindow = window.top.open('', '_blank');
              if (serverWindow) {
                serverWindow.document.write(`
                  <html>
                    <head>
                      <title>Starting Clicy Server</title>
                      <style>
                        body { 
                          font-family: Arial, sans-serif; 
                          background: #1a2530;
                          color: white;
                          padding: 20px;
                        }
                        pre {
                          background: rgba(0,0,0,0.2);
                          padding: 10px;
                          border-radius: 4px;
                          overflow: auto;
                        }
                      </style>
                    </head>
                    <body>
                      <h2>Starting Clicy Server</h2>
                      <p>Please keep this window open while using Clicy.</p>
                      <p>You can close this window when you're done using Clicy.</p>
                      <p>Running: <code>npm run clicy:server</code></p>
                      <pre id="output">Starting server...\n</pre>
                      <script>
                        // This script would ideally start the server, but browser security prevents it
                        // Instead, we'll show instructions
                        document.getElementById('output').textContent += 'For security reasons, the browser cannot start the server automatically.\\n\\n';
                        document.getElementById('output').textContent += 'Please open a terminal and run:\\n';
                        document.getElementById('output').textContent += 'npm run clicy:server\\n\\n';
                        document.getElementById('output').textContent += 'Or use the combined command that starts both server and Cypress:\\n';
                        document.getElementById('output').textContent += 'npm run clicy:start\\n';
                      </script>
                    </body>
                  </html>
                `);
                serverWindow.document.close();
              }

              // Check if the server is now running
              fetch('http://localhost:4000/commands', { method: 'GET' })
                .then(() => {
                  // Server is running now
                  statusMessage.innerHTML = '';
                  const successSpan = window.top.document.createElement('span');
                  successSpan.innerHTML = ICONS.success;
                  successSpan.style.cssText = `
                    margin-right: 8px;
                    vertical-align: middle;
                  `;

                  const successTextSpan = window.top.document.createElement('span');
                  successTextSpan.textContent = 'Server started successfully! Try your command again.';
                  successTextSpan.style.cssText = `
                    vertical-align: middle;
                  `;

                  statusMessage.appendChild(successSpan);
                  statusMessage.appendChild(successTextSpan);
                  statusMessage.style.borderLeftColor = '#4CAF50';
                  statusMessage.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
                  statusMessage.style.color = 'rgba(255, 255, 255, 0.9)';
                })
                .catch(() => {
                  // Server still not running
                  statusMessage.innerHTML = '';
                  const errorSpan = window.top.document.createElement('span');
                  errorSpan.innerHTML = ICONS.error;
                  errorSpan.style.cssText = `
                    margin-right: 8px;
                    vertical-align: middle;
                  `;

                  const errorTextSpan = window.top.document.createElement('span');
                  errorTextSpan.textContent = 'Could not start server automatically. Please run "npm run clicy:server" in a terminal, or use "npm run clicy:start" to start both server and Cypress.';
                  errorTextSpan.style.cssText = `
                    vertical-align: middle;
                  `;

                  statusMessage.appendChild(errorSpan);
                  statusMessage.appendChild(errorTextSpan);
                  statusMessage.style.borderLeftColor = '#f44336';
                  statusMessage.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
                  statusMessage.style.color = 'rgba(255, 255, 255, 0.9)';
                });
            }, 2000);
          } catch (err) {
            console.error('[CLICY DEBUG] Error starting server:', err);
            statusMessage.innerHTML = '';
            const errorSpan = window.top.document.createElement('span');
            errorSpan.innerHTML = ICONS.error;
            errorSpan.style.cssText = `
              margin-right: 8px;
              vertical-align: middle;
            `;

            const errorTextSpan = window.top.document.createElement('span');
            errorTextSpan.textContent = `Error starting server: ${err.message}. Please run "npm run clicy:server" in a terminal, or use "npm run clicy:start" to start both server and Cypress.`;
            errorTextSpan.style.cssText = `
              vertical-align: middle;
            `;

            statusMessage.appendChild(errorSpan);
            statusMessage.appendChild(errorTextSpan);
            statusMessage.style.borderLeftColor = '#f44336';
            statusMessage.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
            statusMessage.style.color = 'rgba(255, 255, 255, 0.9)';
          }
        });

        statusMessage.appendChild(startServerButton);

        // Add a link to the documentation
        const docLink = window.top.document.createElement('a');
        docLink.href = 'https://github.com/yourusername/clicy#troubleshooting';
        docLink.target = '_blank';
        docLink.textContent = 'View troubleshooting guide';
        docLink.style.cssText = `
          margin-left: 10px;
          color: #4a88ff;
          text-decoration: underline;
          cursor: pointer;
          font-size: 12px;
        `;

        statusMessage.appendChild(docLink);

        statusMessage.style.borderLeftColor = '#f44336';
        statusMessage.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
        statusMessage.style.color = 'rgba(255, 255, 255, 0.9)';
      });
  });

  resetButton.addEventListener('click', () => {
    if (getTopWindow().confirm('Are you sure you want to reset all commands?')) {
      statusMessage.textContent = 'Resetting commands...';
      statusMessage.style.borderLeftColor = '#2196F3';
      statusMessage.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';
      statusMessage.style.color = 'rgba(255, 255, 255, 0.9)';

      const serverUrl = 'http://localhost:4000/reset';

      fetchWithRetry(serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then(response => (response as Response).json())
        .then(data => {
          if (data.success) {
            // Create success message with icon
            statusMessage.innerHTML = '';

            const iconSpan = window.top.document.createElement('span');
            iconSpan.innerHTML = ICONS.success;
            iconSpan.style.cssText = `
              margin-right: 8px;
              vertical-align: middle;
            `;

            const textSpan = window.top.document.createElement('span');
            textSpan.textContent = 'Commands reset successfully';
            textSpan.style.cssText = `
              vertical-align: middle;
            `;

            statusMessage.appendChild(iconSpan);
            statusMessage.appendChild(textSpan);

            statusMessage.style.borderLeftColor = '#4CAF50';
            statusMessage.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
            statusMessage.style.color = 'rgba(255, 255, 255, 0.9)';
          } else {
            // Create error message with icon
            statusMessage.innerHTML = '';

            const iconSpan = window.top.document.createElement('span');
            iconSpan.innerHTML = ICONS.error;
            iconSpan.style.cssText = `
              margin-right: 8px;
              vertical-align: middle;
            `;

            const textSpan = window.top.document.createElement('span');
            textSpan.textContent = `Error: ${data.error}`;
            textSpan.style.cssText = `
              vertical-align: middle;
            `;

            statusMessage.appendChild(iconSpan);
            statusMessage.appendChild(textSpan);

            statusMessage.style.borderLeftColor = '#f44336';
            statusMessage.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
            statusMessage.style.color = 'rgba(255, 255, 255, 0.9)';
          }
        })
        .catch(error => {
          console.error('Reset error:', error);

          // Clear the status message
          statusMessage.innerHTML = '';

          // Create error message with icon
          const iconSpan = window.top.document.createElement('span');
          iconSpan.innerHTML = ICONS.error;
          iconSpan.style.cssText = `
            margin-right: 8px;
            vertical-align: middle;
          `;

          const textSpan = window.top.document.createElement('span');
          textSpan.textContent = `Error: ${(error as Error).message}. Waiting for server to respond...`;
          textSpan.style.cssText = `
            vertical-align: middle;
          `;

          statusMessage.appendChild(iconSpan);
          statusMessage.appendChild(textSpan);

          // Add a button to retry the connection
          const startServerButton = window.top.document.createElement('button');
          startServerButton.textContent = 'Retry Connection';
          startServerButton.style.cssText = `
            margin-left: 10px;
            padding: 4px 8px;
            background: #4a88ff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
          `;

          startServerButton.addEventListener('click', () => {
            // Update status message
            statusMessage.innerHTML = '';
            const loadingSpan = window.top.document.createElement('span');
            loadingSpan.textContent = 'Starting server...';
            statusMessage.appendChild(loadingSpan);
            statusMessage.style.borderLeftColor = '#2196F3';
            statusMessage.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';
            statusMessage.style.color = 'rgba(255, 255, 255, 0.9)';

            // Start the server using the start.ts script
            try {
              // Use fetch to call a local endpoint that will trigger the server start
              // This is just a ping to see if we can reach the server after a delay
              setTimeout(() => {
                // Open a new window to run the npm command
                const serverWindow = window.top.open('', '_blank');
                if (serverWindow) {
                  serverWindow.document.write(`
                    <html>
                      <head>
                        <title>Starting Clicy Server</title>
                        <style>
                          body { 
                            font-family: Arial, sans-serif; 
                            background: #1a2530;
                            color: white;
                            padding: 20px;
                          }
                          pre {
                            background: rgba(0,0,0,0.2);
                            padding: 10px;
                            border-radius: 4px;
                            overflow: auto;
                          }
                        </style>
                      </head>
                      <body>
                        <h2>Starting Clicy Server</h2>
                        <p>Please keep this window open while using Clicy.</p>
                        <p>You can close this window when you're done using Clicy.</p>
                        <p>Running: <code>npm run clicy:server</code></p>
                        <pre id="output">Starting server...\n</pre>
                        <script>
                          // This script would ideally start the server, but browser security prevents it
                          // Instead, we'll show instructions
                          document.getElementById('output').textContent += 'For security reasons, the browser cannot start the server automatically.\\n\\n';
                          document.getElementById('output').textContent += 'Please open a terminal and run:\\n';
                          document.getElementById('output').textContent += 'npm run clicy:server\\n\\n';
                          document.getElementById('output').textContent += 'Or use the combined command that starts both server and Cypress:\\n';
                          document.getElementById('output').textContent += 'npm run clicy:start\\n';
                        </script>
                      </body>
                    </html>
                  `);
                  serverWindow.document.close();
                }

                // Check if the server is now running
                fetch('http://localhost:4000/commands', { method: 'GET' })
                  .then(() => {
                    // Server is running now
                    statusMessage.innerHTML = '';
                    const successSpan = window.top.document.createElement('span');
                    successSpan.innerHTML = ICONS.success;
                    successSpan.style.cssText = `
                      margin-right: 8px;
                      vertical-align: middle;
                    `;

                    const successTextSpan = window.top.document.createElement('span');
                    successTextSpan.textContent = 'Server started successfully! Try your command again.';
                    successTextSpan.style.cssText = `
                      vertical-align: middle;
                    `;

                    statusMessage.appendChild(successSpan);
                    statusMessage.appendChild(successTextSpan);
                    statusMessage.style.borderLeftColor = '#4CAF50';
                    statusMessage.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
                    statusMessage.style.color = 'rgba(255, 255, 255, 0.9)';
                  })
                  .catch(() => {
                    // Server still not running
                    statusMessage.innerHTML = '';
                    const errorSpan = window.top.document.createElement('span');
                    errorSpan.innerHTML = ICONS.error;
                    errorSpan.style.cssText = `
                      margin-right: 8px;
                      vertical-align: middle;
                    `;

                    const errorTextSpan = window.top.document.createElement('span');
                    errorTextSpan.textContent = 'Could not start server automatically. Please run "npm run clicy:server" in a terminal, or use "npm run clicy:start" to start both server and Cypress.';
                    errorTextSpan.style.cssText = `
                      vertical-align: middle;
                    `;

                    statusMessage.appendChild(errorSpan);
                    statusMessage.appendChild(errorTextSpan);
                    statusMessage.style.borderLeftColor = '#f44336';
                    statusMessage.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
                    statusMessage.style.color = 'rgba(255, 255, 255, 0.9)';
                  });
              }, 2000);
            } catch (err) {
              console.error('[CLICY DEBUG] Error starting server:', err);
              statusMessage.innerHTML = '';
              const errorSpan = window.top.document.createElement('span');
              errorSpan.innerHTML = ICONS.error;
              errorSpan.style.cssText = `
                margin-right: 8px;
                vertical-align: middle;
              `;

              const errorTextSpan = window.top.document.createElement('span');
              errorTextSpan.textContent = `Error starting server: ${(err as Error).message}. Please run "npm run clicy:server" in a terminal, or use "npm run clicy:start" to start both server and Cypress.`;
              errorTextSpan.style.cssText = `
                vertical-align: middle;
              `;

              statusMessage.appendChild(errorSpan);
              statusMessage.appendChild(errorTextSpan);
              statusMessage.style.borderLeftColor = '#f44336';
              statusMessage.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
              statusMessage.style.color = 'rgba(255, 255, 255, 0.9)';
            }
          });

          statusMessage.appendChild(startServerButton);

          // Add a link to the documentation
          const docLink = getTopWindow().document.createElement('a');
          docLink.href = 'https://github.com/yourusername/clicy#troubleshooting';
          docLink.target = '_blank';
          docLink.textContent = 'View troubleshooting guide';
          docLink.style.cssText = `
            margin-left: 10px;
            color: #4a88ff;
            text-decoration: underline;
            cursor: pointer;
            font-size: 12px;
          `;

          statusMessage.appendChild(docLink);

          statusMessage.style.borderLeftColor = '#f44336';
          statusMessage.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
          statusMessage.style.color = 'rgba(255, 255, 255, 0.9)';
        });
    }
  });

  // Add event listener for Enter key
  commandInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      runButton.click();
    }
  });

  // Function to filter and show matching commands
  const filterCommands = (query: string) => {
    const items = autocompleteDropdown.querySelectorAll('.autocomplete-item');
    let hasVisibleItems = false;

    items.forEach(item => {
      const commandText = item.querySelector('div:first-child')?.textContent || '';
      const matchesQuery = commandText.toLowerCase().includes(query.toLowerCase());
      const isAdvancedCommand = commandText.includes('(') && commandText.includes('get');

      if (matchesQuery) {
        const element = item as HTMLElement;
        element.style.display = 'flex';
        // Add visual distinction for advanced commands
        if (isAdvancedCommand) {
          element.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
          element.style.borderLeft = '3px solid #4CAF50';
          element.style.paddingLeft = '12px';
        }
        hasVisibleItems = true;
      } else {
        (item as HTMLElement).style.display = 'none';
      }
    });

    // Adjust dropdown style to show more items
    autocompleteDropdown.style.display = hasVisibleItems ? 'block' : 'none';
    autocompleteDropdown.style.maxHeight = '300px';
    autocompleteDropdown.style.overflowY = 'auto';
  };

  // Add event listeners for autocomplete
  commandInput.addEventListener('click', () => {
    console.log('[CLICY DEBUG] Input clicked, showing autocomplete');
    // Filter based on current input value
    filterCommands(commandInput.value);
  });

  commandInput.addEventListener('focus', () => {
    console.log('[CLICY DEBUG] Input focused, showing autocomplete');
    // Filter based on current input value
    filterCommands(commandInput.value);
  });

  // Add input event to filter commands as user types and update preview
  commandInput.addEventListener('input', () => {
    console.log('[CLICY DEBUG] Input changed, filtering autocomplete');
    filterCommands(commandInput.value);

    // Update the command preview
    const command = commandInput.value.trim();

    // Process the command to show the preview
    let processedCommand = command;

    // Handle goto command with URL processing
    if (processedCommand.startsWith('goto(')) {
      // Extract the URL from goto('url')
      const urlMatch = processedCommand.match(/goto\(['"]?(.*?)['"]?\)/);
      if (urlMatch && urlMatch[1]) {
        let url = urlMatch[1];

        // Add https:// protocol if the URL doesn't have one
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }

        processedCommand = `visit("${url}")`;
      }
    }
    // Handle click command
    else if (processedCommand.startsWith('click(')) {
      // Check if the command includes a selector type
      if (processedCommand.split(',').length > 1) {
        // Extract selector and selector type from click('selector', 'selectorType')
        const clickMatch = processedCommand.match(/click\(['"]?(.*?)['"]?,\s*['"]?(.*?)['"]?\)/);
        if (clickMatch && clickMatch[1] && clickMatch[2]) {
          const selector = clickMatch[1];
          const selectorType = clickMatch[2];

          if (selectorType === 'get') {
            processedCommand = `get("${selector}").click()`;
          } else {
            // Default to contains
            processedCommand = `contains("${selector}").click()`;
          }
        }
      } else {
        // Extract the label from click('label')
        const labelMatch = processedCommand.match(/click\(['"]?(.*?)['"]?\)/);
        if (labelMatch && labelMatch[1]) {
          const label = labelMatch[1];
          processedCommand = `contains("${label}").click()`;
        }
      }
    }
    // Handle write command
    else if (processedCommand.startsWith('write(')) {
      // Check if the command includes a selector type
      if (processedCommand.split(',').length > 2) {
        // Extract text, selector, and selector type from write('text', 'selector', 'selectorType')
        const writeMatch = processedCommand.match(/write\(['"]?(.*?)['"]?,\s*['"]?(.*?)['"]?,\s*['"]?(.*?)['"]?\)/);
        if (writeMatch && writeMatch[1] && writeMatch[2] && writeMatch[3]) {
          const text = writeMatch[1];
          const selector = writeMatch[2];
          const selectorType = writeMatch[3];

          if (selectorType === 'get') {
            processedCommand = `get("${selector}").type("${text}")`;
          } else {
            // Default to contains
            processedCommand = `contains("${selector}").parent().find('input').type("${text}")`;
          }
        }
      } else {
        // Extract text and field from write('text', 'field')
        const writeMatch = processedCommand.match(/write\(['"]?(.*?)['"]?,\s*['"]?(.*?)['"]?\)/);
        if (writeMatch && writeMatch[1] && writeMatch[2]) {
          const text = writeMatch[1];
          const field = writeMatch[2];
          processedCommand = `contains("${field}").parent().find('input').type("${text}")`;
        }
      }
    }
    // Handle get command
    else if (processedCommand.startsWith('get(')) {
      // Extract the selector from get('selector')
      const selectorMatch = processedCommand.match(/get\(['"]?(.*?)['"]?\)/);
      if (selectorMatch && selectorMatch[1]) {
        const selector = selectorMatch[1];
        processedCommand = `get("${selector}")`;
      }
    }
    // Handle contains command
    else if (processedCommand.startsWith('contains(')) {
      // Extract the text from contains('text')
      const textMatch = processedCommand.match(/contains\(['"]?(.*?)['"]?\)/);
      if (textMatch && textMatch[1]) {
        const text = textMatch[1];
        processedCommand = `contains("${text}")`;
      }
    }

    // Update the preview content
    if (command) {
      previewContent.textContent = `cy.${processedCommand}`;
      commandPreview.style.opacity = '1';
    } else {
      previewContent.textContent = 'cy.';
      commandPreview.style.opacity = '0.5';
    }
  });

  // Hide dropdown when clicking outside
  getTopWindow().document.addEventListener('click', (event) => {
    if (!inputContainer.contains(event.target as Node)) {
      autocompleteDropdown.style.display = 'none';
    }
  });

  // Add hover effect to dropdown items
  const items = autocompleteDropdown.querySelectorAll('.autocomplete-item');
  items.forEach(item => {
    item.addEventListener('mouseover', () => {
      (item as HTMLElement).style.backgroundColor = 'rgba(74, 136, 255, 0.15)';
      (item as HTMLElement).style.boxShadow = '0 0 10px rgba(74, 136, 255, 0.1)';
      (item as HTMLElement).style.transform = 'translateX(2px)';
    });

    item.addEventListener('mouseout', () => {
      (item as HTMLElement).style.backgroundColor = 'transparent';
      (item as HTMLElement).style.boxShadow = 'none';
      (item as HTMLElement).style.transform = 'translateX(0)';
    });
  });

  // Assemble the UI
  inputAndDropdownContainer.appendChild(commandInput);
  inputContainer.appendChild(commandPreview);
  buttonsContainer.appendChild(runButton);
  buttonsContainer.appendChild(exportButton);
  buttonsContainer.appendChild(resetButton);
  buttonsContainer.appendChild(inspectButton);
  buttonsContainer.appendChild(smartSelectorButton);

  // Assemble the content container
  contentContainer.appendChild(inputContainer);
  contentContainer.appendChild(buttonsContainer);
  contentContainer.appendChild(statusMessage);

  // Assemble the main container
  replContainer.appendChild(headerBar);
  replContainer.appendChild(contentContainer);

  // Add the UI to the Cypress Test Runner
  getTopWindow().document.body.appendChild(replContainer);
  console.log('[CLICY DEBUG] UI added to DOM');
});
