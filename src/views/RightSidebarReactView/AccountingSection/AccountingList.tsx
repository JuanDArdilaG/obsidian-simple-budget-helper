import { useCallback, useContext, useEffect, useState } from "react";
import { BudgetItemRecord } from "budget/BudgetItem/BudgetItemRecord";
import { Budget } from "budget/Budget/Budget";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { BudgetHistory } from "budget/Budget/BudgetHistory";
import { SettingsContext } from "../RightSidebarReactView";
import {
	getLastDayOfMonth,
	monthAbbrToIndex,
	monthIndexToAbbr,
} from "utils/date";

type GroupByYearMonth = {
	[year: number]: {
		[month: string]: BudgetItemRecord[];
	};
};

export function AccountingList({ budget }: { budget: Budget }) {
	const settings = useContext(SettingsContext);
	const [budgetHistory, setBudgetHistory] = useState(
		new BudgetHistory(budget, settings.initialBudget)
	);
	const [allHistory, setAllHistory] = useState<GroupByYearMonth>([]);

	useEffect(() => {
		setBudgetHistory(new BudgetHistory(budget, settings.initialBudget));
	}, [budget, settings.initialBudget]);

	const groupRecordsByYearMonth = useCallback(
		(records: BudgetItemRecord[]) => {
			return records.reduce((grouped, record) => {
				const year = record.date.getFullYear();
				const month = monthIndexToAbbr(record.date.getMonth());

				if (!grouped[year]) grouped[year] = {};
				if (!grouped[year][month]) grouped[year][month] = [];

				grouped[year][month].push(record);
				return grouped;
			}, {} as GroupByYearMonth);
		},
		[budget]
	);

	useEffect(() => {
		setAllHistory(groupRecordsByYearMonth(budget.getAllHistory()));
	}, [budget]);

	return (
		<div>
			<div>
				Balance:{" "}
				{new PriceValueObject(budgetHistory.getBalance()).toString()}
			</div>
			{Object.keys(allHistory)
				.sort((a, b) => Number(b) - Number(a))
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
										Number(
											Object.values(
												allHistory[year]
											).reduce(
												(
													sum: number,
													records: BudgetItemRecord[]
												) =>
													sum +
													records
														.filter(
															(record) =>
																record.type ===
																"income"
														)
														.reduce(
															(
																sum: number,
																record: BudgetItemRecord
															) =>
																sum +
																record.amount,
															0
														),
												0
											)
										)
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
										Number(
											Object.values(
												allHistory[year]
											).reduce(
												(
													sum: number,
													records: BudgetItemRecord[]
												) =>
													sum +
													records
														.filter(
															(record) =>
																record.type ===
																"expense"
														)
														.reduce(
															(
																sum: number,
																record: BudgetItemRecord
															) =>
																sum +
																record.amount,
															0
														),
												0
											)
										)
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
														allHistory[year][month]
															.filter(
																(
																	record: BudgetItemRecord
																) =>
																	record.type ===
																	"expense"
															)
															.reduce(
																(
																	sum: number,
																	record: BudgetItemRecord
																) =>
																	sum +
																	record.amount,
																0
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
											{allHistory[year][month]
												.sort((a, b) => b.date - a.date)
												.map(
													(
														record: BudgetItemRecord,
														index: number
													) => (
														<li key={index}>
															<span>
																<b
																	style={{
																		marginRight:
																			"15px",
																	}}
																>
																	{record.date.getDate()}
																</b>{" "}
																{record.name}{" "}
															</span>
															<span>
																{record.type ===
																"income"
																	? "+"
																	: "-"}
																{new PriceValueObject(
																	record.amount
																).toString()}
															</span>
														</li>
													)
												)}
										</ul>
									</div>
								);
							})}
					</div>
				))}
		</div>
	);
}
