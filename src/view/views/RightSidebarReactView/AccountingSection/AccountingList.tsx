import { useContext, useEffect, useMemo, useState } from "react";
import { BudgetItemRecord } from "budget/BudgetItem/BugetItemRecord/BudgetItemRecord";
import { Budget } from "budget/Budget/Budget";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { BudgetHistory } from "budget/Budget/BudgetHistory";
import { BudgetContext, FileOperationsContext } from "../RightSidebarReactView";
import { getLastDayOfMonth, monthAbbrToIndex } from "utils/date";
import { AccountingListContextMenu } from "./AccountingListContextMenu";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { BudgetItemRecurrent } from "budget/BudgetItem/BudgetItemRecurrent";
import { App } from "obsidian";
import { Logger } from "utils/logger";
import { EditBudgetItemRecordPanel } from "modals/CreateBudgetItemModal/EditBudgetItemRecordPanel";
import { RightSidebarReactTab } from "../RightSidebarReactTab";

export function AccountingList({
	app,
	statusBarAddText,
}: {
	app: App;
	statusBarAddText: (val: string | DocumentFragment) => void;
}) {
	const { refresh, itemOperations } = useContext(FileOperationsContext);
	const { budget } = useContext(BudgetContext);
	const accounts = useMemo(() => budget.getAccounts(), [budget]);
	const categories = useMemo(() => budget.getCategories(), [budget]);

	const [accountFilter, setAccountFilter] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("");

	const budgetHistory = useMemo(() => {
		const history = BudgetHistory.fromBudget(
			budget,
			accountFilter ?? undefined,
			categoryFilter ?? undefined
		);
		Logger.debug("history with filter", {
			filter: accountFilter,
			category: categoryFilter,
			history,
		});
		return history;
	}, [budget, accountFilter, categoryFilter]);
	const filteredHistory = useMemo(() => {
		const history = budgetHistory.getGroupedByYearMonthDay();
		Logger.debug("grouped filtered history", { history });
		return history;
	}, [budgetHistory]);

	const [selectedRecord, setSelectedRecord] = useState<BudgetItemRecord>();
	const [action, setAction] = useState("");

	const [selectionActive, setSelectionActive] = useState(false);
	const [selection, setSelection] = useState<BudgetItemRecord[]>([]);

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
							(total, record) =>
								total +
								record.amount.toNumber() *
									(record.type === "income" ? 1 : -1),
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
					<option value={account} key={account}>
						{account}
					</option>
				))}
			</select>
			<select
				name="category"
				id="category-filter"
				onChange={(e) => setCategoryFilter(e.target.value)}
			>
				<option value="">All categories</option>
				{categories.map((category) => (
					<option value={category} key={category}>
						{category}
					</option>
				))}
			</select>
			{selectedRecord && (
				<AccountingListContextMenu
					app={app}
					record={selectedRecord}
					onEdit={async () => {
						setAction("edit");
					}}
					onDelete={async (record) => {
						const item = budget.getItemByID(record.itemID);
						if (!item) return;
						if (item instanceof BudgetItemRecurrent) {
							item.removeHistoryRecord(record.id);
						}
						await itemOperations(item, "remove");
						await refresh();
					}}
					refresh={async () => await refresh()}
				/>
			)}
			{Object.keys(filteredHistory)
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
									{new PriceValueObject(
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
									).toString()}
								</span>
								<span
									style={{
										float: "right",
										fontSize: "0.6em",
										color: "var(--color-red)",
									}}
								>
									Expenses:{" "}
									{new PriceValueObject(
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
									).toString()}
								</span>
								<span
									style={{
										float: "right",
										fontSize: "0.6em",
									}}
								>
									Balance:{" "}
									{new PriceValueObject(
										budgetHistory.getBalance({
											untilDate: new Date(
												Number(year),
												11,
												31
											),
										})
									).toString()}
								</span>
							</span>
						</h3>
						{Object.keys(filteredHistory[year])
							.sort()
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
													{new PriceValueObject(
														budgetHistory.getBalance(
															{
																sinceDate:
																	since,
																untilDate:
																	until,
																type: "income",
															}
														)
													).toString()}
												</span>
												<span
													style={{
														float: "right",
														fontSize: "0.5em",
														color: "var(--color-red)",
													}}
												>
													Expenses:{" "}
													{new PriceValueObject(
														budgetHistory.getBalance(
															{
																type: "expense",
																sinceDate:
																	since,
																untilDate:
																	until,
															}
														)
													).toString()}
												</span>
												<span
													style={{
														float: "right",
														fontSize: "0.5em",
													}}
												>
													Balance:
													{new PriceValueObject(
														budgetHistory.getBalance(
															{
																untilDate:
																	until,
															}
														)
													).toString()}
												</span>
											</span>
										</h4>
										<ul className="accounting-list">
											{Object.keys(
												filteredHistory[year][month]
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
														{filteredHistory[year][
															month
														][day]
															.sort(
																(
																	a: BudgetItemRecord,
																	b: BudgetItemRecord
																) =>
																	b.date.getTime() -
																	a.date.getTime()
															)
															.map(
																(
																	record: BudgetItemRecord,
																	index: number
																) => {
																	return (
																		<div
																			key={
																				index
																			}
																		>
																			{record.type ===
																				"transfer" && (
																				<AccountingListRow
																					isTransfer
																					index={
																						record.id +
																						"transfer"
																					}
																					setAction={
																						setAction
																					}
																					record={
																						record
																					}
																					budget={
																						budget
																					}
																					budgetHistory={
																						budgetHistory
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
																						setSelectedRecord
																					}
																				/>
																			)}
																			<AccountingListRow
																				index={
																					record.id
																				}
																				setAction={
																					setAction
																				}
																				record={
																					record
																				}
																				budget={
																					budget
																				}
																				budgetHistory={
																					budgetHistory
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
																					setSelectedRecord
																				}
																			/>
																			{action ===
																				"edit" &&
																				record ===
																					selectedRecord && (
																					<EditBudgetItemRecordPanel
																						onUpdate={async (
																							item
																						) => {
																							await itemOperations(
																								item,
																								"modify"
																							);
																							await refresh();
																						}}
																						record={
																							record
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
	record,
	budget,
	budgetHistory,
	selectionActive,
	selection,
	setSelection,
	setSelectedRecord,
	isTransfer,
	setAction,
}: {
	index: string;
	isTransfer?: boolean;
	record: BudgetItemRecord;
	budget: Budget<BudgetItem>;
	budgetHistory: BudgetHistory;
	selectionActive: boolean;
	selection: BudgetItemRecord[];
	setSelection: React.Dispatch<React.SetStateAction<BudgetItemRecord[]>>;
	setSelectedRecord: React.Dispatch<React.SetStateAction<BudgetItemRecord>>;
	setAction: React.Dispatch<React.SetStateAction<string>>;
}) => {
	const modifiedRecord = useMemo(() => {
		if (!isTransfer) return record;
		return new BudgetItemRecord(
			record.id,
			record.itemID,
			record.account,
			record.toAccount,
			record.name,
			record.type,
			record.date,
			record.amount.negate()
		);
	}, [record, isTransfer]);

	return (
		<li
			key={index}
			onClick={() => {
				if (selectionActive)
					setSelection((prevSelection) =>
						prevSelection.includes(modifiedRecord)
							? prevSelection.filter(
									(item) => item !== modifiedRecord
							  )
							: [...prevSelection, modifiedRecord]
					);
			}}
			onContextMenu={() => {
				setAction("");
				setSelectedRecord(modifiedRecord);
			}}
			className="accounting-list-item"
			style={{
				backgroundColor: selection.includes(modifiedRecord)
					? "gray"
					: "",
			}}
		>
			<span className="first-row">
				<div>{modifiedRecord.name}</div>
				<div
					style={{
						color:
							modifiedRecord.type === "expense"
								? "var(--color-red)"
								: modifiedRecord.type === "transfer"
								? "var(--color-blue)"
								: "var(--color-green)",
					}}
				>
					{modifiedRecord.type === "expense" ||
					(!isTransfer && modifiedRecord.type === "transfer")
						? "-"
						: "+"}
					{(!isTransfer
						? modifiedRecord.amount
						: modifiedRecord.amount.negate()
					).toString()}
				</div>
			</span>
			<span className="second-row">
				<div className="category">
					Category:{" "}
					{budget.getItemByID(modifiedRecord.itemID)?.category}
				</div>
				<span className="light-text align-right">
					{isTransfer
						? modifiedRecord.toAccount
						: modifiedRecord.account}
				</span>
			</span>
			<span className="third-row light-text">
				{new PriceValueObject(
					budgetHistory.getBalance({
						account: isTransfer
							? modifiedRecord.toAccount
							: modifiedRecord.account,
						untilID: modifiedRecord.id,
						dropLast: true,
					})
				).toString()}{" "}
				{" -> "}
				{new PriceValueObject(
					budgetHistory.getBalance({
						account: isTransfer
							? modifiedRecord.toAccount
							: modifiedRecord.account,
						untilID: modifiedRecord.id,
					})
				).toString()}
			</span>
		</li>
	);
};
