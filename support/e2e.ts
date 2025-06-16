// This file injects a REPL UI into the Cypress Test Runner

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
};

// Define available commands for autocomplete
const availableCommands = [
  { command: 'goto()', description: 'Navigate to a URL', example: 'goto("https://example.com")' },
  { command: 'click()', description: 'Click on an element with text', example: 'click("Login")' },
  { command: 'click() with get', description: 'Click on an element by CSS selector', example: 'click(".button", "get")' },
  { command: 'write()', description: 'Type text into an input field', example: 'write("username", "Username")' },
  { command: 'write() with get', description: 'Type text into an input field by CSS selector', example: 'write("username", "#username", "get")' },
  { command: 'get()', description: 'Select elements by CSS selector', example: 'get(".button")' },
  { command: 'contains()', description: 'Find elements containing specific text', example: 'contains("Submit")' },
  { command: 'closeBrowser()', description: 'Close the browser (not needed in Cypress)', example: 'closeBrowser()' },
];

// Wait for the Cypress UI to fully load
Cypress.on('test:before:run', () => {
  console.log('[CLICY DEBUG] Test before run - Recreating UI');

  // Remove existing UI if it exists to ensure fresh event listeners
  const existingUI = window.top.document.querySelector('#clicy-repl');
  if (existingUI) {
    console.log('[CLICY DEBUG] Removing existing UI');
    existingUI.remove();
  }

  // Check if the server is running
  console.log('[CLICY DEBUG] Checking if server is running...');

  // Function to check server connection with retries
  const checkServerWithRetries = (retries = 5, delay = 1000) => {
    console.log(`[CLICY DEBUG] Checking server connection (attempt ${6 - retries}/5)...`);

    fetch('http://localhost:4000/commands', { 
      method: 'GET',
      signal: AbortSignal.timeout(1000)
    })
      .then(() => {
        console.log('[CLICY DEBUG] Server is running');
      })
      .catch(error => {
        console.error(`[CLICY DEBUG] Server connection attempt ${6 - retries} failed:`, error);

        if (retries > 1) {
          // Try again after delay
          setTimeout(() => checkServerWithRetries(retries - 1, delay), delay);
        } else {
          // All retries failed, show notification
          console.error('[CLICY DEBUG] All server connection attempts failed');

          // Create a notification at the top of the screen
          const notification = window.top.document.createElement('div');
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

          const messageSpan = window.top.document.createElement('span');
          messageSpan.textContent = 'Waiting for Clicy server to start... Commands will not work until the server is ready.';

          const retryButton = window.top.document.createElement('button');
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
                const closeButton = window.top.document.createElement('button');
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

          const closeButton = window.top.document.createElement('button');
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

          window.top.document.body.appendChild(notification);
        }
      });
  };

  // Start checking with retries
  checkServerWithRetries();

  // Check if we have a saved collapsed state
  const isCollapsed = window.top.localStorage.getItem('clicy-collapsed') === 'true';

  // Create the REPL UI container
  const replContainer = window.top.document.createElement('div');
  replContainer.id = 'clicy-repl';
  replContainer.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to bottom, #2c3e50, #1a2530);
    border-top: 1px solid #4a6b8a;
    display: flex;
    flex-direction: column;
    z-index: 9999;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3), 0 -2px 6px rgba(0, 120, 255, 0.1);
    ${isCollapsed ? 'transform: translateY(calc(100% - 40px));' : ''}
    border-radius: 12px 12px 0 0;
    overflow: hidden;
  `;

  // Create the header bar
  const headerBar = window.top.document.createElement('div');
  headerBar.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background: linear-gradient(to right, #1e3c72, #2a5298);
    border-bottom: ${isCollapsed ? 'none' : '1px solid rgba(255, 255, 255, 0.1)'};
    cursor: pointer;
    user-select: none;
    transition: all 0.3s ease;
  `;

  // Create the title
  const title = window.top.document.createElement('div');
  title.textContent = 'CliCy Commands';
  title.style.cssText = `
    font-weight: 600;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.9);
    letter-spacing: 0.5px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  `;

  // Create the toggle button
  const toggleButton = window.top.document.createElement('div');
  toggleButton.innerHTML = isCollapsed ? ICONS.chevronUp : ICONS.chevronDown;
  toggleButton.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    transition: all 0.2s ease;
  `;

  // Add hover effect to toggle button
  toggleButton.addEventListener('mouseover', () => {
    toggleButton.style.background = 'rgba(255, 255, 255, 0.2)';
    toggleButton.style.boxShadow = '0 0 8px rgba(255, 255, 255, 0.3)';
  });

  toggleButton.addEventListener('mouseout', () => {
    toggleButton.style.background = 'rgba(255, 255, 255, 0.1)';
    toggleButton.style.boxShadow = 'none';
  });

  // Add click event to toggle collapse
  headerBar.addEventListener('click', () => {
    const currentlyCollapsed = replContainer.style.transform !== '';

    if (currentlyCollapsed) {
      // Expand
      replContainer.style.transform = '';
      toggleButton.innerHTML = ICONS.chevronDown;
      headerBar.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
      window.top.localStorage.setItem('clicy-collapsed', 'false');
    } else {
      // Collapse
      replContainer.style.transform = 'translateY(calc(100% - 48px))';
      toggleButton.innerHTML = ICONS.chevronUp;
      headerBar.style.borderBottom = 'none';
      window.top.localStorage.setItem('clicy-collapsed', 'true');
    }
  });

  // Assemble the header
  headerBar.appendChild(title);
  headerBar.appendChild(toggleButton);

  // Create the content container
  const contentContainer = window.top.document.createElement('div');
  contentContainer.style.cssText = `
    padding: 16px;
    display: flex;
    flex-direction: column;
    background: #1a2530;
  `;

  // Create the input field
  const inputContainer = window.top.document.createElement('div');
  inputContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    margin-bottom: 16px;
    position: relative;
  `;

  const commandInput = window.top.document.createElement('input');
  commandInput.type = 'text';
  commandInput.placeholder = 'Enter Cypress command (e.g., contains("Login").click())';
  commandInput.style.cssText = `
    flex: 1;
    padding: 12px 16px;
    font-family: 'Consolas', monospace;
    font-size: 14px;
    color: #e0e0e0;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px 8px 0 0;
    outline: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
  `;

  // Create the command preview area
  const commandPreview = window.top.document.createElement('div');
  commandPreview.id = 'clicy-preview';
  commandPreview.style.cssText = `
    padding: 8px 16px;
    font-family: 'Consolas', monospace;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-top: none;
    border-radius: 0 0 8px 8px;
    min-height: 20px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow-x: auto;
    white-space: nowrap;
  `;
  commandPreview.textContent = 'Preview: cy.';

  // Add a label for the preview
  const previewLabel = window.top.document.createElement('span');
  previewLabel.style.cssText = `
    color: rgba(255, 255, 255, 0.5);
    margin-right: 8px;
  `;
  previewLabel.textContent = 'Preview: ';

  // Add the actual preview content
  const previewContent = window.top.document.createElement('span');
  previewContent.style.cssText = `
    color: #4a88ff;
  `;
  previewContent.textContent = 'cy.';

  // Clear the preview and add the label and content
  commandPreview.textContent = '';
  commandPreview.appendChild(previewLabel);
  commandPreview.appendChild(previewContent);

  // Add focus effect
  commandInput.addEventListener('focus', () => {
    commandInput.style.borderColor = '#4a88ff';
    commandInput.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.2), 0 0 0 3px rgba(74, 136, 255, 0.2), 0 0 10px rgba(74, 136, 255, 0.15)';
    commandInput.style.background = 'rgba(0, 0, 0, 0.3)';
  });

  commandInput.addEventListener('blur', () => {
    commandInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    commandInput.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.2)';
    commandInput.style.background = 'rgba(0, 0, 0, 0.2)';
  });

  // Create the autocomplete dropdown
  const autocompleteDropdown = window.top.document.createElement('div');
  autocompleteDropdown.id = 'clicy-autocomplete';
  autocompleteDropdown.style.cssText = `
    position: fixed; /* Fixed position relative to the viewport instead of absolute */
    bottom: auto; /* Remove bottom positioning */
    top: 50%; /* Position at the middle of the screen */
    left: 50%;
    transform: translate(-50%, -50%); /* Center both horizontally and vertically */
    width: 400px; /* Fixed width to ensure options are visible */
    max-width: 90vw; /* Responsive - won't exceed 90% of viewport width */
    background: #2c3e50;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), 0 0 10px rgba(74, 136, 255, 0.1);
    height: 450px; /* Fixed height to show exactly 3 items */
    overflow-y: auto;
    z-index: 100000; /* Increased z-index to ensure it appears above everything */
    display: none;
    backdrop-filter: blur(5px);
  `;

  // Populate the dropdown with available commands
  availableCommands.forEach(cmd => {
    const item = window.top.document.createElement('div');
    item.className = 'autocomplete-item';
    item.style.cssText = `
      padding: 12px;
      cursor: pointer;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      flex-direction: column;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      width: 100%;
      box-sizing: border-box;
      height: 150px; /* Fixed height to ensure consistent sizing */
      overflow: hidden; /* Hide overflow content to avoid nested scrolling */
    `;

    const commandText = window.top.document.createElement('div');
    commandText.style.cssText = `
      font-weight: 600;
      margin-bottom: 6px;
      color: rgba(255, 255, 255, 0.9);
      font-size: 16px;
      letter-spacing: 0.3px;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    `;
    commandText.textContent = cmd.command;

    const descriptionText = window.top.document.createElement('div');
    descriptionText.style.cssText = `
      font-size: 13px;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 8px;
      line-height: 1.4;
      max-width: 100%;
      overflow-wrap: break-word;
    `;
    descriptionText.textContent = cmd.description;

    const exampleText = window.top.document.createElement('div');
    exampleText.style.cssText = `
      font-size: 11px;
      color: #4a88ff;
      font-family: 'Consolas', monospace;
      background-color: rgba(74, 136, 255, 0.1);
      padding: 4px 8px;
      border-radius: 4px;
      display: block; /* Changed to block for full width */
      border-left: 2px solid #4a88ff;
      word-break: break-word; /* Ensures long text wraps properly */
      white-space: normal; /* Ensures text wraps */
      overflow-wrap: break-word; /* Helps with long words */
      width: 100%; /* Full width of container */
      box-sizing: border-box; /* Include padding in width calculation */
    `;
    exampleText.textContent = `Example: ${cmd.example}`;

    item.appendChild(commandText);
    item.appendChild(descriptionText);
    item.appendChild(exampleText);

    // Add click event to insert the command into the input
    item.addEventListener('click', () => {
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
      // Fallback to just inserting the example
      else {
        commandInput.value = cmd.example;
        autocompleteDropdown.style.display = 'none';
        commandInput.focus();
      }
    });

    autocompleteDropdown.appendChild(item);
  });

  // Add the dropdown to the input container
  inputContainer.appendChild(autocompleteDropdown);

  // Create the buttons container
  const buttonsContainer = window.top.document.createElement('div');
  buttonsContainer.style.cssText = `
    display: flex;
    gap: 16px;
  `;

  // Create the Run button
  const runButton = window.top.document.createElement('button');
  runButton.innerHTML = ICONS.run;
  runButton.title = "Run the command";
  runButton.style.cssText = `
    width: 48px;
    height: 48px;
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
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1);
  `;

  // Add hover effect
  runButton.addEventListener('mouseover', () => {
    runButton.style.transform = 'translateY(-2px)';
    runButton.style.boxShadow = '0 6px 10px rgba(0, 0, 0, 0.2), 0 1px 3px rgba(0, 0, 0, 0.1), 0 0 10px rgba(46, 125, 50, 0.5)';
  });

  runButton.addEventListener('mouseout', () => {
    runButton.style.transform = 'translateY(0)';
    runButton.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1)';
  });

  // Create the Export button
  const exportButton = window.top.document.createElement('button');
  exportButton.innerHTML = ICONS.export;
  exportButton.title = "Export all commands to a file";
  exportButton.style.cssText = `
    width: 48px;
    height: 48px;
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
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1);
  `;

  // Add hover effect
  exportButton.addEventListener('mouseover', () => {
    exportButton.style.transform = 'translateY(-2px)';
    exportButton.style.boxShadow = '0 6px 10px rgba(0, 0, 0, 0.2), 0 1px 3px rgba(0, 0, 0, 0.1), 0 0 10px rgba(33, 150, 243, 0.5)';
  });

  exportButton.addEventListener('mouseout', () => {
    exportButton.style.transform = 'translateY(0)';
    exportButton.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1)';
  });

  // Create the Reset button
  const resetButton = window.top.document.createElement('button');
  resetButton.innerHTML = ICONS.reset;
  resetButton.title = "Reset all commands";
  resetButton.style.cssText = `
    width: 48px;
    height: 48px;
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
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1);
  `;

  // Add hover effect
  resetButton.addEventListener('mouseover', () => {
    resetButton.style.transform = 'translateY(-2px)';
    resetButton.style.boxShadow = '0 6px 10px rgba(0, 0, 0, 0.2), 0 1px 3px rgba(0, 0, 0, 0.1), 0 0 10px rgba(244, 67, 54, 0.5)';
  });

  resetButton.addEventListener('mouseout', () => {
    resetButton.style.transform = 'translateY(0)';
    resetButton.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1)';
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
  const styleSheet = window.top.document.createElement('style');
  styleSheet.textContent = `
    @keyframes statusGlow {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  `;
  window.top.document.head.appendChild(styleSheet);

  statusMessage.appendChild(statusGlow);

  // Set initial message
  statusMessage.textContent = 'Ready to execute commands';
  statusMessage.style.borderLeftColor = '#4a88ff';
  statusMessage.style.backgroundColor = 'rgba(74, 136, 255, 0.1)';

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
        return response.json();
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
        textSpan.textContent = `Error: ${error.message}. Waiting for server to respond...`;
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
      .then(response => response.json())
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
        textSpan.textContent = `Error: ${error.message}. Waiting for server to respond...`;
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
    if (window.top.confirm('Are you sure you want to reset all commands?')) {
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
        .then(response => response.json())
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
          textSpan.textContent = `Error: ${error.message}. Waiting for server to respond...`;
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

      (item as HTMLElement).style.display = matchesQuery ? 'flex' : 'none';

      if (matchesQuery) {
        hasVisibleItems = true;
      }
    });

    // Only show dropdown if there are matching items
    autocompleteDropdown.style.display = hasVisibleItems ? 'block' : 'none';
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
  window.top.document.addEventListener('click', (event) => {
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
  inputContainer.appendChild(commandInput);
  inputContainer.appendChild(commandPreview);
  buttonsContainer.appendChild(runButton);
  buttonsContainer.appendChild(exportButton);
  buttonsContainer.appendChild(resetButton);

  // Assemble the content container
  contentContainer.appendChild(inputContainer);
  contentContainer.appendChild(buttonsContainer);
  contentContainer.appendChild(statusMessage);

  // Assemble the main container
  replContainer.appendChild(headerBar);
  replContainer.appendChild(contentContainer);

  // Add the UI to the Cypress Test Runner
  window.top.document.body.appendChild(replContainer);
  console.log('[CLICY DEBUG] UI added to DOM');
});
