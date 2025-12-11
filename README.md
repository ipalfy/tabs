# Tab Inspector (React + TypeScript)

A modern Chrome Extension for managing windows, tab groups, and tabs using a nested tree view. Built with **React 18**, **TypeScript**, **Vite**, **Tailwind CSS**, and **@dnd-kit**.

## Prerequisites

*   **Node.js** (v18 or higher recommended)
*   **npm** (comes with Node.js)
*   **Google Chrome**

## Setup

1.  Navigate to the project directory:
    ```bash
    cd inspector
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

## Development & Building

Since browsers cannot execute TypeScript or JSX directly, this project must be **built** before it can be loaded into Chrome.

### Option 1: Watch Mode (Recommended for Development)
Run this command to build the project and automatically re-build whenever you save a file.
```bash
npm run watch
```
*   **Pros:** Fast feedback loop.
*   **Cons:** You must manually reload the extension or the page in Chrome to see changes.

### Option 2: Production Build
Run this command to build a minified, optimized version of the extension.
```bash
npm run build
```

## Loading into Chrome

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable **Developer mode** (toggle in the top-right corner).
3.  Click **Load unpacked**.
4.  Select the **`dist`** folder inside the `inspector` directory (`inspector/dist`).
    *   *Note: Do not select the `src` or root `inspector` folder. Chrome needs the compiled output in `dist`.*

## Debugging

This project is configured with **Source Maps**, allowing you to debug your original TypeScript code directly in Chrome DevTools.

1.  **Open the Extension:** Click the extension icon to open the Tab Inspector.
2.  **Open DevTools:** Right-click anywhere in the extension window and select **Inspect**.
3.  **Find Your Code:**
    *   Navigate to the **Sources** tab.
    *   Look for the file tree on the left. Your files will usually be under `top` -> `chrome-extension://...` -> `src`.
    *   You can also press `Cmd+P` (Mac) or `Ctrl+P` (Windows) and type the name of a file (e.g., `App.tsx`) to open it.
4.  **Set Breakpoints:** Click on the line number in your `.tsx` file to set a breakpoint.
5.  **Reload:** If you make changes while `npm run watch` is running:
    *   Wait for the terminal to show "built in...".
    *   Right-click inside the extension window and select **Reload**, or close and reopen it.

## Project Structure

*   **`src/`**: Source code.
    *   **`background/`**: Service worker script (runs in the background).
    *   **`components/`**: React UI components (WindowItem, GroupItem, TabItem).
    *   **`hooks/`**: Custom hooks (e.g., `useTabs` for Chrome API sync).
    *   **`lib/`**: Utility functions.
*   **`dist/`**: The compiled output (Load this folder into Chrome).
*   **`public/`**: Static assets.
*   **`manifest.json`**: Chrome Extension configuration (copied to `dist` during build).
