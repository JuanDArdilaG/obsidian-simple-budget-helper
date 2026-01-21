import {
	NumberValueObject,
	PriceValueObject,
} from "@juandardilag/value-objects";
import { Box, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { SearchInput } from "apps/obsidian-plugin/components/Search";
import { useAccountSelect } from "apps/obsidian-plugin/components/Select/useAccountSelect";
import { useCategorySelect } from "apps/obsidian-plugin/components/Select/useCategorySelect";
import { useSubCategorySelect } from "apps/obsidian-plugin/components/Select/useSubCategorySelect";
import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import {
	AccountsContext,
	CategoriesContext,
	TransactionsContext,
} from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { CategoryID } from "contexts/Categories/domain";
import {
	TransactionWithAccumulatedBalance,
	TransactionsReport,
} from "contexts/Reports/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { Transaction, TransactionAmount } from "contexts/Transactions/domain";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { List as VirtualList } from "react-window";
import {
	AccountingListItem,
	AccountingListItemProps,
} from "./AccountingListItem";

export type DisplayableTransactionWithAccumulatedBalance =
	TransactionWithAccumulatedBalance & {
		display: {
			id: string;
			accounts: {
				name: string;
				truncatedName: string;
				realAmount: PriceValueObject;
			}[];
			categoryName: string;
			subCategoryName: string;
			formattedDate: string;
			formattedTime: string;
			transactionName: string;
			truncatedTransactionName: string;
			truncatedCategoryName: string;
			truncatedSubCategoryName: string;
		};
	};

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

	const rowHeight = useCallback(
		(index: number, { transactionsList }: AccountingListItemProps) => {
			if (String.isString(transactionsList[index])) {
				return 40;
			}
			return isMobile ? 120 : 80;
		},
		[isMobile],
	);

	const { logger } = useLogger("AccountingList");
	const { setFilters, filteredTransactionsReport } =
		useContext(TransactionsContext);
	const { getAccountByID } = useContext(AccountsContext);
	const { getCategoryByID, getSubCategoryByID } =
		useContext(CategoriesContext);

	// Search state
	const [searchTerm, setSearchTerm] = useState<string>("");

	const { AccountSelect, account } = useAccountSelect({});
	const { CategorySelect, category } = useCategorySelect({
		overrideCategoriesIDs:
			filteredTransactionsReport.transactions.length > 0
				? [
						...new Set(
							filteredTransactionsReport.transactions.map(
								(t) => t.category.value,
							),
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
								(t) => t.subCategory.value,
							),
						),
					].map((id) => new SubCategoryID(id))
				: undefined,
	});

	const handleAuxClick = (transaction: Transaction) => {
		setSelection((prev: Transaction[]) =>
			prev.includes(transaction)
				? prev.filter((item) => item !== transaction)
				: [...prev, transaction],
		);
	};

	useEffect(() => {
		setFilters([account?.id, category?.id, subCategory?.id]);
	}, [account, category, subCategory, setFilters]);

	// Apply search filter to the already filtered transactions
	const searchFilteredTransactions = useMemo(() => {
		if (!searchTerm.trim()) {
			return filteredTransactionsReport.transactions;
		}

		const searchLower = searchTerm.toLowerCase();
		return filteredTransactionsReport.transactions.filter((transaction) => {
			// Search in transaction name
			if (
				transaction.name.toString().toLowerCase().includes(searchLower)
			) {
				return true;
			}

			// Search in account names
			const fromAccounts = transaction.originAccounts
				.map((s) => getAccountByID(s.accountId)?.name.value || "")
				.join(", ");
			const toAccounts = transaction.destinationAccounts
				.map((s) => getAccountByID(s.accountId)?.name.value || "")
				.join(", ");
			const accountNames =
				fromAccounts + (toAccounts ? " -> " + toAccounts : "");
			if (accountNames.toLowerCase().includes(searchLower)) {
				return true;
			}

			// Search in category name
			const category = getCategoryByID(transaction.category);
			if (category?.name.toString().toLowerCase().includes(searchLower)) {
				return true;
			}

			// Search in subcategory name
			const subCategory = getSubCategoryByID(transaction.subCategory);
			if (subCategory?.name.value.toLowerCase().includes(searchLower)) {
				return true;
			}

			return false;
		});
	}, [
		searchTerm,
		filteredTransactionsReport.transactions,
		getAccountByID,
		getCategoryByID,
		getSubCategoryByID,
	]);

	const transactionsList = useMemo(() => {
		const res: (DisplayableTransactionWithAccumulatedBalance | string)[] =
			[];

		// Create a new TransactionsReport with search filtered transactions
		const searchFilteredReport = new TransactionsReport(
			searchFilteredTransactions,
		);

		// Helper for truncation
		const truncateText = (text: string, maxLength: number) => {
			return text.length > maxLength
				? text.substring(0, maxLength) + "..."
				: text;
		};

		let prevDate: string | undefined = undefined;

		searchFilteredReport
			.withAccumulatedBalance()
			.forEach((withBalanceTransaction) => {
				const { transaction, accounts } = withBalanceTransaction;
				const date = transaction.date.toLocaleDateString();

				if (date !== prevDate) {
					res.push(date);
					prevDate = date;
				}

				const category = getCategoryByID(transaction.category);
				const subCategory = getSubCategoryByID(transaction.subCategory);
				const formattedDate = transaction.date.toLocaleDateString(
					"default",
					{
						day: "2-digit",
						month: "short",
					},
				);
				const formattedTime = transaction.date.toLocaleTimeString(
					"default",
					{
						hour: "2-digit",
						minute: "2-digit",
					},
				);
				const transactionName = transaction.name.toString();
				const categoryName = category?.name.toString() ?? "";
				const subCategoryName = subCategory?.name.value ?? "";

				let id = transaction.id.toString();
				if (transaction.operation.isTransfer()) {
					id = `${id}-${accounts
						.map((acc) => acc.id.toString())
						.join("-")}`;
				}

				const displayableTransaction: DisplayableTransactionWithAccumulatedBalance =
					{
						...withBalanceTransaction,
						display: {
							id,
							accounts: accounts.map(({ id }) => {
								const name =
									getAccountByID(id)?.name.value ?? "";

								// For transfer transactions, check both fromSplits and toSplits
								// For other transactions, only use fromSplits
								let realAmount = TransactionAmount.zero();

								if (transaction.operation.isTransfer()) {
									const originAccount =
										transaction.originAccounts.find(
											(originAccount) =>
												originAccount.accountId.equalTo(
													id,
												),
										);
									const destinationAccount =
										transaction.destinationAccounts.find(
											(destinationAccount) =>
												destinationAccount.accountId.equalTo(
													id,
												),
										);

									if (originAccount) {
										// Money going out of this account (negative)
										realAmount = new TransactionAmount(
											originAccount.amount.value * -1,
										);
									} else if (destinationAccount) {
										// Money coming into this account (positive)
										realAmount =
											destinationAccount.amount.times(
												transaction.exchangeRate ??
													new NumberValueObject(1),
											);
									}
								} else {
									// For income/expense transactions, use fromSplits
									// The amount sign should already be correct based on operation type
									const originAccount =
										transaction.originAccounts.find(
											(split) =>
												split.accountId.equalTo(id),
										);
									realAmount =
										originAccount?.amount ||
										TransactionAmount.zero();
								}

								return {
									name,
									truncatedName: truncateText(name, 15),
									realAmount,
								};
							}),
							categoryName,
							subCategoryName,
							formattedDate,
							formattedTime,
							transactionName,
							truncatedTransactionName: truncateText(
								transactionName,
								30,
							),
							truncatedCategoryName: truncateText(
								categoryName,
								20,
							),
							truncatedSubCategoryName: truncateText(
								subCategoryName,
								15,
							),
						},
					};

				res.push(displayableTransaction);
			});
		return res;
	}, [
		filteredTransactionsReport,
		getAccountByID,
		getCategoryByID,
		getSubCategoryByID,
		logger,
		searchFilteredTransactions,
	]);

	useEffect(() => {
		logger.debug("selection changed", { selection });
		statusBarAddText(
			selection.length > 0
				? `${
						selection.length
					} transactions selected. Total: ${selection.reduce(
						(acc, curr) => curr.originAmount.plus(acc),
						PriceValueObject.zero(),
					)}`
				: "",
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
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "8px",
					}}
				>
					<SearchInput
						placeholder="Search transactions, accounts, categories..."
						onSearch={setSearchTerm}
						style={{ marginBottom: "8px" }}
					/>
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
				</div>
			</Box>

			<Box sx={{ flex: 1, overflow: "auto", paddingBottom: "50px" }}>
				<VirtualList
					rowHeight={rowHeight}
					rowCount={transactionsList.length}
					rowComponent={AccountingListItem}
					rowProps={{
						handleAuxClick,
						selection,
						setSelection,
						onEditTransaction,
						transactionsList,
					}}
				/>
			</Box>
		</Box>
	);
}
