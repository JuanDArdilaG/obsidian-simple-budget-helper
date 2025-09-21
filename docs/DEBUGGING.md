# 🐛 Debugging Guide for Obsidian Plugin

This guide covers all the debugging options available for developing your Obsidian plugin.

## 🚀 Quick Start

### 1. Start Development Environment

```bash
# Start dev server + Obsidian with debugging
just debug-dev

# Or start them separately
just debug-obsidian
npm run dev
```

### 2. Open VS Code Debug Panel

-   Press `Ctrl+Shift+D` (or `Cmd+Shift+D` on Mac)
-   Select a debug configuration
-   Press `F5` to start debugging

## 🔧 Debug Configurations

### 🔍 Debug Obsidian Plugin (Chrome DevTools)

-   **Purpose**: Debug the plugin's frontend code (React components, UI logic)
-   **Best for**: UI issues, component state, event handling
-   **How to use**:
    1. Start Obsidian with debugging: `just debug-obsidian`
    2. Select this configuration in VS Code
    3. Press `F5` to launch Chrome DevTools
    4. Set breakpoints in your React components

### 🐛 Debug Plugin Main Process

-   **Purpose**: Debug the plugin's main process code (plugin initialization, API calls)
-   **Best for**: Plugin lifecycle, Obsidian API integration, file operations
-   **How to use**:
    1. Select this configuration in VS Code
    2. Press `F5` to start debugging
    3. Set breakpoints in `main.ts` and other backend files

### 🔗 Attach to Obsidian (Chrome)

-   **Purpose**: Attach to an already running Obsidian instance
-   **Best for**: When Obsidian is already running with debugging enabled
-   **How to use**:
    1. Start Obsidian with: `just debug-obsidian`
    2. Select this configuration in VS Code
    3. Press `F5` to attach

### 🔗 Attach to Obsidian (Node)

-   **Purpose**: Attach to the Node.js process of Obsidian
-   **Best for**: Backend debugging when Obsidian is already running
-   **How to use**:
    1. Start Obsidian with Node debugging enabled
    2. Select this configuration in VS Code
    3. Press `F5` to attach

### 🧪 Debug with Hot Reload

-   **Purpose**: Debug with automatic rebuilds on file changes
-   **Best for**: Active development with immediate feedback
-   **How to use**:
    1. Select this configuration in VS Code
    2. Press `F5` to start
    3. The dev server will start automatically

### 🚀 Full Debug Session

-   **Purpose**: Start both main process and Chrome debugging simultaneously
-   **Best for**: Comprehensive debugging of both frontend and backend
-   **How to use**:
    1. Select this configuration in VS Code
    2. Press `F5` to start both debuggers

## 🛠️ Debugging Tools

### Console Logging

```typescript
// In your plugin code
console.log("Debug info:", someVariable);
console.warn("Warning message");
console.error("Error message");

// In React components
console.log("Component state:", state);
console.log("Props received:", props);
```

### Breakpoints

-   **Line breakpoints**: Click on the line number in VS Code
-   **Conditional breakpoints**: Right-click on breakpoint → Edit Breakpoint
-   **Logpoints**: Right-click on breakpoint → Add Logpoint

### Watch Expressions

In the Debug panel, add expressions to monitor:

-   `this.state` - Monitor component state
-   `this.props` - Monitor component props
-   `app.vault` - Monitor Obsidian vault
-   `plugin.settings` - Monitor plugin settings

## 🔍 Common Debugging Scenarios

### 1. Plugin Not Loading

```typescript
// Add to main.ts
console.log("Plugin loading...");
console.log("App instance:", app);
console.log("Manifest:", manifest);
```

### 2. React Component Issues

```typescript
// Add to React components
useEffect(() => {
	console.log("Component mounted:", props);
}, []);

useEffect(() => {
	console.log("State changed:", state);
}, [state]);
```

### 3. API Calls

```typescript
// Add to API calls
console.log("API call params:", params);
try {
	const result = await apiCall(params);
	console.log("API result:", result);
} catch (error) {
	console.error("API error:", error);
}
```

### 4. File Operations

```typescript
// Add to file operations
console.log("File path:", filePath);
console.log("File content:", content);
console.log("Vault files:", app.vault.getFiles());
```

## 🚨 Troubleshooting

### Chrome DevTools Not Connecting

1. Make sure Obsidian is started with debugging: `just debug-obsidian`
2. Check if port 9222 is available: `lsof -i :9222`
3. Try restarting Obsidian

### Breakpoints Not Hitting

1. Ensure source maps are enabled
2. Check if the file is being watched by the dev server
3. Verify the file path in the debugger matches your source

### VS Code Debugger Issues

1. Restart VS Code
2. Clear debug cache: `Cmd+Shift+P` → "Developer: Reload Window"
3. Check if the correct workspace is open

### Performance Issues

1. Use the Performance tab in Chrome DevTools
2. Monitor memory usage in the Memory tab
3. Check for memory leaks with heap snapshots

## 📋 Debug Commands

```bash
# Quick debugging setup
just debug-info          # Show debugging information
just debug-obsidian      # Start Obsidian with debugging
just debug-dev           # Start dev server + Obsidian
just debug-chrome        # Open Chrome DevTools

# Development workflow
npm run dev              # Start development server
npm run build            # Build for production
npm run test             # Run tests
```

## 🔗 Useful Links

-   [Obsidian Plugin API Documentation](https://github.com/obsidianmd/obsidian-api)
-   [Electron Debugging Guide](https://www.electronjs.org/docs/latest/tutorial/debugging-main-process)
-   [Chrome DevTools Documentation](https://developers.google.com/web/tools/chrome-devtools)
-   [VS Code Debugging Guide](https://code.visualstudio.com/docs/editor/debugging)

## 💡 Tips

1. **Use the Console**: The browser console is your best friend for quick debugging
2. **Set Strategic Breakpoints**: Place breakpoints at entry points and error handling
3. **Monitor Network**: Use the Network tab to debug API calls
4. **Check React DevTools**: Install React DevTools extension for component debugging
5. **Use Logpoints**: Add logpoints instead of console.log for cleaner debugging
6. **Profile Performance**: Use the Performance tab to identify bottlenecks

---

Happy debugging! 🐛✨
