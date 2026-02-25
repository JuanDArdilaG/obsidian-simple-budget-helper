# Performance Debugging Guide

## Console Logs Added

The following logging has been added to help identify memory leaks and infinite loops:

### Component Render Logs
- `[AccountsDashboard] Component rendering` - Tracks every render
- `[TransactionsList] Component rendering` - Tracks every render

### Hook Effects
- `[useTransactions] Effect triggered` - Shows when transactions update
- `[useTransactions] Starting transaction fetch` - Transaction fetch begins
- `[useTransactions] Transactions fetched` - Transaction fetch completes
- `[useAccounts] Effect triggered` - Shows when accounts update
- `[useCategories] CatWithSubs effect triggered` - Categories with subs update
- `[useCategories] Categories effect triggered` - Categories update  
- `[useCategories] SubCategories effect triggered` - Subcategories update

### Async Operations
- `[AccountsDashboard] Exchange rates effect triggered` - Async exchange rate fetching
- `[AccountsDashboard] Fetching exchange rates for X accounts` - Shows account count
- `[AccountsDashboard] Exchange rates fetched successfully` - Completion
- `[AccountsDashboard] Cleaning up exchange rates effect` - Cleanup triggered

### Performance Tracking
- `[TransactionsList] Filtering transactions` - Shows filter state
- `[TransactionsList] Filtering complete` - Shows filtered count + duration
- `[TransactionsList] Computing transactionsWithAccumulatedBalances` - useMemo trigger
- `[AccountsDashboard] Computing accountsReport` - useMemo trigger
- `[AccountsDashboard] Computing transactionsReport` - useMemo trigger

## What to Watch For

### 1. Infinite Loops
Look for console logs that repeat rapidly without user action:
```
[useTransactions] Effect triggered
[useTransactions] Starting transaction fetch
[useTransactions] Transactions fetched
[useTransactions] Effect triggered  // <-- SHOULD NOT REPEAT IMMEDIATELY
```

### 2. Memory Leaks
Watch for:
- Missing cleanup logs when component unmounts
- Async operations completing after component unmounts
- Growing transaction/account counts without user action

### 3. Excessive Re-renders
Count how many times components render:
```
[AccountsDashboard] Component rendering  // Should be minimal
[AccountsDashboard] Component rendering
[AccountsDashboard] Component rendering  // <-- Too many!
```

### 4. Slow Operations
Check duration logs:
```
[TransactionsList] Filtering complete { filteredCount: 1000, duration: "250ms" }  // <-- Too slow!
```

## How to Use

1. Open Obsidian Developer Console (Ctrl+Shift+I / Cmd+Option+I)
2. Navigate to the plugin view
3. Watch console output
4. Look for patterns indicating:
   - Rapid repeating logs (infinite loops)
   - Operations triggering too frequently
   - Long durations in performance logs
   - Errors in async operations

## Critical Issues Fixed

1. ✅ Missing cleanup in AccountsDashboard exchange rate effect
2. ✅ Error handling added to all async operations
3. ✅ Dependency arrays cleaned up in useTransactions
4. ✅ Performance tracking added to filtering operations
5. ✅ Component render tracking added

## Next Steps if Crash Continues

If the app still crashes after reviewing logs:
1. Check for logs that appear just before crash
2. Look for "Maximum call stack exceeded" errors
3. Check memory usage in Chrome DevTools Performance tab
4. Verify no circular dependencies in contexts
