import { useMemo } from "react";
import { useLogger } from "./useLogger";

interface UseSearchOptions<T> {
	items: T[];
	searchFields: (keyof T)[];
	searchTerm: string;
	debounceMs?: number;
}

export const useSearch = <T>({
	items,
	searchFields,
	searchTerm,
	debounceMs = 300,
}: UseSearchOptions<T>) => {
	const { logger } = useLogger("useSearch");

	const filteredItems = useMemo(() => {
		if (!searchTerm.trim()) {
			return items;
		}

		const searchLower = searchTerm.toLowerCase();

		return items.filter((item) => {
			return searchFields.some((field) => {
				const fieldValue = item[field];
				if (fieldValue === null || fieldValue === undefined) {
					return false;
				}

				// Handle different types of values
				if (typeof fieldValue === "string") {
					return fieldValue.toLowerCase().includes(searchLower);
				}

				if (typeof fieldValue === "number") {
					return fieldValue.toString().includes(searchLower);
				}

				// Handle objects with toString method (like value objects)
				if (typeof fieldValue === "object" && fieldValue !== null) {
					if (
						"toString" in fieldValue &&
						typeof fieldValue.toString === "function"
					) {
						return fieldValue
							.toString()
							.toLowerCase()
							.includes(searchLower);
					}
					if (
						"value" in fieldValue &&
						typeof fieldValue.value === "string"
					) {
						return fieldValue.value
							.toLowerCase()
							.includes(searchLower);
					}
				}

				return false;
			});
		});
	}, [items, searchFields, searchTerm]);

	logger.debug("useSearch filtered items", {
		originalCount: items.length,
		filteredCount: filteredItems.length,
		searchTerm,
		searchFields,
	});

	return {
		filteredItems,
		searchTerm,
	};
};
