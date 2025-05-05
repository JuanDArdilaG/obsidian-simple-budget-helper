import { App } from "obsidian";
import { useContext, useEffect, useMemo, useState } from "react";
import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import { PriceValueObject } from "@juandardilag/value-objects";
import { AccountingListContextMenu } from "./AccountingListContextMenu";
import {
	AccountsContext,
	CategoriesContext,
	TransactionsContext,
} from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { Transaction } from "contexts/Transactions/domain";
import { TransactionWithAccumulatedBalance } from "contexts/Reports/domain";
import { useAccountSelect } from "apps/obsidian-plugin/components/Select/useAccountSelect";
import { useCategorySelect } from "apps/obsidian-plugin/components/Select/useCategorySelect";
import { useSubCategorySelect } from "apps/obsidian-plugin/components/Select/useSubCategorySelect";
import { EditTransactionPanel } from "apps/obsidian-plugin/panels/CreateBudgetItemPanel";
import { PriceLabel } from "apps/obsidian-plugin/components/PriceLabel";
import {
	List,
	ListItem,
	ListItemButton,
	ListSubheader,
	Typography,
} from "@mui/material";

export function AccountingList({
	app,
	statusBarAddText,
	selection,
	setSelection,
}: Readonly<{
	app: App;
	statusBarAddText: (val: string | DocumentFragment) => void;
	selection: Transaction[];
	setSelection: React.Dispatch<React.SetStateAction<Transaction[]>>;
}>) {
	const {
		useCases: { deleteTransaction },
		setFilters,
		filteredTransactionsReport,
		updateFilteredTransactions,
	} = useContext(TransactionsContext);

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
		return res;
	}, [filteredTransactionsReport]);

	const [selectedTransaction, setSelectedTransaction] =
		useState<Transaction>();
	const [action, setAction] = useState<"edit" | "delete">();

	const [selectionActive, setSelectionActive] = useState(false);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.shiftKey) setSelectionActive(true);
		};
		const handleKeyUp = (e: KeyboardEvent) => {
			if (!e.shiftKey) setSelectionActive(false);
		};

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
		};
	}, []);

	useEffect(() => {
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

	useEffect(() => {
		if (!selectionActive) {
			setSelection([]);
		}
	}, [selectionActive]);

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
			{selectedTransaction && (
				<AccountingListContextMenu
					app={app}
					transaction={selectedTransaction}
					onEdit={async () => setAction("edit")}
					onDelete={async () => {
						await deleteTransaction.execute(selectedTransaction.id);
						updateFilteredTransactions();
						setSelectedTransaction(undefined);
						setSelection([]);
					}}
				/>
			)}
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
									(transactionWithBalance) => {
										return (
											<AccountingListRow
												key={
													transactionWithBalance
														.transaction.id.value
												}
												action={action}
												setAction={setAction}
												transactionWithBalance={
													transactionWithBalance
												}
												selection={selection}
												selectionActive={true}
												setSelection={setSelection}
												selectedTransaction={
													selectedTransaction
												}
												setSelectedTransaction={
													setSelectedTransaction
												}
											/>
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

const AccountingListRow = ({
	transactionWithBalance: { transaction, balance, prevBalance },
	selectionActive,
	selection,
	setSelection,
	selectedTransaction,
	setSelectedTransaction,
	action,
	setAction,
}: {
	transactionWithBalance: TransactionWithAccumulatedBalance;
	selectionActive: boolean;
	selection: Transaction[];
	setSelection: React.Dispatch<React.SetStateAction<Transaction[]>>;
	selectedTransaction?: Transaction;
	setSelectedTransaction: React.Dispatch<
		React.SetStateAction<Transaction | undefined>
	>;
	action?: "edit" | "delete";
	setAction: React.Dispatch<
		React.SetStateAction<"edit" | "delete" | undefined>
	>;
}) => {
	const { logger } = useLogger("AccountingListRow");
	const { updateAccounts, getAccountByID } = useContext(AccountsContext);
	const { getCategoryByID, getSubCategoryByID } =
		useContext(CategoriesContext);
	const { updateTransactions } = useContext(TransactionsContext);
	const account = useMemo(
		() =>
			getAccountByID(
				transaction.operation.isTransfer() &&
					transaction.toAccount &&
					transaction.amount.isNegative()
					? transaction.toAccount
					: transaction.account
			),
		[transaction]
	);
	if (!account) {
		logger
			.debugB("not account for transaction row", {
				transaction: transaction.toPrimitives(),
			})
			.log();
		return <></>;
	}

	return (
		<ListItemButton
			key={transaction.id.toString()}
			onKeyDown={() => {}}
			onClick={() => {
				if (selectionActive)
					setSelection((prevSelection) =>
						prevSelection.includes(transaction)
							? prevSelection.filter(
									(item) => item !== transaction
							  )
							: [...prevSelection, transaction]
					);
			}}
			onContextMenu={() => {
				setAction(undefined);
				setSelectedTransaction(transaction);
				setSelection([]);
			}}
			className="accounting-list-item"
			selected={selection.includes(transaction)}
		>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "flex-start",
				}}
			>
				<Typography variant="body1">
					{transaction.name.toString()}
				</Typography>
				<div style={{ width: "100%", marginTop: "5px" }}>
					<div style={{ marginBottom: "3px" }}>
						<Typography variant="body2">
							<b>Category:</b>{" "}
							{getCategoryByID(
								transaction.category
							)?.name.toString() ?? ""}
						</Typography>
					</div>
					<div>
						<Typography variant="body2">
							<b>SubCategory:</b>{" "}
							{
								getSubCategoryByID(transaction.subCategory)
									?.name.value
							}
						</Typography>
					</div>
				</div>
			</div>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "flex-end",
				}}
			>
				<div>
					<span className="light-text">
						{transaction.date.toLocaleTimeString("default", {
							hour: "2-digit",
							minute: "2-digit",
						})}
					</span>{" "}
				</div>
				<div
					style={{
						display: "flex",
						gap: "10px",
						alignItems: "stretch",
						marginBottom: 5,
					}}
				>
					<span>{account?.name.toString() ?? ""}</span>
					<PriceLabel
						price={transaction.getRealAmountForAccount(account.id)}
						operation={transaction.operation}
					/>
				</div>
				<div className="small">
					<div>
						<PriceLabel price={prevBalance} /> {"→"}{" "}
						<PriceLabel price={balance} />
					</div>
				</div>
			</div>
			{action === "edit" &&
				selectedTransaction?.id.equalTo(transaction.id) && (
					<EditTransactionPanel
						onUpdate={async () => {
							setAction(undefined);
							updateTransactions();
							updateAccounts();
							setSelectedTransaction(undefined);
							setSelection([]);
						}}
						transaction={transaction}
					/>
				)}
		</ListItemButton>
	);
};
