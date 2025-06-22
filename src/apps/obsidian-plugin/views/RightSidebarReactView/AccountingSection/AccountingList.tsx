import { PriceValueObject } from "@juandardilag/value-objects";
import {
	Box,
	CircularProgress,
	List,
	ListItem,
	ListItemButton,
	ListSubheader,
} from "@mui/material";
import { PerformanceMonitor } from "apps/obsidian-plugin/components/PerformanceMonitor";
import { useAccountSelect } from "apps/obsidian-plugin/components/Select/useAccountSelect";
import { useCategorySelect } from "apps/obsidian-plugin/components/Select/useCategorySelect";
import { useSubCategorySelect } from "apps/obsidian-plugin/components/Select/useSubCategorySelect";
import { useLazyLoading } from "apps/obsidian-plugin/hooks/useLazyLoading";
import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import { TransactionsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { TransactionWithAccumulatedBalance } from "contexts/Reports/domain";
import { Transaction } from "contexts/Transactions/domain";
import {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { VariableSizeList as VirtualList } from "react-window";
import { AccountingListItem } from "./AccountingListItem";

// Configuration for lazy loading
const ITEMS_PER_PAGE = 20;
const INITIAL_ITEMS = 10;
const BASE_ITEM_HEIGHT = 60; // Base height for date header
const TRANSACTION_HEIGHT = 88; // Height per transaction
const MAX_HEIGHT = 600; // Maximum height of the list

export function AccountingList({
	statusBarAddText,
	selection,
	setSelection,
}: Readonly<{
	statusBarAddText: (val: string | DocumentFragment) => void;
	selection: Transaction[];
	setSelection: React.Dispatch<React.SetStateAction<Transaction[]>>;
}>) {
	const { logger } = useLogger("AccountingList");
	const { setFilters, filteredTransactionsReport } =
		useContext(TransactionsContext);

	// Performance tracking
	const [renderTime, setRenderTime] = useState<number>(0);
	const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);

	// Virtual list ref for resetting cache
	const virtualListRef = useRef<VirtualList>(null);

	const { AccountSelect, account } = useAccountSelect({});
	const { CategorySelect, category } = useCategorySelect({
		overrideCategoriesIDs: filteredTransactionsReport.transactions.map(
			(t) => t.category
		),
	});
	const { SubCategorySelect, subCategory } = useSubCategorySelect({
		category,
		overrideSubCategoriesIDs: filteredTransactionsReport.transactions.map(
			(t) => t.subCategory
		),
	});

	const handleAuxClick = (transaction: Transaction) => {
		setSelection((prevSelection) =>
			prevSelection.includes(transaction)
				? prevSelection.filter((item) => item !== transaction)
				: [...prevSelection, transaction]
		);
	};

	useEffect(() => {
		setFilters([account?.id, category?.id, subCategory?.id]);
	}, [account, category, subCategory]);

	const withAccumulatedBalanceTransactionsGrouped = useMemo(() => {
		const startTime = performance.now();
		const res: [date: string, TransactionWithAccumulatedBalance[]][] = [];
		filteredTransactionsReport
			.withAccumulatedBalance()
			.forEach((withBalanceTransaction) => {
				const date =
					withBalanceTransaction.transaction.date.toLocaleDateString();
				if (!res.find((r) => r[0] === date)) res.push([date, []]);
				res.last()?.[1].push(withBalanceTransaction);
			});
		const endTime = performance.now();
		setRenderTime(endTime - startTime);
		logger.debug("withAccumulatedBalanceTransactionsGrouped", {
			res,
			renderTime: endTime - startTime,
		});
		return res;
	}, [filteredTransactionsReport]);

	// Use lazy loading hook
	const { visibleItems, isLoading, hasMoreItems, loadMoreItems, resetItems } =
		useLazyLoading({
			initialItems: INITIAL_ITEMS,
			itemsPerPage: ITEMS_PER_PAGE,
			totalItems: withAccumulatedBalanceTransactionsGrouped.length,
		});

	// Reset items when filters change
	useEffect(() => {
		resetItems();
	}, [account, category, subCategory, resetItems]);

	// Get visible transactions for virtual list
	const visibleTransactions = withAccumulatedBalanceTransactionsGrouped.slice(
		0,
		visibleItems
	);

	// Reset virtual list cache when data changes
	useEffect(() => {
		if (virtualListRef.current) {
			virtualListRef.current.resetAfterIndex(0);
		}
	}, [visibleTransactions]);

	// Virtual list item renderer
	const renderVirtualItem = useCallback(
		({ index, style }: { index: number; style: React.CSSProperties }) => {
			const [date, withBalanceTransactions] = visibleTransactions[index];

			return (
				<div style={style}>
					<ListItem>
						<List style={{ width: "100%" }}>
							<ListSubheader
								style={{
									backgroundColor:
										"var(--background-primary-alt)",
									color: "var(--text-normal)",
								}}
							>
								{new Date(date).toLocaleDateString("default", {
									year: "numeric",
									month: "short",
									day: "2-digit",
									weekday: "short",
								})}
							</ListSubheader>
							{withBalanceTransactions.map(
								({ transaction, balance, prevBalance }) => (
									<ListItemButton
										key={transaction.id.toString()}
										onAuxClick={() =>
											handleAuxClick(transaction)
										}
									>
										<AccountingListItem
											transactionWithBalance={{
												transaction,
												balance,
												prevBalance,
											}}
											selection={selection}
											setSelection={setSelection}
										/>
									</ListItemButton>
								)
							)}
						</List>
					</ListItem>
				</div>
			);
		},
		[visibleTransactions, selection, setSelection, handleAuxClick]
	);

	useEffect(() => {
		logger.debug("selection changed", { selection });
		statusBarAddText(
			selection.length > 0
				? `Selected ${
						selection.length
				  } records. Balance: ${new PriceValueObject(
						selection.reduce(
							(total, transaction) =>
								total +
								transaction.amount.toNumber() *
									(transaction.operation.isIncome() ? 1 : -1),
							0
						)
				  ).toString()}`
				: ""
		);
	}, [selection]);

	// Calculate total height for virtual list
	const totalHeight = useMemo(() => {
		return Math.min(visibleItems * TRANSACTION_HEIGHT, MAX_HEIGHT);
	}, [visibleItems]);

	// Calculate variable height for each date group
	const getItemSize = useCallback(
		(index: number) => {
			if (index >= visibleTransactions.length) return BASE_ITEM_HEIGHT;
			const [, transactions] = visibleTransactions[index];
			return BASE_ITEM_HEIGHT + transactions.length * TRANSACTION_HEIGHT;
		},
		[visibleTransactions]
	);

	// Calculate total content height for scroll detection
	const totalContentHeight = useMemo(() => {
		return visibleTransactions.reduce((total, _, index) => {
			return total + getItemSize(index);
		}, 0);
	}, [visibleTransactions, getItemSize]);

	// Virtual list scroll handler for infinite scroll
	const handleVirtualScroll = useCallback(
		({
			scrollOffset,
			scrollUpdateWasRequested,
		}: {
			scrollOffset: number;
			scrollUpdateWasRequested: boolean;
		}) => {
			if (scrollUpdateWasRequested) return;

			const containerHeight = totalHeight;
			const scrollPosition = scrollOffset + containerHeight;
			const threshold = 200; // Pixels from bottom to trigger load

			if (
				totalContentHeight - scrollPosition < threshold &&
				hasMoreItems &&
				!isLoading
			) {
				loadMoreItems();
			}
		},
		[
			totalHeight,
			totalContentHeight,
			hasMoreItems,
			isLoading,
			loadMoreItems,
		]
	);

	// Toggle performance monitor with Ctrl+Shift+P
	useEffect(() => {
		const handleKeyPress = (event: KeyboardEvent) => {
			if (event.ctrlKey && event.shiftKey && event.key === "P") {
				setShowPerformanceMonitor((prev) => !prev);
			}
		};

		window.addEventListener("keydown", handleKeyPress);
		return () => window.removeEventListener("keydown", handleKeyPress);
	}, []);

	return (
		<>
			{/* Performance Monitor */}
			{showPerformanceMonitor && (
				<PerformanceMonitor
					itemCount={withAccumulatedBalanceTransactionsGrouped.length}
					visibleItems={visibleItems}
					renderTime={renderTime}
				/>
			)}

			<div
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					gap: 15,
					flexWrap: "wrap",
					marginTop: 10,
					marginBottom: 10,
				}}
			>
				<h4>Filters:</h4>
				<div style={{ minWidth: 150 }}>{AccountSelect}</div>
				<div style={{ minWidth: 150 }}>{CategorySelect}</div>
				<div style={{ minWidth: 150 }}>{SubCategorySelect}</div>
			</div>

			{/* Performance info */}
			<div
				style={{
					padding: "8px",
					fontSize: "12px",
					color: "var(--text-muted)",
					textAlign: "center",
				}}
			>
				Showing {visibleItems} of{" "}
				{withAccumulatedBalanceTransactionsGrouped.length} date groups
				{hasMoreItems && ` • Scroll to load more`}
				{renderTime > 0 && ` • Render: ${renderTime.toFixed(2)}ms`}
				{/* Performance monitor hint */}
				<div style={{ fontSize: "10px", marginTop: "4px" }}>
					Press Ctrl+Shift+P to toggle performance monitor
				</div>
			</div>

			<Box
				style={{
					height: totalHeight,
					overflow: "hidden",
					border: "1px solid var(--background-modifier-border)",
					borderRadius: "4px",
					marginBottom: 10,
				}}
			>
				{visibleTransactions.length > 0 ? (
					<VirtualList
						height={totalHeight}
						itemCount={visibleTransactions.length}
						itemSize={getItemSize}
						width="100%"
						itemData={visibleTransactions}
						overscanCount={3} // Pre-render 3 items above/below viewport
						onScroll={handleVirtualScroll}
						ref={virtualListRef}
						style={{
							marginBottom: 20,
						}}
					>
						{renderVirtualItem}
					</VirtualList>
				) : (
					<Box
						style={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							height: "100%",
							color: "var(--text-muted)",
						}}
					>
						No transactions found
					</Box>
				)}
			</Box>

			{/* Loading indicator */}
			{isLoading && (
				<Box
					style={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						padding: "16px",
					}}
				>
					<CircularProgress size={24} />
					<span
						style={{
							marginLeft: "8px",
							color: "var(--text-muted)",
						}}
					>
						Loading more items...
					</span>
				</Box>
			)}
		</>
	);
}
