# Search Functionality

## Overview

The accounting list now includes a powerful search feature that allows users to quickly find transactions based on multiple criteria. The search functionality is implemented using a reusable `SearchInput` component that can be used across different parts of the application.

## Features

### SearchInput Component

The `SearchInput` component provides:

-   **Debounced search**: Reduces API calls by waiting for user to stop typing
-   **Clear functionality**: Easy way to clear the search with a clear button
-   **Obsidian theme integration**: Uses Obsidian's color palette for consistent styling
-   **Responsive design**: Works well on desktop, tablet, and mobile devices
-   **Accessibility**: Proper ARIA labels and keyboard navigation

### Search Capabilities

The search functionality in the AccountingList searches across:

1. **Transaction names**: Search by transaction description or name
2. **Account names**: Search by account names (both from and to accounts)
3. **Category names**: Search by transaction categories
4. **Subcategory names**: Search by transaction subcategories

## Usage

### In AccountingList

The search input is automatically available in the AccountingList component. It appears at the top of the list, above the filter dropdowns.

```tsx
// The search is automatically integrated
<AccountingList
	selection={selection}
	setSelection={setSelection}
	statusBarAddText={statusBarAddText}
	onEditTransaction={onEditTransaction}
/>
```

### Using SearchInput Component

To use the SearchInput component in other parts of the application:

```tsx
import { SearchInput } from "apps/obsidian-plugin/components/Search";

function MyComponent() {
	const [searchTerm, setSearchTerm] = useState("");

	return (
		<SearchInput
			placeholder="Search items..."
			onSearch={setSearchTerm}
			debounceMs={300}
		/>
	);
}
```

### Using useSearch Hook

For more complex search scenarios, you can use the `useSearch` hook:

```tsx
import { useSearch } from "apps/obsidian-plugin/hooks/useSearch";

function MyComponent() {
	const { filteredItems, searchTerm } = useSearch({
		items: myItems,
		searchFields: ["name", "description"],
		searchTerm: searchTerm,
		debounceMs: 300,
	});

	return (
		<div>
			<SearchInput onSearch={setSearchTerm} />
			{filteredItems.map((item) => (
				<div key={item.id}>{item.name}</div>
			))}
		</div>
	);
}
```

## Implementation Details

### Search Logic

The search implementation:

1. **Client-side filtering**: Works on already filtered transactions from the database
2. **Case-insensitive**: Searches are not case-sensitive
3. **Partial matching**: Finds transactions that contain the search term
4. **Multiple fields**: Searches across multiple transaction properties
5. **Performance optimized**: Uses memoization to prevent unnecessary re-computations

### Styling

The search input uses Obsidian's CSS variables for consistent theming:

-   `--text-normal`: Text color
-   `--text-muted`: Placeholder and icon colors
-   `--background-primary`: Background color
-   `--background-modifier-border`: Border color
-   `--interactive-accent`: Focus state color

### Responsive Design

The search input adapts to different screen sizes:

-   **Desktop**: Full-width input with clear button
-   **Tablet**: Maintains functionality with appropriate sizing
-   **Mobile**: Optimized for touch interaction

## Testing

The search functionality includes comprehensive tests:

-   Unit tests for the SearchInput component
-   Integration tests for the AccountingList search feature
-   Tests for debouncing, clearing, and styling

Run tests with:

```bash
npm test -- --run tests/SearchInput.test.tsx
npm test -- --run tests/AccountingListSearch.test.tsx
```

## Future Enhancements

Potential improvements for the search functionality:

1. **Advanced filters**: Date ranges, amount ranges, etc.
2. **Saved searches**: Allow users to save frequently used searches
3. **Search history**: Remember recent searches
4. **Fuzzy matching**: Handle typos and similar terms
5. **Search suggestions**: Auto-complete based on existing data
