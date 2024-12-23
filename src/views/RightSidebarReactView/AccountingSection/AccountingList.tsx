import { useCallback, useEffect, useState } from "react";
import { BudgetItemRecord } from "budget/BudgetItemRecord";
import { Budget } from "budget/Budget";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";

type GroupByYearMonth = {
	[year: number]: {
		[month: string]: BudgetItemRecord[];
	};
};

export function AccountingList({ budget }: { budget: Budget }) {
	const [allHistory, setAllHistory] = useState<GroupByYearMonth>([]);

	const groupRecordsByYearMonth = useCallback(
		(records: BudgetItemRecord[]) => {
			const monthsAbbr = [
				"Jan",
				"Feb",
				"Mar",
				"Apr",
				"May",
				"Jun",
				"Jul",
				"Aug",
				"Sep",
				"Oct",
				"Nov",
				"Dec",
			];
			return records.reduce((grouped, record) => {
				const year = record.date.getFullYear();
				const month = monthsAbbr[record.date.getMonth()];

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
			{Object.keys(allHistory)
				.sort()
				.map((year) => (
					<div style={{ marginBottom: "60px" }} key={year}>
						<h3>
							{year}
							<span
								style={{
									float: "right",
									fontSize: "0.6em",
									color: "tomato",
								}}
							>
								Expenses:{" "}
								{new PriceValueObject(
									Object.values(allHistory[year]).reduce(
										(
											sum: number,
											records: BudgetItemRecord[]
										) =>
											sum +
											records.reduce(
												(
													sum: number,
													record: BudgetItemRecord
												) => sum + record.amount,
												0
											),
										0
									)
								).toString()}
							</span>
						</h3>
						{Object.keys(allHistory[year])
							.sort()
							.map((month) => (
								<div
									key={month}
									style={{ marginBottom: "40px" }}
								>
									<h4 style={{ marginBottom: "30px" }}>
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
													allHistory[year][month]
														.filter(
															(
																record: BudgetItemRecord
															) =>
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
												Balance:{" "}
												{new PriceValueObject(
													allHistory[year][
														month
													].reduce(
														(
															sum: number,
															record: BudgetItemRecord
														) =>
															sum +
															record.amount *
																(record.type ===
																"expense"
																	? -1
																	: 1),
														0
													)
												).toString()}
											</span>
										</span>
									</h4>
									<ul className="accounting-list">
										{allHistory[year][month]
											.sort((a, b) => b.date - a.date)
											.map((record: BudgetItemRecord) => (
												<li
													key={`${
														record.name
													}${record.date.toString()}`}
												>
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
														{new PriceValueObject(
															record.amount
														).toString()}
													</span>
												</li>
											))}
									</ul>
								</div>
							))}
					</div>
				))}
		</div>
	);
}
