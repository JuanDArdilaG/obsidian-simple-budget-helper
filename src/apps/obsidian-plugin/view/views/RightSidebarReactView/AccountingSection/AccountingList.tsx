import { useContext, useEffect, useMemo, useState } from "react";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { AppContext } from "../RightSidebarReactView";
import {
	getLastDayOfMonth,
	monthAbbrToIndex,
} from "../../../../../../../utils/date";
import { AccountingListContextMenu } from "./AccountingListContextMenu";
import { App } from "obsidian";
import { RightSidebarReactTab } from "../RightSidebarReactTab";
import { DeleteTransactionUseCase } from "contexts/Transactions/application";
import { Transaction } from "contexts/Transactions/domain";
import { useAsyncCallback } from "apps/obsidian-plugin/view/hooks";
import {
	GetAllTransactionsGroupedByDaysUseCase,
	GetAllTransactionsGroupedByDaysUseCaseOutput,
} from "contexts/Reports/application";
import { EditTransactionPanel } from "apps/obsidian-plugin/modals";

export function AccountingList({
	app,
	statusBarAddText,
}: {
	app: App;
	statusBarAddText: (val: string | DocumentFragment) => void;
}) {
	const { refresh, categoriesWithSubcategories, accounts, container } =
		useContext(AppContext);

	const getAllTransactionsGroupedByDaysUseCase = container.resolve(
		"getAllTransactionsGroupedByDaysUseCase"
	) as GetAllTransactionsGroupedByDaysUseCase;
	const deleteTransactionUseCase = container.resolve(
		"deleteTransactionUseCase"
	) as DeleteTransactionUseCase;

	const transactionsGroupedByDay =
		useAsyncCallback<GetAllTransactionsGroupedByDaysUseCaseOutput>(
			getAllTransactionsGroupedByDaysUseCase,
			getAllTransactionsGroupedByDaysUseCase.execute
		) ?? [];

	const [categoryFilter, setCategoryFilter] = useState("");

	const [accountFilter, setAccountFilter] = useState("");
	const [subCategoryFilter, setSubCategoryFilter] = useState("");

	// const budgetHistory = useMemo(() => {
	// 	const history = BudgetHistory.fromBudget(
	// 		accountFilter ?? undefined,
	// 		categoryFilter ?? undefined,
	// 		subCategoryFilter ?? undefined
	// 	);
	// 	Logger.debug("history with filter", {
	// 		filter: accountFilter,
	// 		category: categoryFilter,
	// 		subCategory: subCategoryFilter,
	// 		history,
	// 	});
	// 	return history;
	// }, [accountFilter, categoryFilter, subCategoryFilter]);
	// const filteredHistory = useMemo(() => {
	// 	const history = budgetHistory.getGroupedByYearMonthDay();
	// 	Logger.debug("grouped filtered history", { history });
	// 	return history;
	// }, [budgetHistory]);

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
			<select
				name="account"
				id="account-filter"
				onChange={(e) => setAccountFilter(e.target.value)}
			>
				<option value="">All accounts</option>
				{accounts.map((account) => (
					<option
						value={account.name.toString()}
						key={account.name.toString()}
					>
						{account.name.toString()}
					</option>
				))}
			</select>
			<select
				name="category"
				id="category-filter"
				onChange={(e) => setCategoryFilter(e.target.value)}
			>
				<option value="">All categories</option>
				{categoriesWithSubcategories.map((catWithSub) => (
					<option
						value={catWithSub.category.name.toString()}
						key={catWithSub.category.name.toString()}
					>
						{catWithSub.category.name.toString()}
					</option>
				))}
			</select>
			<select
				name="subcategory"
				id="subcategory-filter"
				onChange={(e) => setSubCategoryFilter(e.target.value)}
			>
				<option value="">All sub categories</option>
				{categoriesWithSubcategories.map((catWithSubs) =>
					catWithSubs.subCategories
						.map((subs) => subs.name.value)
						.map((subName) => (
							<option value={subName} key={subName}>
								{subName}
							</option>
						))
				)}
			</select>
			{selectedTransaction && (
				<AccountingListContextMenu
					app={app}
					transaction={selectedTransaction}
					onEdit={async () => {
						setAction("edit");
					}}
					onDelete={async () => {
						await deleteTransactionUseCase.execute(
							selectedTransaction.id
						);
						await refresh();
					}}
				/>
			)}
			{Object.keys(transactionsGroupedByDay)
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
						{Object.keys(transactionsGroupedByDay[year])
							.sort(
								(a, b) =>
									monthAbbrToIndex(b) - monthAbbrToIndex(a)
							)
							.map((month) => {
								const since = new Date(
									Number(year),
									monthAbbrToIndex(month)
								);
								const until = new Date(
									Number(year),
									monthAbbrToIndex(month),
									getLastDayOfMonth(
										Number(year),
										monthAbbrToIndex(month)
									)
								);
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
												transactionsGroupedByDay[year][
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
														{transactionsGroupedByDay[
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
																					transactionsGrouped={
																						transactionsGroupedByDay
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
																				/>
																			)}
																			<AccountingListRow
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
																				transactionsGrouped={
																					transactionsGroupedByDay
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
																			/>
																			{action ===
																				"edit" &&
																				transaction ===
																					selectedTransaction && (
																					<EditTransactionPanel
																						onUpdate={async () =>
																							await refresh()
																						}
																						transaction={
																							transaction
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
	transactionsGrouped,
	selectionActive,
	selection,
	setSelection,
	setSelectedRecord,
	isTransfer,
	setAction,
}: {
	index: string;
	isTransfer?: boolean;
	transaction: Transaction;
	transactionsGrouped: GetAllTransactionsGroupedByDaysUseCaseOutput;
	selectionActive: boolean;
	selection: Transaction[];
	setSelection: React.Dispatch<React.SetStateAction<Transaction[]>>;
	setSelectedRecord: React.Dispatch<React.SetStateAction<Transaction>>;
	setAction: React.Dispatch<React.SetStateAction<string>>;
}) => {
	const modifiedTransaction = useMemo(() => {
		if (!isTransfer) return transaction;
		return new Transaction(
			transaction.id,
			transaction.itemID,
			transaction.account,
			transaction.name,
			transaction.operation,
			transaction.category,
			transaction.subCategory,
			transaction.date,
			transaction.amount.negate(),
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
					<b>Category:</b> {transaction.category.toString()}
				</div>
				<span>
					{isTransfer
						? modifiedTransaction.toAccount?.value
						: modifiedTransaction.account.value}
				</span>
			</span>
			<span className="second-row light-text">
				<div className="category">
					<b>SubCategory:</b> {transaction.subCategory.value}
				</div>
				{/* <span>
					{new PriceValueObject(
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
					).toString()}
				</span> */}
			</span>
		</li>
	);
};
