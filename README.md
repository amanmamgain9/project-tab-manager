# Project Tab Manager

A Chrome extension that helps you organize and manage your browser tabs by grouping them into projects. Perfect for developers, researchers, or anyone who works on multiple projects simultaneously and needs to keep their browser tabs organized.

## Features

- **Project-Based Tab Management**: Create different projects and associate tabs with specific projects
- **Smart Tab Switching**: Seamlessly switch between different projects while maintaining tab organization
- **Carry-Over Tabs**: Keep specific tabs across different projects using the context menu
- **Persistent Storage**: Your project configurations and tab associations are saved automatically
- **Clean Interface**: Simple and intuitive UI for managing your projects and tabs

## How It Works

1. Create different projects for your work (e.g., "Development", "Research", "Personal")
2. Save your current tabs to a project
3. Switch between projects - the extension will:
   - Save your current tab setup
   - Open the tabs associated with the selected project
   - Maintain any "carry-over" tabs you've designated

## Technical Implementation

### Core Technologies
- React.js for the popup UI
- Chrome Extension APIs
- Local Storage for data persistence
- ES6+ JavaScript

### Key Components

- **Popup Interface (`src/App.js`)**: Main UI for project management
- **Background Service (`public/background.js`)**: Handles tab events and project switching
- **Chrome Utils (`src/utils/chromeUtils.js`)**: Utility functions for Chrome API interactions
- **Tab Management (`public/tab.js`)**: Core tab manipulation logic
- **Carry-Over System (`public/carryover.js`)**: Manages tabs that persist across projects

### Storage Structure

The extension uses Chrome's local storage to maintain:
- List of projects
- Tab associations for each project
- Carry-over tab configurations
- Project selection state per window

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `build` directory

## Usage

1. Click the extension icon in Chrome's toolbar
2. Create a new project using the '+' button
3. Switch between projects by clicking on them
4. Right-click on any tab to mark it as a carry-over tab
5. Your tab configurations are automatically saved as you work

## Permissions

The extension requires the following permissions:
- `storage`: For saving project and tab data
- `tabs`: For tab management
- `activeTab`: For accessing the current tab
- `webNavigation`: For tracking tab navigation
- `contextMenus`: For carry-over tab functionality
- `notifications`: For system notifications

## Project Structure

```
project-tab-manager/
├── public/
│   ├── background.js     # Extension background service
│   ├── carryover.js      # Carry-over tab functionality
│   ├── chromeUtils.js    # Chrome API utilities
│   ├── tab.js           # Tab management logic
│   └── manifest.json     # Extension configuration
├── src/
│   ├── App.js           # Main React component
│   ├── ProjectList.js    # Project list component
│   ├── AddProjectModal.js # New project modal
│   └── utils/
│       └── chromeUtils.js # Frontend Chrome utilities
```

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License - see the LICENSE file for details.
