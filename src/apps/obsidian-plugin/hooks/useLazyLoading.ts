import { useCallback, useEffect, useState } from "react";

interface UseLazyLoadingOptions {
	initialItems?: number;
	itemsPerPage?: number;
	scrollThreshold?: number;
	totalItems: number;
	onLoadMore?: () => Promise<void>;
}

interface UseLazyLoadingReturn {
	visibleItems: number;
	isLoading: boolean;
	hasMoreItems: boolean;
	loadMoreItems: () => Promise<void>;
	handleScroll: (event: React.UIEvent<HTMLDivElement>) => void;
	resetItems: () => void;
}

export const useLazyLoading = ({
	initialItems = 10,
	itemsPerPage = 20,
	scrollThreshold = 100,
	totalItems,
	onLoadMore,
}: UseLazyLoadingOptions): UseLazyLoadingReturn => {
	const [visibleItems, setVisibleItems] = useState(initialItems);
	const [isLoading, setIsLoading] = useState(false);

	const hasMoreItems = visibleItems < totalItems;

	const loadMoreItems = useCallback(async () => {
		if (isLoading || !hasMoreItems) {
			return;
		}

		setIsLoading(true);

		try {
			// Call optional onLoadMore callback
			if (onLoadMore) {
				await onLoadMore();
			}

			// Simulate loading delay for better UX
			await new Promise((resolve) => setTimeout(resolve, 100));

			setVisibleItems((prev) =>
				Math.min(prev + itemsPerPage, totalItems)
			);
		} catch (error) {
			console.error("Error loading more items:", error);
		} finally {
			setIsLoading(false);
		}
	}, [isLoading, hasMoreItems, onLoadMore, itemsPerPage, totalItems]);

	const handleScroll = useCallback(
		(event: React.UIEvent<HTMLDivElement>) => {
			const { scrollTop, scrollHeight, clientHeight } =
				event.currentTarget;
			const isNearBottom =
				scrollHeight - scrollTop - clientHeight < scrollThreshold;

			if (isNearBottom && hasMoreItems && !isLoading) {
				loadMoreItems();
			}
		},
		[loadMoreItems, hasMoreItems, isLoading, scrollThreshold]
	);

	const resetItems = useCallback(() => {
		setVisibleItems(initialItems);
	}, [initialItems]);

	// Reset when total items change
	useEffect(() => {
		setVisibleItems(initialItems);
	}, [totalItems, initialItems]);

	return {
		visibleItems,
		isLoading,
		hasMoreItems,
		loadMoreItems,
		handleScroll,
		resetItems,
	};
};
