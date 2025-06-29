import {
	NumberValueObject,
	PriceValueObject,
} from "@juandardilag/value-objects";
import { List, ListSubheader } from "@mui/material";
import { ResponsiveScheduledItem } from "apps/obsidian-plugin/components/ResponsiveScheduledItem";
import { useLogger } from "apps/obsidian-plugin/hooks";
import { EditItemPanel } from "apps/obsidian-plugin/panels/CreateBudgetItemPanel/EditItemPanel";
import { RecordItemPanel } from "apps/obsidian-plugin/panels/RecordItemPanel";
import { AccountID, AccountName, AccountType } from "contexts/Accounts/domain";
import {
	ERecurrenceState,
	ItemRecurrenceInfo,
	ScheduledItem,
} from "contexts/Items/domain";
import { ReportBalance } from "contexts/Reports/domain";
import { ItemsReport } from "contexts/Reports/domain/items-report.entity";
import { PaymentSplit } from "contexts/Transactions/domain/payment-split.valueobject";
import { ChevronDown, ChevronRight, X } from "lucide-react";
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
	items: ScheduledItem[];
	selectedItem?: ScheduledItem;
	setSelectedItem: React.Dispatch<
		React.SetStateAction<ScheduledItem | undefined>
	>;
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

	// const chartItems = useMemo(() => {
	// 	return items.filter((item) =>
	// 		item.recurrence.recurrences.some(
	// 			(recurrence) => recurrence.state !== ERecurrenceState.DELETED
	// 		)
	// 	);
	// }, [items]);

	// const chartItemsReport = useMemo(
	// 	() => new ItemsReport(chartItems),
	// 	[chartItems]
	// );

	const [showPanel, setShowPanel] = useState<{
		item: ScheduledItem;
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
		} else {
			// Clear the panel when selectedItem is undefined
			setShowPanel(undefined);
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
		incomeItems: ScheduledItem[];
		expenseItems: ScheduledItem[];
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

	// Define the accountTypeLookup function
	const accountTypeLookup = (id: AccountID): AccountType => {
		const account = getAccountByID(id);
		if (!account) return new AccountType("asset"); // fallback or throw if preferred
		return account.type;
	};

	// Helper functions to get filtered items
	const getInfiniteExpenseItems = () => {
		const expenseItems = displayedItemsReport.getExpenseItems();
		const transferItems = displayedItemsReport.getTransferItems();
		const infiniteItems = displayedItemsReport.getInfiniteRecurrentItems();

		// Filter expense items that are infinite recurrent
		const infiniteExpenseItems = expenseItems.filter(
			(item: ScheduledItem) =>
				infiniteItems.some((infiniteItem: ScheduledItem) =>
					infiniteItem.id.equalTo(item.id)
				)
		);

		// Filter transfer items that are infinite recurrent and Asset to Liability
		const infiniteAssetToLiabilityTransfers = transferItems.filter(
			(item: ScheduledItem) => {
				const isInfinite = infiniteItems.some(
					(infiniteItem: ScheduledItem) =>
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
		].sort((a, b) =>
			a
				.getPricePerMonthWithAccountTypes(accountTypeLookup)
				.compareTo(
					b.getPricePerMonthWithAccountTypes(accountTypeLookup)
				)
		);
	};

	const getFiniteExpenseItems = () => {
		const expenseItems = displayedItemsReport.getExpenseItems();
		const transferItems = displayedItemsReport.getTransferItems();
		const finiteItems = displayedItemsReport.getFiniteRecurrentItems();

		// Filter expense items that are finite recurrent
		const finiteExpenseItems = expenseItems.filter((item: ScheduledItem) =>
			finiteItems.some((finiteItem: ScheduledItem) =>
				finiteItem.id.equalTo(item.id)
			)
		);

		// Filter transfer items that are finite recurrent and Asset to Liability
		const finiteAssetToLiabilityTransfers = transferItems.filter(
			(item: ScheduledItem) => {
				const isFinite = finiteItems.some((finiteItem: ScheduledItem) =>
					finiteItem.id.equalTo(item.id)
				);
				if (!isFinite) return false;

				const account = getAccountByID(item.operation.account);
				const toAccount = getAccountByID(item.operation.toAccount!);
				return account?.type.isAsset() && toAccount?.type.isLiability();
			}
		);

		return [...finiteExpenseItems, ...finiteAssetToLiabilityTransfers].sort(
			(a, b) =>
				a
					.getPricePerMonthWithAccountTypes(accountTypeLookup)
					.compareTo(
						b.getPricePerMonthWithAccountTypes(accountTypeLookup)
					)
		);
	};

	const getIncomeItems = () => {
		const incomeItems = displayedItemsReport.getIncomeItems();
		const transferItems = displayedItemsReport.getTransferItems();

		// Filter transfer items that are Liability to Asset
		const liabilityToAssetTransfers = transferItems.filter(
			(item: ScheduledItem) => {
				const account = getAccountByID(item.operation.account);
				const toAccount = getAccountByID(item.operation.toAccount!);
				return account?.type.isLiability() && toAccount?.type.isAsset();
			}
		);

		return [...incomeItems, ...liabilityToAssetTransfers].sort((a, b) =>
			a
				.getPricePerMonthWithAccountTypes(accountTypeLookup)
				.compareTo(
					b.getPricePerMonthWithAccountTypes(accountTypeLookup)
				)
		);
	};

	const getTotalExpenseItems = () => {
		const expenseItems = displayedItemsReport.getExpenseItems();
		const transferItems = displayedItemsReport.getTransferItems();

		// Filter transfer items that are Asset to Liability
		const assetToLiabilityTransfers = transferItems.filter(
			(item: ScheduledItem) => {
				const account = getAccountByID(item.operation.account);
				const toAccount = getAccountByID(item.operation.toAccount!);
				return account?.type.isAsset() && toAccount?.type.isLiability();
			}
		);

		return [...expenseItems, ...assetToLiabilityTransfers].sort((a, b) =>
			a
				.getPricePerMonthWithAccountTypes(accountTypeLookup)
				.compareTo(
					b.getPricePerMonthWithAccountTypes(accountTypeLookup)
				)
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

		const processItems = (
			items: ScheduledItem[],
			type: "income" | "expense"
		) => {
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
							let price = 0;
							price = item.fromSplits.reduce(
								(sum, s) => sum + s.amount.value,
								0
							);

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
					if (transaction.operation.isIncome()) {
						const amount = transaction.fromAmount.value;
						months[monthIndex].income += amount;
						months[monthIndex].incomeTransactions.push(transaction);
					} else if (transaction.operation.isExpense()) {
						const amount = transaction.fromAmount.value;
						months[monthIndex].expense += amount;
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
	}, [displayedItemsReport, getAccountByID, transactions, accounts]);

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
			{/* Group items by month */}
			{(() => {
				// Group items by month
				const itemsByMonth = items
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
					.reduce((groups, { item, recurrence }) => {
						const monthKey =
							recurrence!.date.value.toLocaleDateString(
								"default",
								{
									year: "numeric",
									month: "long",
								}
							);

						if (!groups[monthKey]) {
							groups[monthKey] = [];
						}
						groups[monthKey].push({
							item,
							recurrence: recurrence!,
						});
						return groups;
					}, {} as Record<string, Array<{ item: ScheduledItem; recurrence: ItemRecurrenceInfo }>>);

				return Object.entries(itemsByMonth).map(
					([monthKey, monthItems]) => (
						<List key={monthKey} style={{ width: "100%" }}>
							<ListSubheader
								style={{
									backgroundColor:
										"var(--background-primary-alt)",
									color: "var(--text-normal)",
								}}
							>
								{monthKey}
							</ListSubheader>
							{monthItems.map(({ item, recurrence }) => {
								const account = getAccountByID(
									item.operation.account
								);
								const toAccount = item.operation.toAccount
									? getAccountByID(item.operation.toAccount)
									: undefined;
								const accountName =
									account?.name ??
									new AccountName("Unknown Account");
								const toAccountName = toAccount?.name;
								const fullAccountName = toAccountName
									? new AccountName(
											`${accountName.toString()} -> ${toAccountName.toString()}`
									  )
									: accountName;

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
									} else if (showPanel.action === "record") {
										// Find the first pending recurrence for this item
										const pendingRecurrenceIndex =
											item.recurrence.recurrences.findIndex(
												(r) =>
													r.state ===
													ERecurrenceState.PENDING
											);

										if (pendingRecurrenceIndex !== -1) {
											const pendingRecurrence =
												item.recurrence.recurrences[
													pendingRecurrenceIndex
												];
											panelContent = (
												<RecordItemPanel
													item={item}
													recurrence={{
														recurrence:
															pendingRecurrence,
														n: new NumberValueObject(
															pendingRecurrenceIndex
														),
													}}
													onClose={() => {
														setShowPanel(undefined);
														updateItems();
													}}
													updateItems={updateItems}
												/>
											);
										}
									}
								}

								return (
									<div key={item.id.value}>
										<ResponsiveScheduledItem
											item={item}
											recurrence={recurrence}
											accountName={fullAccountName}
											price={item.fromAmount}
											isSelected={false}
											showBalanceInfo={false}
											accountTypeLookup={
												accountTypeLookup
											}
											remainingDays={
												recurrence.date.getRemainingDays() ??
												0
											}
											setAction={setAction}
											setSelectedItem={setSelectedItem}
											context="all-items"
											currentAction={showPanel?.action}
										/>
										{panelContent}
									</div>
								);
							})}
						</List>
					)
				);
			})()}

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
														? item.fromAmount
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
														? item.fromAmount
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
												const fromAccounts =
													transaction.fromSplits
														.map(
															(s: PaymentSplit) =>
																getAccountByID(
																	s.accountId
																)?.name.value ||
																""
														)
														.join(", ");
												const toAccounts =
													transaction.toSplits
														.map(
															(s: PaymentSplit) =>
																getAccountByID(
																	s.accountId
																)?.name.value ||
																""
														)
														.join(", ");
												const amount =
													transaction.toSplits.reduce(
														(
															sum: number,
															s: PaymentSplit
														) =>
															sum +
															s.amount.value,
														0
													) -
													transaction.fromSplits.reduce(
														(
															sum: number,
															s: PaymentSplit
														) =>
															sum +
															s.amount.value,
														0
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
																fontWeight:
																	"bold",
															}}
														>
															{amount.toString()}
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
												const fromAccounts =
													transaction.fromSplits
														.map(
															(s: PaymentSplit) =>
																getAccountByID(
																	s.accountId
																)?.name.value ||
																""
														)
														.join(", ");
												const toAccounts =
													transaction.toSplits
														.map(
															(s: PaymentSplit) =>
																getAccountByID(
																	s.accountId
																)?.name.value ||
																""
														)
														.join(", ");
												const amount =
													transaction.toSplits.reduce(
														(
															sum: number,
															s: PaymentSplit
														) =>
															sum +
															s.amount.value,
														0
													) -
													transaction.fromSplits.reduce(
														(
															sum: number,
															s: PaymentSplit
														) =>
															sum +
															s.amount.value,
														0
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
																fontWeight:
																	"bold",
															}}
														>
															{amount.toString()}
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
										{item
											.getPricePerMonthWithAccountTypes(
												accountTypeLookup
											)
											.toString()}
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
										{item
											.getPricePerMonthWithAccountTypes(
												accountTypeLookup
											)
											.toString()}
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
										{item
											.getPricePerMonthWithAccountTypes(
												accountTypeLookup
											)
											.toString()}
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
										{item
											.getPricePerMonthWithAccountTypes(
												accountTypeLookup
											)
											.toString()}
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
