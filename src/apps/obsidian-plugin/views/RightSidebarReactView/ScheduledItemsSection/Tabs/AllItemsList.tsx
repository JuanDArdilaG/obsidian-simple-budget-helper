import { PriceValueObject } from "@juandardilag/value-objects";
import { PriceLabel } from "apps/obsidian-plugin/components/PriceLabel";
import { useLogger } from "apps/obsidian-plugin/hooks";
import { EditItemPanel } from "apps/obsidian-plugin/panels/CreateBudgetItemPanel/EditItemPanel";
import { ERecurrenceState, Item } from "contexts/Items/domain";
import { ReportBalance } from "contexts/Reports/domain";
import { ItemsReport } from "contexts/Reports/domain/items-report.entity";
import { ChevronDown, ChevronRight, Forward, X } from "lucide-react";
import { useContext, useEffect, useMemo, useState } from "react";
import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Payload } from "recharts/types/component/DefaultLegendContent";
import { Transaction } from "../../../../../../contexts/Transactions/domain";
import { AccountsContext } from "../../Contexts";
import { ItemReportContext } from "../../Contexts/ItemReportContext";
import { TransactionsContext } from "../../Contexts/TransactionsContext";

export const AllItemsList = ({
	items,
	selectedItem,
	setSelectedItem,
	action,
	setAction,
	updateItems,
}: {
	items: Item[];
	selectedItem?: Item;
	setSelectedItem: React.Dispatch<React.SetStateAction<Item | undefined>>;
	action?: "edit" | "record";
	setAction: React.Dispatch<
		React.SetStateAction<"edit" | "record" | undefined>
	>;
	updateItems: () => void;
}) => {
	const logger = useLogger("AllItemsList");
	const { getAccountByID, accounts } = useContext(AccountsContext);
	const { transactions } = useContext(TransactionsContext);
	const {
		useCases: { getTotalPerMonth },
	} = useContext(ItemReportContext);

	// Get items that have pending recurrences (what's actually displayed)
	const displayedItems = useMemo(() => {
		return items.filter((item) =>
			item.recurrence.recurrences.some(
				(recurrence) => recurrence.state === ERecurrenceState.PENDING
			)
		);
	}, [items]);

	const displayedItemsReport = useMemo(
		() => new ItemsReport(displayedItems),
		[displayedItems]
	);

	const chartItems = useMemo(() => {
		return items.filter((item) =>
			item.recurrence.recurrences.some(
				(recurrence) => recurrence.state !== ERecurrenceState.DELETED
			)
		);
	}, [items]);

	const chartItemsReport = useMemo(
		() => new ItemsReport(chartItems),
		[chartItems]
	);

	const [showPanel, setShowPanel] = useState<{
		item: Item;
		action?: "edit" | "record";
	}>();

	const [expandedSections, setExpandedSections] = useState<{
		incomes: boolean;
		infiniteExpenses: boolean;
		finiteExpenses: boolean;
		totalExpenses: boolean;
		totalPerMonth: boolean;
	}>({
		incomes: false,
		infiniteExpenses: false,
		finiteExpenses: false,
		totalExpenses: false,
		totalPerMonth: false,
	});

	useEffect(() => {
		logger.debug("item selected for action", {
			selectedItem,
			action,
		});
		if (selectedItem) {
			setShowPanel({ item: selectedItem, action });
		}
	}, [action, selectedItem]);

	useEffect(() => {
		if (!showPanel) {
			if (action) setAction(undefined);
		}
	}, [setAction, showPanel]);

	const [perMonthExpenses, setPerMonthExpenses] = useState(
		ReportBalance.zero()
	);
	useEffect(() => {
		getTotalPerMonth
			.execute({ report: displayedItemsReport, type: "expenses" })
			.then((total) => setPerMonthExpenses(total));
	}, [displayedItemsReport]);

	const [perMonthInfiniteExpenses, setPerMonthInfiniteExpenses] = useState(
		ReportBalance.zero()
	);
	useEffect(() => {
		getTotalPerMonth
			.execute({
				report: displayedItemsReport.onlyInfiniteRecurrent(),
				type: "expenses",
			})
			.then((total) => setPerMonthInfiniteExpenses(total));
	}, [displayedItemsReport]);

	const [perMonthFiniteExpenses, setPerMonthFiniteExpenses] = useState(
		ReportBalance.zero()
	);
	useEffect(() => {
		getTotalPerMonth
			.execute({
				report: displayedItemsReport.onlyFiniteRecurrent(),
				type: "expenses",
			})
			.then((total) => setPerMonthFiniteExpenses(total));
	}, [displayedItemsReport]);

	const [perMonthIncomes, setPerMonthIncomes] = useState(
		ReportBalance.zero()
	);
	useEffect(() => {
		getTotalPerMonth
			.execute({
				report: displayedItemsReport,
				type: "incomes",
			})
			.then((total) => setPerMonthIncomes(total));
	}, [displayedItemsReport]);

	const [perMonth, setPerMonth] = useState(ReportBalance.zero());
	useEffect(() => {
		getTotalPerMonth
			.execute({
				report: displayedItemsReport,
				type: "all",
			})
			.then((total) => setPerMonth(total));
	}, [displayedItemsReport]);

	interface MonthlyData {
		name: string;
		income: number;
		expense: number;
		balance: number;
		accumulated: number;
		incomeItems: Item[];
		expenseItems: Item[];
		incomeTransactions: Transaction[];
		expenseTransactions: Transaction[];
	}
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

	// Helper functions to get filtered items
	const getInfiniteExpenseItems = () => {
		const expenseItems = chartItemsReport.getExpenseItems();
		const transferItems = chartItemsReport.getTransferItems();
		const infiniteItems = chartItemsReport.getInfiniteRecurrentItems();

		// Filter expense items that are infinite recurrent
		const infiniteExpenseItems = expenseItems.filter((item: Item) =>
			infiniteItems.some((infiniteItem: Item) =>
				infiniteItem.id.equalTo(item.id)
			)
		);

		// Filter transfer items that are infinite recurrent and Asset to Liability
		const infiniteAssetToLiabilityTransfers = transferItems.filter(
			(item: Item) => {
				const isInfinite = infiniteItems.some((infiniteItem: Item) =>
					infiniteItem.id.equalTo(item.id)
				);
				if (!isInfinite) return false;

				const account = getAccountByID(item.operation.account);
				const toAccount = getAccountByID(item.operation.toAccount!);
				return account?.type.isAsset() && toAccount?.type.isLiability();
			}
		);

		return [
			...infiniteExpenseItems,
			...infiniteAssetToLiabilityTransfers,
		].sort((a, b) => a.pricePerMonth.compareTo(b.pricePerMonth));
	};

	const getFiniteExpenseItems = () => {
		const expenseItems = chartItemsReport.getExpenseItems();
		const transferItems = chartItemsReport.getTransferItems();
		const finiteItems = chartItemsReport.getFiniteRecurrentItems();

		// Filter expense items that are finite recurrent
		const finiteExpenseItems = expenseItems.filter((item: Item) =>
			finiteItems.some((finiteItem: Item) =>
				finiteItem.id.equalTo(item.id)
			)
		);

		// Filter transfer items that are finite recurrent and Asset to Liability
		const finiteAssetToLiabilityTransfers = transferItems.filter(
			(item: Item) => {
				const isFinite = finiteItems.some((finiteItem: Item) =>
					finiteItem.id.equalTo(item.id)
				);
				if (!isFinite) return false;

				const account = getAccountByID(item.operation.account);
				const toAccount = getAccountByID(item.operation.toAccount!);
				return account?.type.isAsset() && toAccount?.type.isLiability();
			}
		);

		return [...finiteExpenseItems, ...finiteAssetToLiabilityTransfers].sort(
			(a, b) => a.pricePerMonth.compareTo(b.pricePerMonth)
		);
	};

	const getIncomeItems = () => {
		const incomeItems = chartItemsReport.getIncomeItems();
		const transferItems = chartItemsReport.getTransferItems();

		// Filter transfer items that are Liability to Asset
		const liabilityToAssetTransfers = transferItems.filter((item: Item) => {
			const account = getAccountByID(item.operation.account);
			const toAccount = getAccountByID(item.operation.toAccount!);
			return account?.type.isLiability() && toAccount?.type.isAsset();
		});

		return [...incomeItems, ...liabilityToAssetTransfers].sort((a, b) =>
			a.pricePerMonth.compareTo(b.pricePerMonth)
		);
	};

	const getTotalExpenseItems = () => {
		const expenseItems = chartItemsReport.getExpenseItems();
		const transferItems = chartItemsReport.getTransferItems();

		// Filter transfer items that are Asset to Liability
		const assetToLiabilityTransfers = transferItems.filter((item: Item) => {
			const account = getAccountByID(item.operation.account);
			const toAccount = getAccountByID(item.operation.toAccount!);
			return account?.type.isAsset() && toAccount?.type.isLiability();
		});

		return [...expenseItems, ...assetToLiabilityTransfers].sort((a, b) =>
			a.pricePerMonth.compareTo(b.pricePerMonth)
		);
	};

	useEffect(() => {
		const incomeItems = getIncomeItems();
		const expenseItems = getTotalExpenseItems();

		// Calculate initial accumulated balance from account balances
		const initialBalance = accounts.reduce((total, account) => {
			const balance = account.realBalance;
			return total.plus(balance);
		}, PriceValueObject.zero());

		const months: MonthlyData[] = [];
		const now = new Date();

		for (let i = 0; i < 12; i++) {
			const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
			months.push({
				name: date.toLocaleString("default", {
					month: "short",
					year: "2-digit",
				}),
				income: 0,
				expense: 0,
				balance: 0,
				accumulated: initialBalance.value,
				incomeItems: [],
				expenseItems: [],
				incomeTransactions: [],
				expenseTransactions: [],
			});
		}

		const processItems = (items: Item[], type: "income" | "expense") => {
			for (const item of items) {
				for (const recurrence of item.recurrence.recurrences) {
					if (recurrence.state !== ERecurrenceState.DELETED) {
						const recurrenceDate = new Date(
							recurrence.date.getTime()
						);
						const monthIndex =
							(recurrenceDate.getFullYear() - now.getFullYear()) *
								12 +
							recurrenceDate.getMonth() -
							now.getMonth();

						if (monthIndex >= 0 && monthIndex < 12) {
							let price: number;
							if (item.operation.type.isTransfer()) {
								price = item.price.value;
							} else {
								// For expenses, realPrice is negative, but we want to show it as positive in the chart
								price =
									type === "expense"
										? Math.abs(item.realPrice.value)
										: item.realPrice.value;
							}

							if (type === "income") {
								months[monthIndex].income += price;
								months[monthIndex].incomeItems.push(item);
							} else {
								months[monthIndex].expense += price;
								months[monthIndex].expenseItems.push(item);
							}
						}
					}
				}
			}
		};

		const processTransactions = () => {
			for (const transaction of transactions) {
				const transactionDate = new Date(transaction.date);
				if (transaction.itemID) continue;

				const monthIndex =
					(transactionDate.getFullYear() - now.getFullYear()) * 12 +
					transactionDate.getMonth() -
					now.getMonth();

				if (monthIndex >= 0 && monthIndex < 12) {
					const realAmount = transaction.realAmount.toNumber();

					if (realAmount > 0) {
						months[monthIndex].income += realAmount;
						months[monthIndex].incomeTransactions.push(transaction);
					} else if (realAmount < 0) {
						months[monthIndex].expense += Math.abs(realAmount);
						months[monthIndex].expenseTransactions.push(
							transaction
						);
					}
				}
			}
		};

		processItems(incomeItems, "income");
		processItems(expenseItems, "expense");
		processTransactions();

		let accumulatedBalance = initialBalance;
		const finalMonths = months.map((month) => {
			const balance = month.income - month.expense;
			accumulatedBalance = accumulatedBalance.plus(
				new PriceValueObject(balance)
			);
			return {
				...month,
				balance,
				accumulated: accumulatedBalance.value,
			};
		});

		setChartData(finalMonths);
	}, [chartItemsReport, getAccountByID, transactions, accounts]);

	const handleLegendClick = (data: Payload) => {
		const { dataKey } = data;
		if (dataKey) {
			setLineVisibility((prev) => ({
				...prev,
				[dataKey as string]: !prev[dataKey as string],
			}));
		}
	};

	const handleChartClick = (data: {
		activePayload?: Array<{ payload: MonthlyData }>;
	}) => {
		if (data && data.activePayload && data.activePayload[0]) {
			const monthData = data.activePayload[0].payload as MonthlyData;
			setSelectedMonthData(monthData);
		}
	};

	const currencyFormatter = (value: number) =>
		new PriceValueObject(value).toString();

	const toggleSection = (section: keyof typeof expandedSections) => {
		setExpandedSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	};

	return (
		<div>
			<ul>
				{items
					.map((item) => {
						const recurrence = item.recurrence.recurrences.find(
							(recurrence) =>
								recurrence.state === ERecurrenceState.PENDING
						);
						return { item, recurrence };
					})
					.filter(({ recurrence }) => recurrence)
					.toSorted(
						(
							{ recurrence: a, item: itemA },
							{ recurrence: b, item: itemB }
						) => {
							const result = a!.date.compareTo(b!.date);
							if (result !== 0) return result;
							// Secondary sort criteria
							return itemA.name.compareTo(itemB.name);
						}
					)
					.map(({ item, recurrence }) => {
						const account = getAccountByID(item.operation.account);
						const toAccount = item.operation.toAccount
							? getAccountByID(item.operation.toAccount)
							: undefined;
						const remainingDays =
							recurrence!.date.getRemainingDays() ?? 0;
						const totalRecurrences =
							item.recurrence?.totalRecurrences ?? 1;

						let panelContent;
						if (showPanel && item === showPanel.item) {
							if (showPanel.action === "edit") {
								panelContent = (
									<EditItemPanel
										item={item}
										onClose={() => {
											setShowPanel(undefined);
											updateItems();
										}}
									/>
								);
							}
						}

						let remainingDaysColor = "var(--color-green)";
						if (Math.abs(remainingDays) <= 3)
							remainingDaysColor = "var(--color-yellow)";
						else if (remainingDays < -3)
							remainingDaysColor = "var(--color-red)";

						return (
							<li
								key={item.id.value}
								onContextMenu={(e) => {
									e.preventDefault();
									setSelectedItem(item);
								}}
								style={{
									border: "none",
									width: "100%",
									textAlign: "left",
									padding: 0,
									cursor: "pointer",
								}}
							>
								<div className="two-columns-list">
									<span>
										{item.name.value}
										{item.recurrence?.frequency && (
											<span
												className="light-text"
												style={{
													paddingLeft: "6px",
												}}
											>
												{item.recurrence?.frequency.toString()}
											</span>
										)}
										<span
											className="light-text"
											style={{ paddingLeft: "6px" }}
										>
											{totalRecurrences > 0
												? `x${totalRecurrences}`
												: "∞"}
										</span>
										<br />
										<span
											style={{
												fontSize: "0.9em",
												marginLeft: "15px",
											}}
										>
											{recurrence!.date.toPrettyFormatDate()}
											<br />
											<span
												style={{
													marginLeft: "15px",
													color: remainingDaysColor,
												}}
											>
												{
													recurrence!.date
														.remainingDaysStr
												}
											</span>
										</span>
									</span>
									<span style={{ textAlign: "right" }}>
										<PriceLabel
											price={
												item.operation.type.isTransfer()
													? item.price
													: item.realPrice
											}
											operation={item.operation.type}
										/>
										<span
											style={{
												marginLeft: "8px",
												paddingTop: "20px",
											}}
										>
											<Forward
												style={{
													cursor: "pointer",
													color: "var(--color-green)",
												}}
												size={19}
												onClick={() => {
													setAction("record");
													setSelectedItem(item);
												}}
											/>
										</span>
										<br />
										<div
											style={{ textAlign: "right" }}
											className="light-text"
										>
											<div>
												Per Month ≈{" "}
												{item.pricePerMonth.toString()}
											</div>
											<div>
												{account?.name.toString()}
												{toAccount
													? ` -> ${toAccount.name}`
													: undefined}
											</div>
										</div>
									</span>
								</div>
								{panelContent}
							</li>
						);
					})}{" "}
			</ul>

			{/* Enhanced Totals Section */}
			<div
				style={{
					marginTop: "20px",
					borderTop: "1px solid var(--background-modifier-border)",
					paddingTop: "15px",
				}}
			>
				<h4
					style={{
						margin: "0 0 15px 0",
						color: "var(--text-normal)",
					}}
				>
					Monthly Financial Summary
				</h4>

				{/* Chart Section */}
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
							<YAxis tickFormatter={currencyFormatter} />
							<Tooltip
								formatter={currencyFormatter}
								contentStyle={{
									backgroundColor:
										"var(--background-secondary)",
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
				</div>

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
						onClick={() => setSelectedMonthData(null)}
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
							onClick={(e) => e.stopPropagation()}
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
										{currencyFormatter(
											selectedMonthData.income
										)}
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
										{currencyFormatter(
											selectedMonthData.expense
										)}
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
										{currencyFormatter(
											selectedMonthData.balance
										)}
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
										{currencyFormatter(
											selectedMonthData.accumulated
										)}
									</span>
								</div>
							</div>

							{/* Income Items */}
							{selectedMonthData.incomeItems.length > 0 && (
								<div style={{ marginBottom: "20px" }}>
									<h4
										style={{
											color: "var(--color-green)",
											margin: "0 0 10px 0",
										}}
									>
										Income Items (
										{selectedMonthData.incomeItems.length})
									</h4>
									<div
										style={{
											maxHeight: "200px",
											overflow: "auto",
										}}
									>
										{selectedMonthData.incomeItems.map(
											(item, index) => {
												const account = getAccountByID(
													item.operation.account
												);
												const toAccount = item.operation
													.toAccount
													? getAccountByID(
															item.operation
																.toAccount
													  )
													: undefined;
												const price =
													item.operation.type.isTransfer()
														? item.price
														: item.realPrice;

												return (
													<div
														key={`${item.id.value}-${index}`}
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
																	item.name
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
																{account?.name.toString()}
																{toAccount
																	? ` → ${toAccount.name}`
																	: ""}
															</div>
														</div>
														<div
															style={{
																color: "var(--color-green)",
																fontWeight:
																	"bold",
															}}
														>
															{price.toString()}
														</div>
													</div>
												);
											}
										)}
									</div>
								</div>
							)}

							{/* Expense Items */}
							{selectedMonthData.expenseItems.length > 0 && (
								<div style={{ marginBottom: "20px" }}>
									<h4
										style={{
											color: "var(--color-red)",
											margin: "0 0 10px 0",
										}}
									>
										Expense Items (
										{selectedMonthData.expenseItems.length})
									</h4>
									<div
										style={{
											maxHeight: "200px",
											overflow: "auto",
										}}
									>
										{selectedMonthData.expenseItems.map(
											(item, index) => {
												const account = getAccountByID(
													item.operation.account
												);
												const toAccount = item.operation
													.toAccount
													? getAccountByID(
															item.operation
																.toAccount
													  )
													: undefined;
												const price =
													item.operation.type.isTransfer()
														? item.price
														: item.realPrice;

												return (
													<div
														key={`${item.id.value}-${index}`}
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
																	item.name
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
																{account?.name.toString()}
																{toAccount
																	? ` → ${toAccount.name}`
																	: ""}
															</div>
														</div>
														<div
															style={{
																color: "var(--color-red)",
																fontWeight:
																	"bold",
															}}
														>
															{price.toString()}
														</div>
													</div>
												);
											}
										)}
									</div>
								</div>
							)}

							{/* Income Transactions */}
							{selectedMonthData.incomeTransactions.length >
								0 && (
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
												const account = getAccountByID(
													transaction.account
												);
												const toAccount =
													transaction.toAccount
														? getAccountByID(
																transaction.toAccount
														  )
														: undefined;

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
																	transaction
																		.name
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
																{account?.name.toString()}
																{toAccount
																	? ` → ${toAccount.name}`
																	: ""}
															</div>
														</div>
														<div
															style={{
																color: "var(--color-green)",
																fontWeight:
																	"bold",
															}}
														>
															{transaction.amount.toString()}
														</div>
													</div>
												);
											}
										)}
									</div>
								</div>
							)}

							{/* Expense Transactions */}
							{selectedMonthData.expenseTransactions.length >
								0 && (
								<div>
									<h4
										style={{
											color: "var(--color-red)",
											margin: "0 0 10px 0",
										}}
									>
										Expense Transactions (
										{
											selectedMonthData
												.expenseTransactions.length
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
												const account = getAccountByID(
													transaction.account
												);
												const toAccount =
													transaction.toAccount
														? getAccountByID(
																transaction.toAccount
														  )
														: undefined;

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
																	transaction
																		.name
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
																{account?.name.toString()}
																{toAccount
																	? ` → ${toAccount.name}`
																	: ""}
															</div>
														</div>
														<div
															style={{
																color: "var(--color-red)",
																fontWeight:
																	"bold",
															}}
														>
															{transaction.amount.toString()}
														</div>
													</div>
												);
											}
										)}
									</div>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Total Per Month */}
				<div
					style={{
						background: "var(--background-secondary)",
						borderRadius: "8px",
						padding: "12px",
						marginBottom: "10px",
						border: "2px solid var(--color-blue)",
					}}
				>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<span style={{ fontWeight: "bold", fontSize: "1.1em" }}>
							Total Per Month
						</span>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: "8px",
							}}
						>
							<span
								style={{
									fontSize: "1.3em",
									fontWeight: "bold",
									color: "var(--color-blue)",
								}}
							>
								{perMonth.toString()}
							</span>
						</div>
					</div>
				</div>

				{/* Incomes Section */}
				<div
					style={{
						background: "var(--background-secondary)",
						borderRadius: "8px",
						padding: "12px",
						marginBottom: "10px",
						border: "2px solid var(--color-green)",
					}}
				>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							cursor: "pointer",
						}}
						onClick={() => toggleSection("incomes")}
					>
						<span style={{ fontWeight: "bold", fontSize: "1.1em" }}>
							Total Incomes Per Month
						</span>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: "8px",
							}}
						>
							<span
								style={{
									fontSize: "1.3em",
									fontWeight: "bold",
									color: "var(--color-green)",
								}}
							>
								{perMonthIncomes.toString()}
							</span>
							{expandedSections.incomes ? (
								<ChevronDown size={16} />
							) : (
								<ChevronRight size={16} />
							)}
						</div>
					</div>
					{expandedSections.incomes && (
						<div
							style={{
								marginTop: "10px",
								paddingTop: "10px",
								borderTop:
									"1px solid var(--background-modifier-border)",
							}}
						>
							{getIncomeItems().map((item) => (
								<div
									key={item.id.value}
									style={{
										display: "flex",
										justifyContent: "space-between",
										padding: "4px 0",
										fontSize: "0.9em",
									}}
								>
									<span>{item.name.value}</span>
									<span
										style={{ color: "var(--color-green)" }}
									>
										{item.pricePerMonth.toString()}
									</span>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Total Expenses Section */}
				<div
					style={{
						background: "var(--background-secondary)",
						borderRadius: "8px",
						padding: "12px",
						marginBottom: "10px",
						border: "2px solid var(--color-red)",
					}}
				>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							cursor: "pointer",
						}}
						onClick={() => toggleSection("totalExpenses")}
					>
						<span style={{ fontWeight: "bold", fontSize: "1.1em" }}>
							Total Expenses Per Month
						</span>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: "8px",
							}}
						>
							<span
								style={{
									fontSize: "1.3em",
									fontWeight: "bold",
									color: "var(--color-red)",
								}}
							>
								{perMonthExpenses.toString()}
							</span>
							{expandedSections.totalExpenses ? (
								<ChevronDown size={16} />
							) : (
								<ChevronRight size={16} />
							)}
						</div>
					</div>
					{expandedSections.totalExpenses && (
						<div
							style={{
								marginTop: "10px",
								paddingTop: "10px",
								borderTop:
									"1px solid var(--background-modifier-border)",
							}}
						>
							{getTotalExpenseItems().map((item) => (
								<div
									key={item.id.value}
									style={{
										display: "flex",
										justifyContent: "space-between",
										padding: "4px 0",
										fontSize: "0.9em",
									}}
								>
									<span>{item.name.value}</span>
									<span
										style={{
											color: "var(--color-red)",
										}}
									>
										{item.pricePerMonth.toString()}
									</span>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Infinite Expenses Section */}
				<div
					style={{
						background: "var(--background-secondary)",
						borderRadius: "8px",
						padding: "12px",
						marginBottom: "10px",
						border: "2px solid var(--color-orange)",
					}}
				>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							cursor: "pointer",
						}}
						onClick={() => toggleSection("infiniteExpenses")}
					>
						<span style={{ fontWeight: "bold", fontSize: "1.1em" }}>
							Infinite Recurrent Expenses
						</span>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: "8px",
							}}
						>
							<span
								style={{
									fontSize: "1.3em",
									fontWeight: "bold",
									color: "var(--color-orange)",
								}}
							>
								{perMonthInfiniteExpenses.toString()}
							</span>
							{expandedSections.infiniteExpenses ? (
								<ChevronDown size={16} />
							) : (
								<ChevronRight size={16} />
							)}
						</div>
					</div>
					{expandedSections.infiniteExpenses && (
						<div
							style={{
								marginTop: "10px",
								paddingTop: "10px",
								borderTop:
									"1px solid var(--background-modifier-border)",
							}}
						>
							{getInfiniteExpenseItems().map((item) => (
								<div
									key={item.id.value}
									style={{
										display: "flex",
										justifyContent: "space-between",
										padding: "4px 0",
										fontSize: "0.9em",
									}}
								>
									<span>{item.name.value}</span>
									<span
										style={{ color: "var(--color-orange)" }}
									>
										{item.pricePerMonth.toString()}
									</span>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Finite Expenses Section */}
				<div
					style={{
						background: "var(--background-secondary)",
						borderRadius: "8px",
						padding: "12px",
						marginBottom: "10px",
						border: "2px solid var(--color-red)",
					}}
				>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							cursor: "pointer",
						}}
						onClick={() => toggleSection("finiteExpenses")}
					>
						<span style={{ fontWeight: "bold", fontSize: "1.1em" }}>
							Finite Recurrent Expenses
						</span>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: "8px",
							}}
						>
							<span
								style={{
									fontSize: "1.3em",
									fontWeight: "bold",
									color: "var(--color-red)",
								}}
							>
								{perMonthFiniteExpenses.toString()}
							</span>
							{expandedSections.finiteExpenses ? (
								<ChevronDown size={16} />
							) : (
								<ChevronRight size={16} />
							)}
						</div>
					</div>
					{expandedSections.finiteExpenses && (
						<div
							style={{
								marginTop: "10px",
								paddingTop: "10px",
								borderTop:
									"1px solid var(--background-modifier-border)",
							}}
						>
							{getFiniteExpenseItems().map((item) => (
								<div
									key={item.id.value}
									style={{
										display: "flex",
										justifyContent: "space-between",
										padding: "4px 0",
										fontSize: "0.9em",
									}}
								>
									<span>{item.name.value}</span>
									<span style={{ color: "var(--color-red)" }}>
										{item.pricePerMonth.toString()}
									</span>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
