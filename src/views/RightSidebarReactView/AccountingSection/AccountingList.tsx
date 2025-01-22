import { useContext, useEffect, useState } from "react";
import { BudgetItemRecord } from "budget/BudgetItem/BugetItemRecord/BudgetItemRecord";
import { Budget } from "budget/Budget/Budget";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import {
	BudgetHistory,
	GroupByYearMonthDay,
} from "budget/Budget/BudgetHistory";
import {
	BudgetContext,
	FileOperationsContext,
	SettingsContext,
} from "../RightSidebarReactView";
import { getLastDayOfMonth, monthAbbrToIndex } from "utils/date";
import { ContextMenu } from "./AccountingListMenuContext";
import { Menu } from "./Menu";
import { EditBudgetItemRecordModalRoot } from "modals/CreateBudgetItemModal/EditBudgetItemRecordModalRoot";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { BudgetItemRecurrent } from "budget/BudgetItem/BudgetItemRecurrent";

export function AccountingList({
	editModal,
	statusBarAddText,
}: {
	budget: Budget<BudgetItem>;
	editModal: EditBudgetItemRecordModalRoot;
	statusBarAddText: (val: string | DocumentFragment) => void;
}) {
	const { budget } = useContext(BudgetContext);
	const settings = useContext(SettingsContext);
	const fileOperations = useContext(FileOperationsContext);

	const [budgetHistory, setBudgetHistory] = useState(
		new BudgetHistory([], settings.initialBudget)
	);
	const [allHistory, setAllHistory] = useState<GroupByYearMonthDay>([]);
	const [filteredHistory, setFilteredHistory] = useState<GroupByYearMonthDay>(
		[]
	);
	const [selectedRecord, setSelectedRecord] = useState<BudgetItemRecord>();

	const [accountFilter, setAccountFilter] = useState("");
	useEffect(() => {
		setFilteredHistory(
			budgetHistory.getGroupedByYearMonthDay({
				account: accountFilter,
			})
		);
	}, [accountFilter, budgetHistory]);

	const [selectionActive, setSelectionActive] = useState(false);
	const [selection, setSelection] = useState<BudgetItemRecord[]>([]);

	useEffect(() => {
		window.addEventListener("keydown", (e) => {
			if (e.shiftKey) setSelectionActive(true);
		});
		window.addEventListener("keyup", (e) => {
			if (!e.shiftKey) setSelectionActive(false);
		});

		return () => {
			window.removeEventListener("keydown", (e) => {
				if (e.shiftKey) setSelectionActive(true);
			});
			window.removeEventListener("keyup", (e) => {
				if (!e.shiftKey) setSelectionActive(false);
			});
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
	}, [selectionActive, selection]);

	useEffect(() => {
		if (!selectionActive) {
			setSelection([]);
		}
	}, [selectionActive]);

	useEffect(() => {
		console.log("updating history");
		setBudgetHistory(
			BudgetHistory.fromBudget(
				budget,
				settings.initialBudget,
				accountFilter ?? undefined
			)
		);
	}, [budget, settings.initialBudget]);

	useEffect(() => {
		setAllHistory(budgetHistory.getGroupedByYearMonthDay());
	}, [budgetHistory]);

	return (
		<div>
			<select
				name="account"
				id="account-filter"
				onChange={(e) => setAccountFilter(e.target.value)}
			>
				<option value="">All accounts</option>
				{budget.getAccounts().map((account) => (
					<option value={account} key={account}>
						{account}
					</option>
				))}
			</select>
			{selectedRecord && (
				<ContextMenu
					menu={
						<Menu
							record={selectedRecord}
							onEdit={async (record) => {
								editModal.setRecord(record);
								editModal.open();
							}}
							onDelete={async (record) => {
								const item = budget.getItemByID(record.itemID);
								if (!item) return;
								if (item instanceof BudgetItemRecurrent) {
									item.removeHistoryRecord(record.id);
								}
								await fileOperations.updateItemFile(
									item,
									"remove"
								);
								await fileOperations.refresh();
							}}
						/>
					}
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
										color: "greenyellow",
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
										color: "tomato",
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
										key={month}
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
														color: "greenyellow",
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
														color: "tomato",
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
												.map(
													(
														day: number,
														index: number
													) => (
														<div
															key={index}
															style={{
																marginTop:
																	"15px",
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
																<b>{day}</b>
															</span>
															{filteredHistory[
																year
															][month][day]
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
																			<>
																				{record.type ===
																					"transfer" && (
																					<AccountingListRow
																						isTransfer
																						index={
																							record.id +
																							"transfer"
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
																			</>
																		);
																	}
																)}
														</div>
													)
												)}
										</ul>
									</div>
								);
							})}

						<div className="align-right">
							<span>
								Initial balance:{" "}
								{new PriceValueObject(
									settings.initialBudget
								).toString()}
							</span>
						</div>
					</div>
				))}
		</div>
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
}) => {
	const [modifiedRecord, setModifiedRecord] = useState(record);
	useEffect(() => {
		if (!isTransfer) return;
		setModifiedRecord(
			new BudgetItemRecord(
				record.id,
				record.itemID,
				record.account,
				record.toAccount,
				record.name,
				record.type,
				record.date,
				record.amount.negate()
			)
		);
	}, [record]);

	return (
		<li
			key={index}
			onClick={() => {
				if (selectionActive)
					setSelection((selection) => {
						if (selection.includes(modifiedRecord))
							return selection.filter(
								(item) => item !== modifiedRecord
							);
						return [
							...new Set<BudgetItemRecord>([
								...selection,
								modifiedRecord,
							]),
						];
					});
			}}
			onContextMenu={() => setSelectedRecord(modifiedRecord)}
			className="accounting-list-item"
			style={{
				backgroundColor: selection.includes(modifiedRecord)
					? "gray"
					: "",
			}}
		>
			<span className="first-row">
				<div>{modifiedRecord.name}</div>
				<div>
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
