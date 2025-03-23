import { useContext, useEffect, useMemo, useState } from "react";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { monthAbbrToIndex } from "../../../../../../utils/date";
import { AccountingListContextMenu } from "./AccountingListContextMenu";
import { App } from "obsidian";
import { RightSidebarReactTab } from "../RightSidebarReactTab";
import { Transaction } from "contexts/Transactions/domain";
import { EditTransactionPanel } from "apps/obsidian-plugin/panels";
import { TransactionsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { useAccounts } from "apps/obsidian-plugin/hooks/useAccounts";
import { useTransactions } from "apps/obsidian-plugin/hooks/useTransactions";
import { useCategories } from "apps/obsidian-plugin/hooks/useCategories";
import {
	Category,
	CategoryID,
	CategoryName,
	GetAllCategoriesWithSubCategoriesUseCaseOutput,
} from "contexts/Categories";
import { Account, AccountID, AccountName } from "contexts/Accounts";
import {
	Logger,
	ReportBalance,
	SubcategoryID,
	SubcategoryName,
	TransactionsReport,
} from "contexts";
import { Select } from "apps/obsidian-plugin/components";
import { Subcategory } from "../../../../../contexts/Subcategories/domain/subcategory.entity";

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

	const { accounts, getAccountByID } = useAccounts();

	const [accountFilter, setAccountFilter] = useState<AccountID>();
	const [categoryFilter, setCategoryFilter] = useState<CategoryID>();
	const [subCategoryFilter, setSubCategoryFilter] = useState<SubcategoryID>();
	const { updateTransactions, transactions } = useTransactions({
		accountFilter,
		categoryFilter,
		subCategoryFilter,
	});

	const groupedTransactionsByDay = useMemo(
		() => new TransactionsReport(transactions).groupByDays(),
		[transactions]
	);

	const withAccumulatedBalanceTransactions = useMemo(() => {
		const res = new TransactionsReport(
			transactions
		).withAccumulatedBalance();
		Logger.debug(
			"AccountingList: with accumulated balance transactions",
			{
				transactions: res.map((r) => ({
					balance: r.balance.valueOf(),
					transaction: r.transaction.toPrimitives(),
				})),
			},
			{ on: false }
		);
		return res;
	}, [transactions]);

	const {
		categoriesWithSubcategories,
		categories,
		getCategoryByID,
		getSubCategoryByID,
	} = useCategories();

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
						accountName
							? accounts.find((acc) =>
									acc.name.equalTo(
										new AccountName(accountName)
									)
							  )?.id
							: undefined
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
						catName
							? categories.find((cat) =>
									cat.name.equalTo(new CategoryName(catName))
							  )?.id
							: undefined
					)
				}
			/>
			<Select
				id="subcategory-filter"
				label="SubCategory"
				value={subCategoryFilter?.value ?? ""}
				values={[
					"",
					...categoriesWithSubcategories
						.map((catWithSubs) => catWithSubs.subCategories)
						.flat()
						.map((sub) => sub.name.toString()),
				]}
				onChange={(subName) =>
					setSubCategoryFilter(
						subName
							? categoriesWithSubcategories
									.map(
										(catWithSubs) =>
											catWithSubs.subCategories
									)
									.flat()
									.find((sub) =>
										sub.name.equalTo(
											new SubcategoryName(subName)
										)
									)?.id
							: undefined
					)
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
			{withAccumulatedBalanceTransactions.map(
				(withBalanceTransaction) => (
					<AccountingListRow
						accounts={accounts}
						categoriesWithSubcategories={
							categoriesWithSubcategories
						}
						index={withBalanceTransaction.transaction.id.value}
						setAction={setAction}
						transaction={withBalanceTransaction.transaction}
						selection={selection}
						selectionActive={selectionActive}
						setSelection={setSelection}
						setSelectedRecord={setSelectedTransaction}
						categories={categories}
						accumulatedBalance={withBalanceTransaction.balance}
					/>
				)
			)}
			{Object.keys(groupedTransactionsByDay)
				.sort((a, b) => Number(b) - Number(a))
				.map((year) => Number(year))
				.map((year) => (
					<div style={{ marginBottom: "50px" }} key={year}>
						<h3>
							{year}
							<span
								style={{
									display: "flex",
									flexDirection: "column",
									float: "right",
									textAlign: "right",
								}}
							>
								<span
									style={{
										float: "right",
										fontSize: "0.6em",
										color: "var(--color-green)",
									}}
								>
									Incomes:{" "}
									{/* {new PriceValueObject(
										budgetHistory.getBalance({
											type: "income",
											sinceDate: new Date(
												Number(year),
												0,
												1
											),
											untilDate: new Date(
												Number(year),
												11,
												31
											),
										})
									).toString()} */}
								</span>
								<span
									style={{
										float: "right",
										fontSize: "0.6em",
										color: "var(--color-red)",
									}}
								>
									Expenses:{" "}
									{/* {new PriceValueObject(
										budgetHistory.getBalance({
											type: "expense",
											sinceDate: new Date(
												Number(year),
												0,
												1
											),
											untilDate: new Date(
												Number(year),
												11,
												31
											),
										})
									).toString()} */}
								</span>
								<span
									style={{
										float: "right",
										fontSize: "0.6em",
									}}
								>
									Balance:{" "}
									{/* {new PriceValueObject(
										budgetHistory.getBalance({
											untilDate: new Date(
												Number(year),
												11,
												31
											),
										})
									).toString()} */}
								</span>
							</span>
						</h3>
						{Object.keys(groupedTransactionsByDay[year])
							.sort(
								(a, b) =>
									monthAbbrToIndex(b) - monthAbbrToIndex(a)
							)
							.map((month) => {
								return (
									<div
										key={`${year}-${month}`}
										style={{ marginBottom: "40px" }}
									>
										<h4
											style={{
												marginTop: "40px",
												marginBottom: "30px",
											}}
										>
											{month}{" "}
											<span
												style={{
													display: "flex",
													flexDirection: "column",
													float: "right",
													textAlign: "right",
												}}
											>
												<span
													style={{
														fontSize: "0.5em",
														color: "var(--color-green)",
													}}
												>
													Incomes:{" "}
													{/* {new PriceValueObject(
														budgetHistory.getBalance(
															{
																sinceDate:
																	since,
																untilDate:
																	until,
																type: "income",
															}
														)
													).toString()} */}
												</span>
												<span
													style={{
														float: "right",
														fontSize: "0.5em",
														color: "var(--color-red)",
													}}
												>
													Expenses:{" "}
													{/* {new PriceValueObject(
														budgetHistory.getBalance(
															{
																type: "expense",
																sinceDate:
																	since,
																untilDate:
																	until,
															}
														)
													).toString()} */}
												</span>
												<span
													style={{
														float: "right",
														fontSize: "0.5em",
													}}
												>
													Balance:
													{/* {new PriceValueObject(
														budgetHistory.getBalance(
															{
																untilDate:
																	until,
															}
														)
													).toString()} */}
												</span>
											</span>
										</h4>
										<ul className="accounting-list">
											{Object.keys(
												groupedTransactionsByDay[year][
													month
												]
											)
												.map((day) => Number(day))
												.sort((a, b) => b - a)
												.map((day: number) => (
													<div
														key={day}
														style={{
															marginTop: "15px",
														}}
													>
														<span
															style={{
																paddingRight:
																	"7px",
																marginRight:
																	"15px",
															}}
														>
															<b>
																{day} / {month}{" "}
																/ {year}
															</b>
														</span>
														{groupedTransactionsByDay[
															year
														][month][day]
															.sort(
																(
																	a: Transaction,
																	b: Transaction
																) =>
																	b.date.compare(
																		a.date
																	)
															)
															.map(
																(
																	transaction: Transaction,
																	index: number
																) => {
																	return (
																		<div
																			key={
																				index
																			}
																		>
																			{transaction.operation.isTransfer() && (
																				<AccountingListRow
																					accumulatedBalance={
																						new PriceValueObject(
																							0
																						)
																					}
																					accounts={
																						accounts
																					}
																					categoriesWithSubcategories={
																						categoriesWithSubcategories
																					}
																					isTransfer
																					index={
																						transaction.id +
																						"transfer"
																					}
																					setAction={
																						setAction
																					}
																					transaction={
																						transaction
																					}
																					selection={
																						selection
																					}
																					selectionActive={
																						selectionActive
																					}
																					setSelection={
																						setSelection
																					}
																					setSelectedRecord={
																						setSelectedTransaction
																					}
																					categories={
																						categories
																					}
																				/>
																			)}
																			<AccountingListRow
																				accumulatedBalance={
																					new PriceValueObject(
																						0
																					)
																				}
																				accounts={
																					accounts
																				}
																				categoriesWithSubcategories={
																					categoriesWithSubcategories
																				}
																				index={
																					transaction
																						.id
																						.value
																				}
																				setAction={
																					setAction
																				}
																				transaction={
																					transaction
																				}
																				selection={
																					selection
																				}
																				selectionActive={
																					selectionActive
																				}
																				setSelection={
																					setSelection
																				}
																				setSelectedRecord={
																					setSelectedTransaction
																				}
																				categories={
																					categories
																				}
																			/>
																			{action ===
																				"edit" &&
																				selectedTransaction?.id.equalTo(
																					transaction.id
																				) && (
																					<EditTransactionPanel
																						onUpdate={async () => {
																							setAction(
																								""
																							);
																							updateTransactions();
																						}}
																						transaction={
																							transaction
																						}
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
																										transaction.toAccount
																								  ) ??
																								  Account.fromPrimitives(
																										Account.emptyPrimitives()
																								  )
																								: undefined
																						}
																					/>
																				)}
																		</div>
																	);
																}
															)}
													</div>
												))}
										</ul>
									</div>
								);
							})}
					</div>
				))}
		</RightSidebarReactTab>
	);
}

const AccountingListRow = ({
	index,
	transaction,
	selectionActive,
	selection,
	setSelection,
	setSelectedRecord,
	isTransfer,
	setAction,
	accounts,
	accumulatedBalance,
}: {
	index: string;
	isTransfer?: boolean;
	transaction: Transaction;
	accumulatedBalance: ReportBalance;
	selectionActive: boolean;
	selection: Transaction[];
	accounts: Account[];
	categories: Category[];
	categoriesWithSubcategories: GetAllCategoriesWithSubCategoriesUseCaseOutput;
	setSelection: React.Dispatch<React.SetStateAction<Transaction[]>>;
	setSelectedRecord: React.Dispatch<React.SetStateAction<Transaction>>;
	setAction: React.Dispatch<React.SetStateAction<string>>;
}) => {
	const { getCategoryByID, getSubCategoryByID } = useCategories();

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
			key={index}
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
			{transaction.date}
			<span className="first-row">
				<div>{modifiedTransaction.name.toString()}</div>
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
			<span className="second-row light-text">
				<div className="category">
					<b>Category:</b>{" "}
					{getCategoryByID(
						modifiedTransaction.categoryID
					)?.name.toString() ?? ""}
				</div>
				<span>
					{accounts
						.find((acc) =>
							acc.id.equalTo(
								new AccountID(
									isTransfer
										? modifiedTransaction.toAccount
												?.value ?? ""
										: modifiedTransaction.account.value
								)
							)
						)
						?.name.toString() ?? ""}
				</span>
			</span>
			<span className="second-row light-text">
				<div className="category">
					<b>SubCategory:</b>{" "}
					{
						getSubCategoryByID(modifiedTransaction.subCategory)
							?.name.value
					}
				</div>
				{
					<span>
						{accumulatedBalance.toString()}
						{/* {new PriceValueObject(
						transactionsGrouped.getBalance({
							account: isTransfer
								? modifiedRecord.toAccount
								: modifiedRecord.account,
							untilID: modifiedRecord.id,
							dropLast: true,
						})
					).toString()}{" "}
					{" -> "}
					{new PriceValueObject(
						transactionsGrouped.getBalance({
							account: isTransfer
								? modifiedRecord.toAccount
								: modifiedRecord.account,
							untilID: modifiedRecord.id,
						})
					).toString()} */}
					</span>
				}
			</span>
		</li>
	);
};
