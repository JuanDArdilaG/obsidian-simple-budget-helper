import { App } from "obsidian";
import { useContext, useEffect, useMemo, useState } from "react";
import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { AccountingListContextMenu } from "./AccountingListContextMenu";
import { RightSidebarReactTab } from "../RightSidebarReactTab";
import {
	AccountsContext,
	CategoriesContext,
	TransactionsContext,
} from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { Transaction } from "contexts/Transactions/domain";
import { ReportBalance } from "contexts";
import { useAccountSelect } from "apps/obsidian-plugin/components";
import { useCategorySelect } from "apps/obsidian-plugin/components/Select/CategorySelect";
import { useSubCategorySelect } from "apps/obsidian-plugin/components/Select/SubCategorySelect";

export function AccountingList({
	app,
	statusBarAddText,
}: {
	app: App;
	statusBarAddText: (val: string | DocumentFragment) => void;
}) {
	const logger = useLogger("AccountingList");
	const {
		useCases: { deleteTransaction },
	} = useContext(TransactionsContext);
	const {
		setFilters,
		filteredTransactionsReport,
		updateFilteredTransactions,
	} = useContext(TransactionsContext);

	const { AccountSelect, account } = useAccountSelect({});
	const { CategorySelect, category } = useCategorySelect({});
	const { SubCategorySelect, subCategory } = useSubCategorySelect({});

	useEffect(() => {
		setFilters([account?.id, category?.id, subCategory?.id]);
	}, [account, category, subCategory]);

	const withAccumulatedBalanceTransactionsGrouped = useMemo(() => {
		const res: [
			date: string,
			{
				transaction: Transaction;
				balance: ReportBalance;
				prevBalance: ReportBalance;
			}[]
		][] = [];
		filteredTransactionsReport
			.withAccumulatedBalance()
			.forEach((withBalanceTransaction) => {
				const date =
					withBalanceTransaction.transaction.date.toPrettyFormatDate();
				if (!res.find((r) => r[0] === date)) res.push([date, []]);
				res.last()?.[1].push(withBalanceTransaction);
			});
		return res;
	}, [filteredTransactionsReport]);

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
			{AccountSelect}
			{CategorySelect}
			{SubCategorySelect}
			{selectedTransaction && (
				<AccountingListContextMenu
					app={app}
					transaction={selectedTransaction}
					onEdit={async () => setAction("edit")}
					onDelete={async () => {
						await deleteTransaction.execute(selectedTransaction.id);
						updateFilteredTransactions();
					}}
				/>
			)}
			{withAccumulatedBalanceTransactionsGrouped.map(
				([date, withBalanceTransactions]) => (
					<AccountingListRowGroup
						key={date}
						date={date}
						transactionsWithBalance={withBalanceTransactions}
						selectedTransaction={selectedTransaction}
						selection={selection}
						setSelection={setSelection}
						setSelectedTransaction={setSelectedTransaction}
					/>
				)
			)}
		</RightSidebarReactTab>
	);
}

const AccountingListRow = ({
	transactionWithBalance: { transaction, balance, prevBalance },
	selectionActive,
	selection,
	setSelection,
	setSelectedTransaction,
	setAction,
}: {
	transactionWithBalance: {
		transaction: Transaction;
		balance: ReportBalance;
		prevBalance: ReportBalance;
	};
	selectionActive: boolean;
	selection: Transaction[];
	setSelection: React.Dispatch<React.SetStateAction<Transaction[]>>;
	setSelectedTransaction: React.Dispatch<React.SetStateAction<Transaction>>;
	setAction: React.Dispatch<React.SetStateAction<string>>;
}) => {
	const logger = useLogger("AccountingListRow");
	const { getAccountByID } = useContext(AccountsContext);
	const { getCategoryByID, getSubCategoryByID } =
		useContext(CategoriesContext);
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
			.on()
			.log();
		return <></>;
	}

	return (
		<li
			key={transaction.id.toString()}
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
				setAction("");
				setSelectedTransaction(transaction);
			}}
			className="accounting-list-item"
			style={{
				backgroundColor: selection.includes(transaction)
					? "var(--background-modifier-hover)"
					: "",
			}}
		>
			<span className="first-row">
				<div>
					<span style={{ fontSize: "0.7em" }}>
						{transaction.date.toPrettyFormatHour()}
					</span>{" "}
					{transaction.name.toString()}
				</div>
				<div
					style={{
						color: transaction.operation.isIncome()
							? "var(--color-green)"
							: transaction.operation.isExpense()
							? "var(--color-red)"
							: "var(--color-blue)",
					}}
				>
					{/* {transaction.operation.isExpense() ||
					(transaction.operation.isTransfer() &&
						transaction.amount.isPositive())
						? "-"
						: "+"} */}
					{transaction.getRealAmountForAccount(account.id).toString()}
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
							transaction.categoryID
						)?.name.toString() ?? ""}
					</div>
					<div>
						<b>SubCategory:</b>{" "}
						{
							getSubCategoryByID(transaction.subCategory)?.name
								.value
						}
					</div>
				</div>
				<div style={{ textAlign: "right" }}>
					<div style={{ marginBottom: "3px" }}>
						{account?.name.toString() ?? ""}
					</div>
					<div>
						{prevBalance.toString()} {"->"} {balance.toString()}
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
	selection,
	setSelection,
	setSelectedTransaction,
}: {
	date: string;
	transactionsWithBalance: {
		transaction: Transaction;
		balance: ReportBalance;
		prevBalance: ReportBalance;
	}[];
	selectedTransaction?: Transaction;
	selection: Transaction[];
	setSelection: React.Dispatch<React.SetStateAction<Transaction[]>>;
	setSelectedTransaction: React.Dispatch<React.SetStateAction<Transaction>>;
}) => {
	const logger = useLogger("AccountingListRowGroup").off();
	return (
		<div>
			<div
				style={{
					paddingRight: "7px",
					marginRight: "15px",
					marginTop: "15px",
				}}
			>
				<b>{date}</b>
			</div>
			<ul className="accounting-list">
				{transactionsWithBalance.map((transactionWithBalance) => {
					const transaction = transactionWithBalance.transaction;
					// false &&
					// 			selectedTransaction?.id.equalTo(
					// 				transaction.id
					// 			) && (
					// 				<EditTransactionPanel
					// 					onUpdate={async () => {
					// 						// setAction("");
					// 						// updateTransactions();
					// 					}}
					// 					transaction={transaction}
					// 					getCategoryByID={getCategoryByID}
					// 					getSubCategoryByID={getSubCategoryByID}
					// 					getAccountByID={getAccountByID}
					// 				/>
					// 			)
					return (
						<AccountingListRow
							key={transaction.id.toString()}
							setAction={() => {}}
							transactionWithBalance={transactionWithBalance}
							selection={selection}
							selectionActive={true}
							setSelection={setSelection}
							setSelectedTransaction={setSelectedTransaction}
						/>
					);
				})}
			</ul>
		</div>
	);
};
