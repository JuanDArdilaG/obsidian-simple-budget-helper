import { PriceValueObject } from "@juandardilag/value-objects";
import {
	Box,
	CircularProgress,
	List,
	ListItem,
	ListSubheader,
	useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { PerformanceMonitor } from "apps/obsidian-plugin/components/PerformanceMonitor";
import { useAccountSelect } from "apps/obsidian-plugin/components/Select/useAccountSelect";
import { useCategorySelect } from "apps/obsidian-plugin/components/Select/useCategorySelect";
import { useSubCategorySelect } from "apps/obsidian-plugin/components/Select/useSubCategorySelect";
import { useLazyLoading } from "apps/obsidian-plugin/hooks/useLazyLoading";
import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import {
	AccountsContext,
	CategoriesContext,
	TransactionsContext,
} from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { CategoryID } from "contexts/Categories/domain";
import { TransactionWithAccumulatedBalance } from "contexts/Reports/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { Transaction } from "contexts/Transactions/domain";
import {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { VariableSizeList as VirtualList } from "react-window";
import { AccountingListItem } from "./AccountingListItem";

export type DisplayableTransactionWithAccumulatedBalance =
	TransactionWithAccumulatedBalance & {
		display: {
			accountName: string;
			categoryName: string;
			subCategoryName: string;
			realAmount: PriceValueObject | null;
			formattedTime: string;
			transactionName: string;
			truncatedTransactionName: string;
			truncatedCategoryName: string;
			truncatedSubCategoryName: string;
			truncatedAccountName: string;
		};
	};

// Configuration for lazy loading
const ITEMS_PER_PAGE = 20;
const INITIAL_ITEMS = 10;
const BASE_ITEM_HEIGHT = 60; // Base height for date header
const TRANSACTION_HEIGHT = 80; // Height per transaction
const MOBILE_TRANSACTION_HEIGHT = 130; // Increased height for mobile to accommodate action buttons

export function AccountingList({
	selection,
	setSelection,
	statusBarAddText,
	onEditTransaction,
}: Readonly<{
	statusBarAddText: (val: string | DocumentFragment) => void;
	selection: Transaction[];
	setSelection: React.Dispatch<React.SetStateAction<Transaction[]>>;
	onEditTransaction: (transaction: Transaction) => void;
}>) {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

	const { logger } = useLogger("AccountingList");
	const {
		setFilters,
		filteredTransactionsReport,
		updateFilteredTransactions,
	} = useContext(TransactionsContext);
	const { getAccountByID } = useContext(AccountsContext);
	const { getCategoryByID, getSubCategoryByID } =
		useContext(CategoriesContext);

	// Performance tracking
	const [renderTime, setRenderTime] = useState<number>(0);
	const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);

	// Virtual list ref for resetting cache
	const virtualListRef = useRef<VirtualList>(null);

	const { AccountSelect, account } = useAccountSelect({});
	const { CategorySelect, category } = useCategorySelect({
		overrideCategoriesIDs:
			filteredTransactionsReport.transactions.length > 0
				? [
						...new Set(
							filteredTransactionsReport.transactions.map(
								(t) => t.category.value
							)
						),
				  ].map((id) => new CategoryID(id))
				: undefined,
	});
	const { SubCategorySelect, subCategory } = useSubCategorySelect({
		category,
		overrideSubCategoriesIDs:
			filteredTransactionsReport.transactions.length > 0
				? [
						...new Set(
							filteredTransactionsReport.transactions.map(
								(t) => t.subCategory.value
							)
						),
				  ].map((id) => new SubCategoryID(id))
				: undefined,
	});

	const handleAuxClick = (transaction: Transaction) => {
		setSelection((prev: Transaction[]) =>
			prev.includes(transaction)
				? prev.filter((item) => item !== transaction)
				: [...prev, transaction]
		);
	};

	useEffect(() => {
		setFilters([account?.id, category?.id, subCategory?.id]);
	}, [account, category, subCategory, setFilters]);

	const withAccumulatedBalanceTransactionsGrouped = useMemo(() => {
		const startTime = performance.now();
		const res: [
			date: string,
			DisplayableTransactionWithAccumulatedBalance[]
		][] = [];

		// Helper for truncation
		const truncateText = (text: string, maxLength: number) => {
			return text.length > maxLength
				? text.substring(0, maxLength) + "..."
				: text;
		};

		filteredTransactionsReport
			.withAccumulatedBalance()
			.forEach((withBalanceTransaction) => {
				const { transaction } = withBalanceTransaction;

				// For transfer transactions, we need to determine which account this entry represents
				let accountName: string;
				let realAmount: PriceValueObject | null;

				if (transaction.operation.isTransfer()) {
					// For transfers, determine if this is a "from" or "to" entry based on the balance change
					const balanceChange =
						withBalanceTransaction.balance.toNumber() -
						withBalanceTransaction.prevBalance.toNumber();

					// Find the account that matches this balance change
					const fromAccount = transaction.fromSplits.find((split) => {
						const accountAmount = transaction
							.getRealAmountForAccount(split.accountId)
							.toNumber();
						return Math.abs(accountAmount - balanceChange) < 0.01; // Small tolerance for floating point
					});

					const toAccount = transaction.toSplits.find((split) => {
						const accountAmount = transaction
							.getRealAmountForAccount(split.accountId)
							.toNumber();
						return Math.abs(accountAmount - balanceChange) < 0.01; // Small tolerance for floating point
					});

					if (fromAccount) {
						// This is a "from" entry (negative amount)
						accountName =
							getAccountByID(fromAccount.accountId)?.name.value ||
							"";
						realAmount = transaction.getRealAmountForAccount(
							fromAccount.accountId
						);
					} else if (toAccount) {
						// This is a "to" entry (positive amount)
						accountName =
							getAccountByID(toAccount.accountId)?.name.value ||
							"";
						realAmount = transaction.getRealAmountForAccount(
							toAccount.accountId
						);
					} else {
						// Fallback to original logic
						const fromAccounts = transaction.fromSplits
							.map(
								(s) =>
									getAccountByID(s.accountId)?.name.value ||
									""
							)
							.join(", ");
						const toAccounts = transaction.toSplits
							.map(
								(s) =>
									getAccountByID(s.accountId)?.name.value ||
									""
							)
							.join(", ");
						accountName =
							fromAccounts +
							(toAccounts ? " -> " + toAccounts : "");
						realAmount = transaction.fromAmount;
					}
				} else {
					// For non-transfer transactions, use the original logic
					const fromAccounts = transaction.fromSplits
						.map(
							(s) => getAccountByID(s.accountId)?.name.value || ""
						)
						.join(", ");
					const toAccounts = transaction.toSplits
						.map(
							(s) => getAccountByID(s.accountId)?.name.value || ""
						)
						.join(", ");
					realAmount = transaction.fromAmount;
					accountName =
						fromAccounts + (toAccounts ? " -> " + toAccounts : "");
				}

				const category = getCategoryByID(transaction.category);
				const subCategory = getSubCategoryByID(transaction.subCategory);
				const formattedTime = transaction.date.toLocaleTimeString(
					"default",
					{
						hour: "2-digit",
						minute: "2-digit",
					}
				);
				const transactionName = transaction.name.toString();
				const categoryName = category?.name.toString() ?? "";
				const subCategoryName = subCategory?.name.value ?? "";

				const displayableTransaction: DisplayableTransactionWithAccumulatedBalance =
					{
						...withBalanceTransaction,
						display: {
							accountName,
							categoryName,
							subCategoryName,
							realAmount,
							formattedTime,
							transactionName,
							truncatedTransactionName: truncateText(
								transactionName,
								30
							),
							truncatedCategoryName: truncateText(
								categoryName,
								20
							),
							truncatedSubCategoryName: truncateText(
								subCategoryName,
								15
							),
							truncatedAccountName: truncateText(accountName, 15),
						},
					};

				const date = transaction.date.toLocaleDateString();
				if (!res.find((r) => r[0] === date)) res.push([date, []]);
				const lastGroup = res[res.length - 1];
				if (lastGroup) {
					lastGroup[1].push(displayableTransaction);
				}
			});
		const endTime = performance.now();
		setRenderTime(endTime - startTime);
		logger.debug("withAccumulatedBalanceTransactionsGrouped", {
			res,
			renderTime: endTime - startTime,
		});
		return res;
	}, [
		filteredTransactionsReport,
		getAccountByID,
		getCategoryByID,
		getSubCategoryByID,
		logger,
	]);

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
				<div style={style} data-date-group={index}>
					<div>
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
								(transactionWithBalance, index) => {
									// Create unique key for transfer transactions
									const isTransfer =
										transactionWithBalance.transaction.operation.isTransfer();
									let uniqueKey;

									if (isTransfer) {
										// For transfers, include account info to make keys unique
										const accountName =
											transactionWithBalance.display
												.accountName;
										const amount =
											transactionWithBalance.display.realAmount?.toNumber() ||
											0;
										uniqueKey = `${transactionWithBalance.transaction.id.toString()}-${accountName}-${amount}-${index}`;
									} else {
										// For non-transfers, use the original key logic
										uniqueKey = `${transactionWithBalance.transaction.id.toString()}-${transactionWithBalance.transaction.date.getTime()}-${index}`;
									}

									return (
										<ListItem
											key={uniqueKey}
											onAuxClick={() =>
												handleAuxClick(
													transactionWithBalance.transaction
												)
											}
											style={{
												padding: isMobile
													? "2px"
													: "8px",
												minHeight: "auto",
											}}
										>
											<AccountingListItem
												onEditTransaction={
													onEditTransaction
												}
												transactionWithBalance={
													transactionWithBalance
												}
												selection={selection}
												setSelection={setSelection}
												updateTransactions={
													updateFilteredTransactions
												}
											/>
										</ListItem>
									);
								}
							)}
						</List>
					</div>
				</div>
			);
		},
		[
			visibleTransactions,
			selection,
			setSelection,
			isMobile,
			onEditTransaction,
			updateFilteredTransactions,
		]
	);

	const getItemSize = (index: number) => {
		const [, withBalanceTransactions] = visibleTransactions[index];
		return (
			BASE_ITEM_HEIGHT +
			(isMobile ? MOBILE_TRANSACTION_HEIGHT : TRANSACTION_HEIGHT) *
				(withBalanceTransactions.length ?? 1)
		);
	};

	const onItemsRendered = ({
		visibleStopIndex,
	}: {
		visibleStartIndex: number;
		visibleStopIndex: number;
	}) => {
		const lastVisibleIndex = visibleStopIndex;
		if (
			!isLoading &&
			hasMoreItems &&
			lastVisibleIndex >= visibleTransactions.length - 1
		) {
			loadMoreItems();
		}
	};

	useEffect(() => {
		logger.debug("selection changed", { selection });
		statusBarAddText(
			selection.length > 0
				? `${
						selection.length
				  } transactions selected. Total: ${selection.reduce(
						(acc, curr) => curr.fromAmount.plus(acc),
						PriceValueObject.zero()
				  )}`
				: ""
		);
	}, [selection]);

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				maxHeight: "100%",
				overflow: "hidden",
			}}
		>
			<Box sx={{ p: 1, borderBottom: 1, borderColor: "divider" }}>
				<button onClick={() => setShowPerformanceMonitor((s) => !s)}>
					Toggle performance
				</button>
				{showPerformanceMonitor && (
					<PerformanceMonitor
						renderTime={renderTime}
						itemCount={
							withAccumulatedBalanceTransactionsGrouped.length
						}
						visibleItems={visibleItems}
					/>
				)}
				<div
					style={{
						display: "flex",
						flexDirection: "row",
						gap: "8px",
					}}
				>
					{AccountSelect}
					{CategorySelect}
					{SubCategorySelect}
				</div>
			</Box>

			<Box sx={{ flex: 1, overflow: "auto", paddingBottom: "50px" }}>
				<AutoSizer>
					{({ height, width }) => (
						<VirtualList
							ref={virtualListRef}
							height={height} // Adjust as needed
							itemCount={visibleTransactions.length}
							itemSize={getItemSize}
							onItemsRendered={onItemsRendered}
							width={width}
						>
							{renderVirtualItem}
						</VirtualList>
					)}
				</AutoSizer>
				{isLoading && (
					<Box
						sx={{
							display: "flex",
							justifyContent: "center",
							py: 2,
						}}
					>
						<CircularProgress />
					</Box>
				)}
			</Box>
		</Box>
	);
}
