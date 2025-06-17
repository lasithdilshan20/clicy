import express from 'express';
import bodyParser from 'body-parser';
import { 
  writeCommandToFile, 
  exportAllToCodeFile, 
  readCommandsFromFile,
  readCommandsFromHistoryFile,
  writeCommandToHistoryFile
} from '../utils/fileWriter';

const app = express();
const PORT = 4000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Enable CORS for Cypress
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Get all commands
app.get('/commands', (req, res) => {
  try {
    const commands = readCommandsFromFile();
    res.json({ success: true, commands });
  } catch (error) {
    console.error('Error reading commands:', error);
    res.status(500).json({ success: false, error: 'Failed to read commands' });
  }
});

// Get command history
app.get('/history', (req, res) => {
  try {
    const commands = readCommandsFromHistoryFile();
    res.json({ success: true, commands });
  } catch (error) {
    console.error('Error reading command history:', error);
    res.status(500).json({ success: false, error: 'Failed to read command history' });
  }
});

// Add a new command
app.post('/command', (req, res) => {
  try {
    const { command } = req.body;

    if (!command) {
      return res.status(400).json({ success: false, error: 'Command is required' });
    }

    const commands = readCommandsFromFile();
    commands.push(command);

    writeCommandToFile(command, commands);

    res.json({ success: true, message: 'Command added successfully' });
  } catch (error) {
    console.error('Error adding command:', error);
    res.status(500).json({ success: false, error: 'Failed to add command' });
  }
});

// Export all commands to a file
app.post('/export', (req, res) => {
  try {
    const commands = readCommandsFromFile();
    exportAllToCodeFile(commands);
    res.json({ success: true, message: 'Commands exported successfully' });
  } catch (error) {
    console.error('Error exporting commands:', error);
    res.status(500).json({ success: false, error: 'Failed to export commands' });
  }
});

// Reset all commands
app.post('/reset', (req, res) => {
  try {
    // Reset the Cypress test file
    writeCommandToFile('', []);

    // Reset the history file
    writeCommandToHistoryFile([]);

    res.json({ success: true, message: 'Commands reset successfully' });
  } catch (error) {
    console.error('Error resetting commands:', error);
    res.status(500).json({ success: false, error: 'Failed to reset commands' });
  }
});

// Start the server
app.listen(PORT, () => {
  // Only show the server message if not in quiet mode
  if (process.env.CLICY_QUIET !== 'true') {
    console.log(`Clicy server running on http://localhost:${PORT}`);
  }
});
