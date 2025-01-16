import { useCallback, useContext, useEffect, useState } from "react";
import { BudgetItemRecord } from "budget/BudgetItem/BudgetItemRecord";
import { Budget } from "budget/Budget/Budget";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { BudgetHistory } from "budget/Budget/BudgetHistory";
import {
	FileOperationsContext,
	SettingsContext,
} from "../RightSidebarReactView";
import {
	getLastDayOfMonth,
	monthAbbrToIndex,
	monthIndexToAbbr,
} from "utils/date";
import { ContextMenu } from "./AccountingListMenuContext";
import { Menu } from "./Menu";
import { EditBudgetItemRecordModalRoot } from "modals/CreateBudgetItemModal/EditBudgetItemRecordModalRoot";

type GroupByYearMonthDay = {
	[year: number]: {
		[month: string]: {
			[day: number]: BudgetItemRecord[];
		};
	};
};

export function AccountingList({
	budget,
	editModal,
}: {
	budget: Budget;
	editModal: EditBudgetItemRecordModalRoot;
}) {
	const settings = useContext(SettingsContext);
	const fileOperations = useContext(FileOperationsContext);

	const [budgetHistory, setBudgetHistory] = useState(
		new BudgetHistory(budget, settings.initialBudget)
	);
	const [allHistory, setAllHistory] = useState<GroupByYearMonthDay>([]);
	const [selectedRecord, setSelectedRecord] = useState<BudgetItemRecord>();

	useEffect(() => {
		setBudgetHistory(new BudgetHistory(budget, settings.initialBudget));
	}, [budget, settings.initialBudget]);

	const groupRecordsByYearMonth = useCallback(
		(records: BudgetItemRecord[]) => {
			return records.reduce((grouped, record) => {
				const year = record.date.getFullYear();
				const month = monthIndexToAbbr(record.date.getMonth());

				if (!grouped[year]) grouped[year] = {};
				if (!grouped[year][month]) grouped[year][month] = {};
				if (!grouped[year][month][record.date.getDate()])
					grouped[year][month][record.date.getDate()] = [];

				grouped[year][month][record.date.getDate()].push(record);
				return grouped;
			}, {} as GroupByYearMonthDay);
		},
		[budget]
	);

	useEffect(() => {
		setAllHistory(groupRecordsByYearMonth(budget.getAllHistory()));
	}, [budget]);

	return (
		<div>
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
								if (item.isRecurrent) {
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
			<div>
				Balance:{" "}
				{new PriceValueObject(budgetHistory.getBalance()).toString()}
			</div>
			{Object.keys(allHistory)
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
											since: new Date(Number(year), 0, 1),
											until: new Date(
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
											since: new Date(Number(year), 0, 1),
											until: new Date(
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
											until: new Date(
												Number(year),
												11,
												31
											),
										})
									).toString()}
								</span>
							</span>
						</h3>
						{Object.keys(allHistory[year])
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
																since,
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
																since,
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
																until,
															}
														)
													).toString()}
												</span>
											</span>
										</h4>
										<ul className="accounting-list">
											{Object.keys(
												allHistory[year][month]
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
															{allHistory[year][
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
																	) => (
																		<li
																			key={
																				index
																			}
																			onContextMenu={() =>
																				setSelectedRecord(
																					record
																				)
																			}
																		>
																			<span
																				style={{
																					padding:
																						"0px 7px",
																				}}
																			>
																				{
																					record.name
																				}{" "}
																			</span>
																			<span
																				style={{
																					display:
																						"flex",
																					flexDirection:
																						"column",
																				}}
																			>
																				{record.type ===
																				"income"
																					? "+"
																					: "-"}
																				{new PriceValueObject(
																					record.amount
																				).toString()}
																				<span
																					style={{
																						fontSize:
																							"0.7em",
																						fontWeight:
																							"lighter",
																						alignSelf:
																							"flex-end",
																					}}
																				>
																					{new PriceValueObject(
																						budgetHistory.getBalance(
																							{
																								until: record.date,
																							}
																						)
																					).toString()}
																				</span>
																			</span>
																		</li>
																	)
																)}
														</div>
													)
												)}
											<li style={{ textAlign: "right" }}>
												<span>
													Initial balance:{" "}
													{new PriceValueObject(
														settings.initialBudget
													).toString()}
												</span>
											</li>
										</ul>
									</div>
								);
							})}
					</div>
				))}
		</div>
	);
}
