// This file injects a REPL UI into the Cypress Test Runner

// Icons for the UI (using simple Unicode characters)
const ICONS = {
  chevronUp: '▲',
  chevronDown: '▼',
  close: '✕',
  run: '▶',
  export: '⤓',
  reset: '↺',
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
    background: #f0f0f0;
    border-top: 1px solid #ccc;
    display: flex;
    flex-direction: column;
    z-index: 9999;
    transition: transform 0.3s ease;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    ${isCollapsed ? 'transform: translateY(calc(100% - 40px));' : ''}
  `;

  // Create the header bar
  const headerBar = window.top.document.createElement('div');
  headerBar.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    background: #e0e0e0;
    border-bottom: ${isCollapsed ? 'none' : '1px solid #ccc'};
    cursor: pointer;
    user-select: none;
  `;

  // Create the title
  const title = window.top.document.createElement('div');
  title.textContent = 'Clicy Commands';
  title.style.cssText = `
    font-weight: bold;
    font-size: 14px;
    color: #333;
  `;

  // Create the toggle button
  const toggleButton = window.top.document.createElement('div');
  toggleButton.innerHTML = isCollapsed ? ICONS.chevronUp : ICONS.chevronDown;
  toggleButton.style.cssText = `
    font-size: 12px;
    color: #666;
    padding: 4px;
  `;

  // Add click event to toggle collapse
  headerBar.addEventListener('click', () => {
    const currentlyCollapsed = replContainer.style.transform !== '';

    if (currentlyCollapsed) {
      // Expand
      replContainer.style.transform = '';
      toggleButton.innerHTML = ICONS.chevronDown;
      headerBar.style.borderBottom = '1px solid #ccc';
      window.top.localStorage.setItem('clicy-collapsed', 'false');
    } else {
      // Collapse
      replContainer.style.transform = 'translateY(calc(100% - 40px))';
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
    padding: 10px;
    display: flex;
    flex-direction: column;
  `;

  // Create the input field
  const inputContainer = window.top.document.createElement('div');
  inputContainer.style.cssText = `
    display: flex;
    margin-bottom: 10px;
    position: relative;
  `;

  const commandInput = window.top.document.createElement('input');
  commandInput.type = 'text';
  commandInput.placeholder = 'Enter Cypress command (e.g., contains("Login").click())';
  commandInput.style.cssText = `
    flex: 1;
    padding: 10px 12px;
    font-family: monospace;
    font-size: 14px;
    border: 1px solid #ccc;
    border-radius: 4px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
  `;

  // Add focus effect
  commandInput.addEventListener('focus', () => {
    commandInput.style.borderColor = '#2196F3';
    commandInput.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.05), 0 0 0 3px rgba(33, 150, 243, 0.2)';
  });

  commandInput.addEventListener('blur', () => {
    commandInput.style.borderColor = '#ccc';
    commandInput.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.05)';
  });

  // Create the autocomplete dropdown
  const autocompleteDropdown = window.top.document.createElement('div');
  autocompleteDropdown.id = 'clicy-autocomplete';
  autocompleteDropdown.style.cssText = `
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    max-height: 200px;
    overflow-y: auto;
    z-index: 10000;
    display: none;
    margin-bottom: 5px;
  `;

  // Populate the dropdown with available commands
  availableCommands.forEach(cmd => {
    const item = window.top.document.createElement('div');
    item.className = 'autocomplete-item';
    item.style.cssText = `
      padding: 10px;
      cursor: pointer;
      border-bottom: 1px solid #eee;
      display: flex;
      flex-direction: column;
      transition: background-color 0.2s;
    `;

    const commandText = window.top.document.createElement('div');
    commandText.style.cssText = `
      font-weight: bold;
      margin-bottom: 6px;
      color: #333;
      font-size: 14px;
    `;
    commandText.textContent = cmd.command;

    const descriptionText = window.top.document.createElement('div');
    descriptionText.style.cssText = `
      font-size: 12px;
      color: #666;
      margin-bottom: 6px;
      line-height: 1.4;
    `;
    descriptionText.textContent = cmd.description;

    const exampleText = window.top.document.createElement('div');
    exampleText.style.cssText = `
      font-size: 12px;
      color: #0066cc;
      font-family: monospace;
      background-color: #f5f5f5;
      padding: 4px 8px;
      border-radius: 3px;
      display: inline-block;
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
    gap: 10px;
  `;

  // Create the Run button
  const runButton = window.top.document.createElement('button');
  runButton.innerHTML = `${ICONS.run} Run`;
  runButton.title = "Run the command";
  runButton.style.cssText = `
    padding: 8px 16px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    font-weight: bold;
    transition: background-color 0.2s;
  `;

  // Add hover effect
  runButton.addEventListener('mouseover', () => {
    runButton.style.backgroundColor = '#45a049';
  });

  runButton.addEventListener('mouseout', () => {
    runButton.style.backgroundColor = '#4CAF50';
  });

  // Create the Export button
  const exportButton = window.top.document.createElement('button');
  exportButton.innerHTML = `${ICONS.export} Export`;
  exportButton.title = "Export all commands to a file";
  exportButton.style.cssText = `
    padding: 8px 16px;
    background: #2196F3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    font-weight: bold;
    transition: background-color 0.2s;
  `;

  // Add hover effect
  exportButton.addEventListener('mouseover', () => {
    exportButton.style.backgroundColor = '#0b7dda';
  });

  exportButton.addEventListener('mouseout', () => {
    exportButton.style.backgroundColor = '#2196F3';
  });

  // Create the Reset button
  const resetButton = window.top.document.createElement('button');
  resetButton.innerHTML = `${ICONS.reset} Reset`;
  resetButton.title = "Reset all commands";
  resetButton.style.cssText = `
    padding: 8px 16px;
    background: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    font-weight: bold;
    transition: background-color 0.2s;
  `;

  // Add hover effect
  resetButton.addEventListener('mouseover', () => {
    resetButton.style.backgroundColor = '#d32f2f';
  });

  resetButton.addEventListener('mouseout', () => {
    resetButton.style.backgroundColor = '#f44336';
  });

  // Create the status message
  const statusMessage = window.top.document.createElement('div');
  statusMessage.id = 'clicy-status';
  statusMessage.style.cssText = `
    margin-top: 12px;
    font-family: monospace;
    font-size: 14px;
    color: #333;
    padding: 8px 12px;
    border-radius: 4px;
    background-color: #f8f8f8;
    border-left: 4px solid #ddd;
    transition: all 0.3s ease;
    min-height: 20px;
  `;

  // Set initial message
  statusMessage.textContent = 'Ready to execute commands';
  statusMessage.style.borderLeftColor = '#2196F3';
  statusMessage.style.backgroundColor = '#e3f2fd';
  statusMessage.style.color = '#0d47a1';

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
            statusMessage.style.backgroundColor = '#FFF3E0';
            statusMessage.style.color = '#E65100';
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
      statusMessage.style.backgroundColor = '#ffebee';
      statusMessage.style.color = '#b71c1c';
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
    statusMessage.style.backgroundColor = '#e3f2fd';
    statusMessage.style.color = '#0d47a1';

    // Send the command to the server
    const serverUrl = 'http://localhost:4000/command';
    statusMessage.textContent = `Sending command to ${serverUrl}...`;
    statusMessage.style.borderLeftColor = '#2196F3';
    statusMessage.style.backgroundColor = '#e3f2fd';
    statusMessage.style.color = '#0d47a1';

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
          statusMessage.textContent = 'Command executed successfully';
          statusMessage.style.borderLeftColor = '#4CAF50';
          statusMessage.style.backgroundColor = '#e8f5e9';
          statusMessage.style.color = '#1b5e20';
          commandInput.value = '';
        } else {
          statusMessage.textContent = `Error: ${data.error}`;
          statusMessage.style.borderLeftColor = '#f44336';
          statusMessage.style.backgroundColor = '#ffebee';
          statusMessage.style.color = '#b71c1c';
        }
      })
      .catch(error => {
        console.error(`[CLICY DEBUG] Fetch error:`, error);
        statusMessage.textContent = `Error: ${error.message}. Make sure the server is running (npm run clicy:server)`;
        statusMessage.style.borderLeftColor = '#f44336';
        statusMessage.style.backgroundColor = '#ffebee';
        statusMessage.style.color = '#b71c1c';
      });
  });

  exportButton.addEventListener('click', () => {
    statusMessage.textContent = 'Exporting commands...';
    statusMessage.style.borderLeftColor = '#2196F3';
    statusMessage.style.backgroundColor = '#e3f2fd';
    statusMessage.style.color = '#0d47a1';

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
          statusMessage.textContent = 'Commands exported successfully';
          statusMessage.style.borderLeftColor = '#4CAF50';
          statusMessage.style.backgroundColor = '#e8f5e9';
          statusMessage.style.color = '#1b5e20';
        } else {
          statusMessage.textContent = `Error: ${data.error}`;
          statusMessage.style.borderLeftColor = '#f44336';
          statusMessage.style.backgroundColor = '#ffebee';
          statusMessage.style.color = '#b71c1c';
        }
      })
      .catch(error => {
        statusMessage.textContent = `Error: ${error.message}. Make sure the server is running (npm run clicy:server)`;
        statusMessage.style.borderLeftColor = '#f44336';
        statusMessage.style.backgroundColor = '#ffebee';
        statusMessage.style.color = '#b71c1c';
        console.error('Export error:', error);
      });
  });

  resetButton.addEventListener('click', () => {
    if (window.top.confirm('Are you sure you want to reset all commands?')) {
      statusMessage.textContent = 'Resetting commands...';
      statusMessage.style.borderLeftColor = '#2196F3';
      statusMessage.style.backgroundColor = '#e3f2fd';
      statusMessage.style.color = '#0d47a1';

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
            statusMessage.textContent = 'Commands reset successfully';
            statusMessage.style.borderLeftColor = '#4CAF50';
            statusMessage.style.backgroundColor = '#e8f5e9';
            statusMessage.style.color = '#1b5e20';
          } else {
            statusMessage.textContent = `Error: ${data.error}`;
            statusMessage.style.borderLeftColor = '#f44336';
            statusMessage.style.backgroundColor = '#ffebee';
            statusMessage.style.color = '#b71c1c';
          }
        })
        .catch(error => {
          statusMessage.textContent = `Error: ${error.message}. Make sure the server is running (npm run clicy:server)`;
          statusMessage.style.borderLeftColor = '#f44336';
          statusMessage.style.backgroundColor = '#ffebee';
          statusMessage.style.color = '#b71c1c';
          console.error('Reset error:', error);
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

  // Add input event to filter commands as user types
  commandInput.addEventListener('input', () => {
    console.log('[CLICY DEBUG] Input changed, filtering autocomplete');
    filterCommands(commandInput.value);
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
      (item as HTMLElement).style.backgroundColor = '#f0f8ff'; // Light blue background
      (item as HTMLElement).style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
    });

    item.addEventListener('mouseout', () => {
      (item as HTMLElement).style.backgroundColor = 'white';
      (item as HTMLElement).style.boxShadow = 'none';
    });
  });

  // Assemble the UI
  inputContainer.appendChild(commandInput);
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
