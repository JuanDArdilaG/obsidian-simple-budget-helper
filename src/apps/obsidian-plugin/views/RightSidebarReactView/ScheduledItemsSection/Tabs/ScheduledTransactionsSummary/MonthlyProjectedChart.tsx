import { DateValueObject, PriceValueObject } from "@juandardilag/value-objects";
import { X } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	MouseHandlerDataParam,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { LegendPayload } from "recharts/types/component/DefaultLegendContent";
import { ItemRecurrenceInfo } from "../../../../../../../contexts/ScheduledTransactions/domain";
import {
	PaymentSplit,
	Transaction,
	TransactionAmount,
} from "../../../../../../../contexts/Transactions/domain";
import { useLogger } from "../../../../../hooks";
import {
	AccountsContext,
	ScheduledTransactionsContext,
	TransactionsContext,
} from "../../../Contexts";

interface MonthlyData {
	name: string;
	income: TransactionAmount;
	expense: TransactionAmount;
	balance: TransactionAmount;
	accumulated: TransactionAmount;
	incomeScheduledTransactions: ItemRecurrenceInfo[];
	expenseScheduledTransactions: ItemRecurrenceInfo[];
	incomeTransactions: Transaction[];
	expenseTransactions: Transaction[];
}

export const MonthlyProjectedChart = () => {
	const { logger } = useLogger("MonthlyProjectedChart");
	const { accounts, getAccountByID } = useContext(AccountsContext);
	const {
		scheduledItems,
		useCases: { getScheduledTransactionsUntilDate },
	} = useContext(ScheduledTransactionsContext);
	const { transactions } = useContext(TransactionsContext);

	const [chartData, setChartData] = useState<MonthlyData[]>([]);
	const [lineVisibility, setLineVisibility] = useState<
		Record<string, boolean>
	>({
		income: true,
		expense: true,
		balance: true,
		accumulated: true,
	});
	const [selectedMonthData, setSelectedMonthData] =
		useState<MonthlyData | null>(null);

	const handleLegendClick = (data: LegendPayload) => {
		const { dataKey } = data;
		if (dataKey) {
			setLineVisibility((prev) => ({
				...prev,
				[dataKey as string]: !prev[dataKey as string],
			}));
		}
	};

	const handleChartClick = (nextState: MouseHandlerDataParam) => {
		if (
			!nextState.activeLabel ||
			nextState.activeIndex === null ||
			nextState.activeIndex === undefined
		) {
			return;
		}
		const i = Number.parseInt(nextState.activeIndex.toString());
		const data = chartData[i];
		console.log("Chart clicked", {
			nextState,
			data,
		});
		setSelectedMonthData(data);
	};

	useEffect(() => {
		// Calculate initial accumulated balance from account balances
		const months: MonthlyData[] = [];
		const now = new Date();

		for (let i = 0; i < 12; i++) {
			const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
			months.push({
				name: date.toLocaleString("default", {
					month: "short",
					year: "2-digit",
				}),
				income: TransactionAmount.zero(),
				expense: TransactionAmount.zero(),
				balance: TransactionAmount.zero(),
				accumulated: TransactionAmount.zero(),
				incomeScheduledTransactions: [],
				expenseScheduledTransactions: [],
				incomeTransactions: [],
				expenseTransactions: [],
			});
		}

		const calculateMonthIndex = (date: Date) =>
			(date.getFullYear() - new Date().getFullYear()) * 12 +
			date.getMonth() -
			new Date().getMonth();

		const processTransactions = () => {
			for (const transaction of transactions) {
				const transactionDate = new Date(transaction.date);

				const monthIndex = calculateMonthIndex(transactionDate);
				if (monthIndex >= 0 && monthIndex < 12) {
					if (transaction.operation.isIncome()) {
						const amount = transaction.originAmount;
						months[monthIndex].income =
							months[monthIndex].income.plus(amount);
						months[monthIndex].incomeTransactions.push(transaction);
					} else if (transaction.operation.isExpense()) {
						const amount = transaction.originAmount;
						months[monthIndex].expense =
							months[monthIndex].expense.plus(amount);
						months[monthIndex].expenseTransactions.push(
							transaction,
						);
					}
				}
			}
		};

		processTransactions();

		const processScheduledTransactions = async (months: MonthlyData[]) => {
			logger.debug("Processing scheduled transactions for chart");
			const endDate = new DateValueObject(
				new Date(now.getFullYear(), now.getMonth() + 13, 0),
			);
			logger.debug("End date for scheduled transactions", { endDate });
			const recurrences =
				await getScheduledTransactionsUntilDate.execute(endDate);
			logger.debug("Recurrences fetched for scheduled transactions", {
				recurrencesCount: recurrences.length,
			});
			for (const recurrence of recurrences) {
				const monthIndex = calculateMonthIndex(recurrence.date.value);

				logger.debug("Processing recurrence for month", {
					recurrenceName: recurrence.name.value,
					recurrenceDate: recurrence.date,
					monthIndex,
				});

				if (monthIndex >= 0 && monthIndex < 12) {
					const amount = recurrence.originAmount;
					logger.debug("Recurrence info", {
						name: recurrence.name.value,
						amount: amount.toString(),
						operationType: recurrence.operation.type.value,
					});
					if (recurrence.operation.type.isIncome()) {
						months[monthIndex].income =
							months[monthIndex].income.plus(amount);
						months[monthIndex].incomeScheduledTransactions.push(
							recurrence,
						);
					} else if (recurrence.operation.type.isExpense()) {
						months[monthIndex].expense =
							months[monthIndex].expense.plus(amount);
						months[monthIndex].expenseScheduledTransactions.push(
							recurrence,
						);
					}
				}
			}
			return months;
		};

		processScheduledTransactions(months).then((months) => {
			const initialBalance = accounts.reduce((total, account) => {
				logger.debug("Adding account balance", {
					accountId: account.id.value,
					accountName: account.name.value,
					realBalance: account.realBalance.toString(),
					total,
				});
				return total.plus(account.realBalance);
			}, PriceValueObject.zero());

			logger.debug("Initial accumulated balance calculated", {
				initialBalance,
			});

			let accumulated = initialBalance;
			const finalMonths = months.map((month) => {
				const balance = month.income.subtract(month.expense);
				logger.debug("Calculating month data", {
					month: month.name,
					income: month.income.toString(),
					expense: month.expense.toString(),
					balance: balance.toString(),
					accumulatedPrev: accumulated.toString(),
					accumulatedNew: accumulated.plus(balance).toString(),
				});
				accumulated = accumulated.plus(balance);
				return {
					...month,
					balance,
					accumulated,
				};
			});

			logger.debug("Final chart data calculated", { finalMonths });

			setChartData(finalMonths);
		});
	}, [getAccountByID, transactions, accounts, scheduledItems]);

	return (
		<div style={{ marginBottom: "20px" }}>
			<ResponsiveContainer width="100%" height={300}>
				<LineChart
					data={chartData}
					margin={{
						top: 5,
						right: 30,
						left: 40,
						bottom: 5,
					}}
					onClick={handleChartClick}
				>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis dataKey="name" />
					<YAxis
						tickFormatter={(value) =>
							new TransactionAmount(value).toString()
						}
					/>
					<Tooltip
						formatter={(value: number) =>
							new TransactionAmount(value).toString()
						}
						contentStyle={{
							backgroundColor: "var(--background-secondary)",
							border: "1px solid var(--background-modifier-border)",
						}}
					/>
					<Legend onClick={handleLegendClick} />
					<Line
						type="monotone"
						dataKey="income"
						stroke="var(--color-green)"
						name="Income"
						hide={!lineVisibility.income}
					/>
					<Line
						type="monotone"
						dataKey="expense"
						stroke="var(--color-red)"
						name="Expense"
						hide={!lineVisibility.expense}
					/>
					<Line
						type="monotone"
						dataKey="balance"
						stroke="var(--color-blue)"
						name="Balance"
						hide={!lineVisibility.balance}
					/>
					<Line
						type="monotone"
						dataKey="accumulated"
						stroke="var(--color-purple)"
						name="Accumulated"
						hide={!lineVisibility.accumulated}
					/>
				</LineChart>
			</ResponsiveContainer>

			{/* Month Details Modal */}
			{selectedMonthData && (
				<div
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: "rgba(0, 0, 0, 0.5)",
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						zIndex: 1000,
					}}
				>
					<div
						style={{
							backgroundColor: "var(--background-primary)",
							border: "1px solid var(--background-modifier-border)",
							borderRadius: "8px",
							padding: "20px",
							maxWidth: "600px",
							maxHeight: "80vh",
							overflow: "auto",
							position: "relative",
						}}
					>
						<button
							onClick={() => setSelectedMonthData(null)}
							style={{
								position: "absolute",
								top: "10px",
								right: "10px",
								background: "none",
								border: "none",
								cursor: "pointer",
								color: "var(--text-muted)",
							}}
						>
							<X size={20} />
						</button>

						<h3
							style={{
								margin: "0 0 20px 0",
								color: "var(--text-normal)",
							}}
						>
							{selectedMonthData.name} Details
						</h3>

						<div style={{ marginBottom: "20px" }}>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									marginBottom: "10px",
								}}
							>
								<span style={{ fontWeight: "bold" }}>
									Income:
								</span>
								<span
									style={{
										color: "var(--color-green)",
										fontWeight: "bold",
									}}
								>
									{selectedMonthData.income.toString()}
								</span>
							</div>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									marginBottom: "10px",
								}}
							>
								<span style={{ fontWeight: "bold" }}>
									Expenses:
								</span>
								<span
									style={{
										color: "var(--color-red)",
										fontWeight: "bold",
									}}
								>
									{selectedMonthData.expense.toString()}
								</span>
							</div>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									marginBottom: "10px",
								}}
							>
								<span style={{ fontWeight: "bold" }}>
									Balance:
								</span>
								<span
									style={{
										color: "var(--color-blue)",
										fontWeight: "bold",
									}}
								>
									{selectedMonthData.balance.toString()}
								</span>
							</div>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
								}}
							>
								<span style={{ fontWeight: "bold" }}>
									Accumulated:
								</span>
								<span
									style={{
										color: "var(--color-purple)",
										fontWeight: "bold",
									}}
								>
									{selectedMonthData.accumulated.toString()}
								</span>
							</div>
						</div>

						{/* Income Items */}
						{selectedMonthData.incomeScheduledTransactions.length >
							0 && (
							<div style={{ marginBottom: "20px" }}>
								<h4
									style={{
										color: "var(--color-green)",
										margin: "0 0 10px 0",
									}}
								>
									Income Items (
									{
										selectedMonthData
											.incomeScheduledTransactions.length
									}
									)
								</h4>
								<div
									style={{
										maxHeight: "200px",
										overflow: "auto",
									}}
								>
									{selectedMonthData.incomeScheduledTransactions
										.toSorted(
											(a, b) =>
												b.originAmount.value -
												a.originAmount.value,
										)
										.map((item, index) => {
											const account = getAccountByID(
												item.originAccounts[0]
													?.accountId,
											);
											const toAccount = item
												.destinationAccounts[0]
												?.accountId
												? getAccountByID(
														item
															.destinationAccounts[0]
															?.accountId,
													)
												: undefined;
											const price = item.originAmount;

											return (
												<div
													key={`${item.date.value}-${index}`}
													style={{
														display: "flex",
														justifyContent:
															"space-between",
														padding: "8px",
														borderBottom:
															"1px solid var(--background-modifier-border)",
														fontSize: "0.9em",
													}}
												>
													<div>
														<div
															style={{
																fontWeight:
																	"bold",
															}}
														>
															{item.name.value}
														</div>
														<div
															style={{
																color: "var(--text-muted)",
																fontSize:
																	"0.8em",
															}}
														>
															{account?.name.toString()}
															{toAccount
																? ` → ${toAccount.name}`
																: ""}
														</div>
													</div>
													<div
														style={{
															color: "var(--color-green)",
															fontWeight: "bold",
														}}
													>
														{price.toString()}
													</div>
												</div>
											);
										})}
								</div>
							</div>
						)}

						{/* Expense Items */}
						{selectedMonthData.expenseScheduledTransactions.length >
							0 && (
							<div style={{ marginBottom: "20px" }}>
								<h4
									style={{
										color: "var(--color-red)",
										margin: "0 0 10px 0",
									}}
								>
									Expense Items (
									{
										selectedMonthData
											.expenseScheduledTransactions.length
									}
									)
								</h4>
								<div
									style={{
										maxHeight: "200px",
										overflow: "auto",
									}}
								>
									{selectedMonthData.expenseScheduledTransactions
										.toSorted(
											(a, b) =>
												b.originAmount.value -
												a.originAmount.value,
										)
										.map((item, index) => {
											const account = getAccountByID(
												item.originAccounts[0]
													?.accountId,
											);
											const toAccount = item
												.destinationAccounts[0]
												?.accountId
												? getAccountByID(
														item
															.destinationAccounts[0]
															?.accountId,
													)
												: undefined;
											const price = item.originAmount;

											return (
												<div
													key={`${item.date.value}-${index}`}
													style={{
														display: "flex",
														justifyContent:
															"space-between",
														padding: "8px",
														borderBottom:
															"1px solid var(--background-modifier-border)",
														fontSize: "0.9em",
													}}
												>
													<div>
														<div
															style={{
																fontWeight:
																	"bold",
															}}
														>
															{item.name.value}
														</div>
														<div
															style={{
																color: "var(--text-muted)",
																fontSize:
																	"0.8em",
															}}
														>
															{account?.name.toString()}
															{toAccount
																? ` → ${toAccount.name}`
																: ""}
														</div>
													</div>
													<div
														style={{
															color: "var(--color-red)",
															fontWeight: "bold",
														}}
													>
														{price.toString()}
													</div>
												</div>
											);
										})}
								</div>
							</div>
						)}

						{/* Income Transactions */}
						{selectedMonthData.incomeTransactions.length > 0 && (
							<div style={{ marginBottom: "20px" }}>
								<h4
									style={{
										color: "var(--color-green)",
										margin: "0 0 10px 0",
									}}
								>
									Income Transactions (
									{
										selectedMonthData.incomeTransactions
											.length
									}
									)
								</h4>
								<div
									style={{
										maxHeight: "200px",
										overflow: "auto",
									}}
								>
									{selectedMonthData.incomeTransactions.map(
										(transaction, index) => {
											const fromAccounts =
												transaction.originAccounts
													.map(
														(s: PaymentSplit) =>
															getAccountByID(
																s.accountId,
															)?.name.value || "",
													)
													.join(", ");
											const toAccounts =
												transaction.destinationAccounts
													.map(
														(s: PaymentSplit) =>
															getAccountByID(
																s.accountId,
															)?.name.value || "",
													)
													.join(", ");
											const amount =
												transaction.destinationAmount.subtract(
													transaction.originAmount,
												);

											return (
												<div
													key={`${transaction.id.value}-${index}`}
													style={{
														display: "flex",
														justifyContent:
															"space-between",
														padding: "8px",
														borderBottom:
															"1px solid var(--background-modifier-border)",
														fontSize: "0.9em",
													}}
												>
													<div>
														<div
															style={{
																fontWeight:
																	"bold",
															}}
														>
															{
																transaction.name
																	.value
															}
														</div>
														<div
															style={{
																color: "var(--text-muted)",
																fontSize:
																	"0.8em",
															}}
														>
															{`${fromAccounts}${
																toAccounts
																	? " → " +
																		toAccounts
																	: ""
															}`}
														</div>
													</div>
													<div
														style={{
															color: "var(--color-green)",
															fontWeight: "bold",
														}}
													>
														{amount.toString()}
													</div>
												</div>
											);
										},
									)}
								</div>
							</div>
						)}

						{/* Expense Transactions */}
						{selectedMonthData.expenseTransactions.length > 0 && (
							<div>
								<h4
									style={{
										color: "var(--color-red)",
										margin: "0 0 10px 0",
									}}
								>
									Expense Transactions (
									{
										selectedMonthData.expenseTransactions
											.length
									}
									)
								</h4>
								<div
									style={{
										maxHeight: "200px",
										overflow: "auto",
									}}
								>
									{selectedMonthData.expenseTransactions.map(
										(transaction, index) => {
											const fromAccounts =
												transaction.originAccounts
													.map(
														(s: PaymentSplit) =>
															getAccountByID(
																s.accountId,
															)?.name.value || "",
													)
													.join(", ");
											const toAccounts =
												transaction.destinationAccounts
													.map(
														(s: PaymentSplit) =>
															getAccountByID(
																s.accountId,
															)?.name.value || "",
													)
													.join(", ");
											const amount =
												transaction.destinationAccounts.reduce(
													(
														sum: number,
														s: PaymentSplit,
													) => sum + s.amount.value,
													0,
												) -
												transaction.originAccounts.reduce(
													(
														sum: number,
														s: PaymentSplit,
													) => sum + s.amount.value,
													0,
												);

											return (
												<div
													key={`${transaction.id.value}-${index}`}
													style={{
														display: "flex",
														justifyContent:
															"space-between",
														padding: "8px",
														borderBottom:
															"1px solid var(--background-modifier-border)",
														fontSize: "0.9em",
													}}
												>
													<div>
														<div
															style={{
																fontWeight:
																	"bold",
															}}
														>
															{
																transaction.name
																	.value
															}
														</div>
														<div
															style={{
																color: "var(--text-muted)",
																fontSize:
																	"0.8em",
															}}
														>
															{`${fromAccounts}${
																toAccounts
																	? " → " +
																		toAccounts
																	: ""
															}`}
														</div>
													</div>
													<div
														style={{
															color: "var(--color-red)",
															fontWeight: "bold",
														}}
													>
														{amount.toString()}
													</div>
												</div>
											);
										},
									)}
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};
