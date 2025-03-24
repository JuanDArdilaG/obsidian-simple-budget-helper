import { App } from "obsidian";
import { useContext, useEffect, useMemo, useState } from "react";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { AccountingListContextMenu } from "./AccountingListContextMenu";
import { RightSidebarReactTab } from "../RightSidebarReactTab";
import { EditTransactionPanel } from "apps/obsidian-plugin/panels";
import { TransactionsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { useAccounts } from "apps/obsidian-plugin/hooks/useAccounts";
import { useTransactions } from "apps/obsidian-plugin/hooks/useTransactions";
import { useCategories } from "apps/obsidian-plugin/hooks/useCategories";
import { Transaction } from "contexts/Transactions/domain";
import { Category, CategoryName } from "contexts/Categories";
import { Subcategory } from "contexts/Subcategories";
import { Account, AccountName } from "contexts/Accounts";
import {
	Logger,
	ReportBalance,
	SubcategoryName,
	TransactionsReport,
} from "contexts";
import { Select } from "apps/obsidian-plugin/components";

export function AccountingList({
	app,
	statusBarAddText,
}: {
	app: App;
	statusBarAddText: (val: string | DocumentFragment) => void;
}) {
	const {
		useCases: { deleteTransaction },
	} = useContext(TransactionsContext);

	const { accounts, getAccountByName } = useAccounts();
	const {
		subCategories,
		categories,
		getCategoryByName,
		getSubCategoryByName,
	} = useCategories();

	const [accountFilter, setAccountFilter] = useState<AccountName>();
	const [categoryFilter, setCategoryFilter] = useState<CategoryName>();
	const [subCategoryFilter, setSubCategoryFilter] =
		useState<SubcategoryName>();
	const { updateTransactions, transactions } = useTransactions({
		accountFilter: accountFilter
			? getAccountByName(accountFilter)?.id
			: undefined,
		categoryFilter: categoryFilter
			? getCategoryByName(categoryFilter)?.id
			: undefined,
		subCategoryFilter: subCategoryFilter
			? getSubCategoryByName(subCategoryFilter)?.id
			: undefined,
	});

	const withAccumulatedBalanceTransactions = useMemo(() => {
		const res = new TransactionsReport(
			transactions
		).withAccumulatedBalance();
		Logger.debug(
			"AccountingList: with accumulated balance transactions",
			{
				transactions: res.map((r) => ({
					balance: r.balance.valueOf(),
					prevBalance: r.prevBalance.valueOf(),
					transaction: r.transaction.toPrimitives(),
				})),
			},
			{ on: false }
		);
		return res;
	}, [transactions]);

	const withAccumulatedBalanceTransactionsGrouped = useMemo(() => {
		const res: [
			string,
			{
				transaction: Transaction;
				balance: ReportBalance;
				prevBalance: ReportBalance;
			}[]
		][] = [];
		withAccumulatedBalanceTransactions.forEach((withBalanceTransaction) => {
			const date =
				withBalanceTransaction.transaction.date.toPrettyFormatDate();
			if (!res.find((r) => r[0] === date)) res.push([date, []]);
			res.last()?.[1].push(withBalanceTransaction);
		});
		return res;
	}, [withAccumulatedBalanceTransactions]);

	const [selectedTransaction, setSelectedTransaction] =
		useState<Transaction>();
	const [action, setAction] = useState("");

	const [selectionActive, setSelectionActive] = useState(false);
	const [selection, setSelection] = useState<Transaction[]>([]);

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
		<RightSidebarReactTab title="Accounting" subtitle>
			<Select
				id="account-filter"
				label="Account"
				value={accountFilter?.value ?? ""}
				values={["", ...accounts.map((acc) => acc.name.toString())]}
				onChange={(accountName) =>
					setAccountFilter(
						accountName ? new AccountName(accountName) : undefined
					)
				}
			/>
			<Select
				id="category-filter"
				label="Category"
				value={categoryFilter?.value ?? ""}
				values={["", ...categories.map((cat) => cat.name.toString())]}
				onChange={(catName) =>
					setCategoryFilter(
						catName ? new CategoryName(catName) : undefined
					)
				}
			/>
			<Select
				id="subcategory-filter"
				label="SubCategory"
				value={subCategoryFilter?.value ?? ""}
				values={["", ...subCategories.map((sub) => sub.name.value)]}
				onChange={(subName) =>
					subName
						? setSubCategoryFilter(new SubcategoryName(subName))
						: undefined
				}
			/>
			{selectedTransaction && (
				<AccountingListContextMenu
					app={app}
					transaction={selectedTransaction}
					onEdit={async () => setAction("edit")}
					onDelete={async () => {
						await deleteTransaction.execute(selectedTransaction.id);
						updateTransactions();
					}}
				/>
			)}
			{withAccumulatedBalanceTransactionsGrouped.map(
				([date, withBalanceTransactions]) => (
					<AccountingListRowGroup
						date={date}
						transactionsWithBalance={withBalanceTransactions}
						selectedTransaction={selectedTransaction}
					/>
				)
			)}
		</RightSidebarReactTab>
	);
}

const AccountingListRow = ({
	transaction,
	selectionActive,
	selection,
	setSelection,
	setSelectedRecord,
	isTransfer,
	setAction,
	accumulatedBalance,
	prevBalance,
}: {
	isTransfer?: boolean;
	transaction: Transaction;
	accumulatedBalance: ReportBalance;
	prevBalance: ReportBalance;
	selectionActive: boolean;
	selection: Transaction[];
	setSelection: React.Dispatch<React.SetStateAction<Transaction[]>>;
	setSelectedRecord: React.Dispatch<React.SetStateAction<Transaction>>;
	setAction: React.Dispatch<React.SetStateAction<string>>;
}) => {
	const { getCategoryByID, getSubCategoryByID } = useCategories();
	const { getAccountByID } = useAccounts();

	const modifiedTransaction = useMemo(() => {
		if (!isTransfer) return transaction;
		return new Transaction(
			transaction.id,
			transaction.account,
			transaction.name,
			transaction.operation,
			transaction.categoryID,
			transaction.subCategory,
			transaction.date,
			transaction.amount.negate(),
			transaction.itemID,
			transaction.toAccount
		);
	}, [transaction, isTransfer]);

	return (
		<li
			key={transaction.id.value}
			onClick={() => {
				if (selectionActive)
					setSelection((prevSelection) =>
						prevSelection.includes(modifiedTransaction)
							? prevSelection.filter(
									(item) => item !== modifiedTransaction
							  )
							: [...prevSelection, modifiedTransaction]
					);
			}}
			onContextMenu={() => {
				setAction("");
				setSelectedRecord(modifiedTransaction);
			}}
			className="accounting-list-item"
			style={{
				backgroundColor: selection.includes(modifiedTransaction)
					? "gray"
					: "",
			}}
		>
			<span className="first-row">
				<div>
					<span style={{ fontSize: "0.7em" }}>
						{modifiedTransaction.date.toPrettyFormatHour()}
					</span>{" "}
					{modifiedTransaction.name.toString()}
				</div>
				<div
					style={{
						color: modifiedTransaction.operation.isExpense()
							? "var(--color-red)"
							: modifiedTransaction.operation.isTransfer()
							? "var(--color-blue)"
							: "var(--color-green)",
					}}
				>
					{modifiedTransaction.operation.isExpense() ||
					(!isTransfer && modifiedTransaction.operation.isTransfer())
						? "-"
						: "+"}
					{(!isTransfer
						? modifiedTransaction.amount
						: modifiedTransaction.amount.negate()
					).toString()}
				</div>
			</span>
			<span
				className="second-row light-text"
				style={{ marginTop: "5px" }}
			>
				<div className="category">
					<div style={{ marginBottom: "3px" }}>
						<b>Category:</b>{" "}
						{getCategoryByID(
							modifiedTransaction.categoryID
						)?.name.toString() ?? ""}
					</div>
					<div>
						<b>SubCategory:</b>{" "}
						{
							getSubCategoryByID(modifiedTransaction.subCategory)
								?.name.value
						}
					</div>
				</div>
				<div style={{ textAlign: "right" }}>
					<div style={{ marginBottom: "3px" }}>
						{getAccountByID(
							modifiedTransaction.account
						)?.name.toString() ?? ""}
					</div>
					<div>
						{prevBalance.toString()} {"->"}{" "}
						{accumulatedBalance.toString()}
					</div>
				</div>
			</span>
		</li>
	);
};

const AccountingListRowGroup = ({
	date,
	transactionsWithBalance,
	selectedTransaction,
}: {
	date: string;
	transactionsWithBalance: {
		transaction: Transaction;
		balance: ReportBalance;
		prevBalance: ReportBalance;
	}[];
	selectedTransaction?: Transaction;
}) => {
	const { getCategoryByID, getSubCategoryByID } = useCategories();
	const { getAccountByID } = useAccounts();
	return (
		<div>
			<div
				style={{
					paddingRight: "7px",
					marginRight: "15px",
					marginTop: "15px",
					marginBottom: "7px",
				}}
			>
				<b>{date}</b>
			</div>
			<ul className="accounting-list">
				{transactionsWithBalance.map((transactionWithBalance) => {
					const transaction = transactionWithBalance.transaction;
					return (
						<>
							<AccountingListRow
								setAction={() => {}}
								transaction={transaction}
								selection={[]}
								selectionActive={false}
								setSelection={() => {}}
								setSelectedRecord={() => {}}
								accumulatedBalance={
									transactionWithBalance.balance
								}
								prevBalance={transactionWithBalance.prevBalance}
							/>
							{false &&
								selectedTransaction?.id.equalTo(
									transaction.id
								) && (
									<EditTransactionPanel
										onUpdate={async () => {
											// setAction("");
											// updateTransactions();
										}}
										transaction={transaction}
										category={
											getCategoryByID(
												transaction.categoryID
											) ??
											Category.fromPrimitives(
												Category.emptyPrimitives()
											)
										}
										subCategory={
											getSubCategoryByID(
												transaction.subCategory
											) ??
											Subcategory.fromPrimitives(
												Subcategory.emptyPrimitives()
											)
										}
										account={
											getAccountByID(
												transaction.account
											) ??
											Account.fromPrimitives(
												Account.emptyPrimitives()
											)
										}
										toAccount={
											transaction.toAccount
												? getAccountByID(
														//@ts-ignore
														transaction.toAccount
												  ) ??
												  Account.fromPrimitives(
														Account.emptyPrimitives()
												  )
												: undefined
										}
									/>
								)}
						</>
					);
				})}
			</ul>
		</div>
	);
};
