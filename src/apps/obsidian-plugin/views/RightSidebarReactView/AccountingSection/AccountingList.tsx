import { useContext, useEffect, useMemo } from "react";
import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import { PriceValueObject } from "@juandardilag/value-objects";
import { TransactionsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { Transaction } from "contexts/Transactions/domain";
import { TransactionWithAccumulatedBalance } from "contexts/Reports/domain";
import { useAccountSelect } from "apps/obsidian-plugin/components/Select/useAccountSelect";
import { useCategorySelect } from "apps/obsidian-plugin/components/Select/useCategorySelect";
import { useSubCategorySelect } from "apps/obsidian-plugin/components/Select/useSubCategorySelect";
import { List, ListItem, ListItemButton, ListSubheader } from "@mui/material";
import { AccountingListItem } from "./AccountingListItem";

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
		const res: [date: string, TransactionWithAccumulatedBalance[]][] = [];
		filteredTransactionsReport
			.withAccumulatedBalance()
			.forEach((withBalanceTransaction) => {
				const date =
					withBalanceTransaction.transaction.date.toLocaleDateString();
				if (!res.find((r) => r[0] === date)) res.push([date, []]);
				res.last()?.[1].push(withBalanceTransaction);
			});
		logger.debug("withAccumulatedBalanceTransactionsGrouped", { res });
		return res;
	}, [filteredTransactionsReport]);

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

	return (
		<>
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
			<List className="accounting-list" subheader={<li />}>
				{withAccumulatedBalanceTransactionsGrouped
					.slice(0, 10)
					.map(([date, withBalanceTransactions]) => (
						<ListItem key={date}>
							<List>
								<ListSubheader
									style={{
										backgroundColor:
											"var(--background-primary-alt)",
										color: "var(--text-normal)",
									}}
								>
									{new Date(date).toLocaleDateString(
										"default",
										{
											year: "numeric",
											month: "short",
											day: "2-digit",
											weekday: "short",
										}
									)}
								</ListSubheader>
								{withBalanceTransactions.map(
									({ transaction, balance, prevBalance }) => {
										return (
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
										);
									}
								)}
							</List>
						</ListItem>
					))}
			</List>
		</>
	);
}
