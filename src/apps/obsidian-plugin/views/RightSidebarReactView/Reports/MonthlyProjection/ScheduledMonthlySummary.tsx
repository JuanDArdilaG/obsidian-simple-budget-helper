import { PriceValueObject } from "@juandardilag/value-objects";
import { AnimatePresence, motion } from "framer-motion";
import {
	ArrowDownLeft,
	ArrowUpRight,
	CalendarDays,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	RefreshCw,
	Repeat,
} from "lucide-react";
import { useContext, useEffect, useMemo, useState } from "react";
import {
	ItemRecurrenceInfo,
	RecurrenceType,
	ScheduledTransaction,
} from "../../../../../../contexts/ScheduledTransactions/domain";
import { TransactionAmount } from "../../../../../../contexts/Transactions/domain";
import {
	CategoriesContext,
	ScheduledTransactionsContext,
} from "../../Contexts";

export interface MonthlySummaryDataSection {
	total: number;
	transactions: ScheduledTransaction[];
}

export interface MonthlySummaryData {
	savingsForNextMonth: MonthlySummaryDataSection;
	totalIncomePerMonth: MonthlySummaryDataSection;
	totalExpensesPerMonth: MonthlySummaryDataSection;
	longTermExpensesPerMonth: MonthlySummaryDataSection;
	shortTermExpensesPerMonth: MonthlySummaryDataSection;
	totalPerMonth: MonthlySummaryDataSection;
}

type PeriodMode = "month" | "year";
// Check if a transaction would have an occurrence in a given month
const isActiveInMonth = (
	recurrence: ItemRecurrenceInfo,
	scheduledTransaction: ScheduledTransaction,
	targetYear: number,
	targetMonth: number,
): boolean => {
	const { date } = recurrence;
	const { type, frequency, endDate } = scheduledTransaction.recurrencePattern;
	const start = new Date(date);
	// Transaction hasn't started yet
	const monthStart = new Date(targetYear, targetMonth, 1);
	const monthEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);
	if (start > monthEnd) return false;
	// Check end date
	if (type === RecurrenceType.UNTIL_DATE && endDate) {
		if (new Date(endDate) < monthStart) return false;
	}
	if (type === RecurrenceType.ONE_TIME) {
		return (
			start.getFullYear() === targetYear &&
			start.getMonth() === targetMonth
		);
	}
	if (!frequency) return false;
	const match = frequency.match(/(\d+)(d|w|mo|y)/);
	if (!match) return false;
	const [, num, unit] = match;
	const count = Number.parseInt(num);
	// For monthly+ frequencies, check if the period aligns
	switch (unit) {
		case "mo": {
			const monthsDiff =
				(targetYear - start.getFullYear()) * 12 +
				(targetMonth - start.getMonth());
			if (monthsDiff < 0) return false;
			return monthsDiff % count === 0;
		}
		case "y": {
			const yearsDiff = targetYear - start.getFullYear();
			if (yearsDiff < 0) return false;
			if (yearsDiff % count !== 0) return false;
			return start.getMonth() === targetMonth;
		}
		case "w":
		case "d":
			// Weekly and daily recurrences will always have at least one occurrence per month
			return true;
		default:
			return true;
	}
};

// Check if a transaction is active in any month of a given year
const isActiveInYear = (
	recurrence: ItemRecurrenceInfo,
	scheduledTransaction: ScheduledTransaction,
	targetYear: number,
): boolean => {
	for (let month = 0; month < 12; month++) {
		if (
			isActiveInMonth(recurrence, scheduledTransaction, targetYear, month)
		)
			return true;
	}
	return false;
};

const formatFrequency = (frequency?: string): string => {
	if (!frequency) return "One-time";
	const match = frequency.match(/(\d+)(d|w|mo|y)/);
	if (!match) return frequency;
	const [, num, unit] = match;
	const count = Number.parseInt(num);
	const unitMap: Record<string, string> = {
		d: count === 1 ? "day" : `${count} days`,
		w: count === 1 ? "week" : `${count} weeks`,
		mo: count === 1 ? "month" : `${count} months`,
		y: count === 1 ? "year" : `${count} years`,
	};
	return `Every ${unitMap[unit] || unit}`;
};

interface SummaryRowProps {
	label: string;
	data: MonthlySummaryDataSection;
	colorClass: string;
	borderClass: string;
	isExpandable?: boolean;
}

function SummaryRow({
	label,
	data,
	colorClass,
	borderClass,
	isExpandable = false,
}: Readonly<SummaryRowProps>) {
	const { categoriesMap } = useContext(CategoriesContext);
	const [isExpanded, setIsExpanded] = useState(false);
	const breakdownItems = useMemo(() => {
		return data.transactions
			.map((t) => ({
				id: t.id,
				name: t.name,
				monthlyAmount: t.pricePerMonth.value,
				frequency: t.recurrencePattern.frequency,
				operationType: t.operation.type.value,
				store: t.store,
				category: t.category
					? categoriesMap.get(t.category.value)?.name || ""
					: "",
			}))
			.toSorted(
				(a, b) => Math.abs(b.monthlyAmount) - Math.abs(a.monthlyAmount),
			);
	}, [data.transactions, categoriesMap]);

	const getOperationIcon = (type: string) => {
		switch (type) {
			case "income":
				return (
					<ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
				);
			case "expense":
				return <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />;
			case "transfer":
				return <RefreshCw className="w-3.5 h-3.5 text-blue-500" />;
			default:
				return null;
		}
	};
	const hasItems = breakdownItems.length > 0;

	return (
		<motion.div
			initial={{
				opacity: 0,
				y: 10,
			}}
			animate={{
				opacity: 1,
				y: 0,
			}}
			className={`border-2 ${borderClass} rounded-lg overflow-hidden`}
		>
			<button
				onClick={() =>
					isExpandable && hasItems && setIsExpanded(!isExpanded)
				}
				className={`w-full px-5 py-4 flex items-center justify-between transition-colors ${isExpandable && hasItems ? "hover:bg-gray-50 cursor-pointer" : "cursor-default"}`}
			>
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium text-gray-700">
						{label}
					</span>
					{isExpandable && hasItems && (
						<span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
							{breakdownItems.length}
						</span>
					)}
				</div>
				<div className="flex items-center gap-2">
					<span className={`text-xl font-bold ${colorClass}`}>
						{new TransactionAmount(data.total).toString()}
					</span>
					{isExpandable && hasItems && (
						<motion.div
							animate={{
								rotate: isExpanded ? 180 : 0,
							}}
							transition={{
								duration: 0.2,
							}}
						>
							<ChevronDown size={20} className="text-gray-400" />
						</motion.div>
					)}
				</div>
			</button>

			{isExpandable && hasItems && (
				<AnimatePresence>
					{isExpanded && (
						<motion.div
							initial={{
								height: 0,
								opacity: 0,
							}}
							animate={{
								height: "auto",
								opacity: 1,
							}}
							exit={{
								height: 0,
								opacity: 0,
							}}
							transition={{
								duration: 0.2,
							}}
							className="overflow-hidden"
						>
							<div className="border-t border-gray-200 bg-gray-50/80">
								<div className="divide-y divide-gray-100">
									{breakdownItems.map((item, index) => (
										<motion.div
											key={item.id}
											initial={{
												opacity: 0,
												x: -8,
											}}
											animate={{
												opacity: 1,
												x: 0,
											}}
											transition={{
												delay: index * 0.03,
											}}
											className="px-5 py-3 flex items-center justify-between gap-3"
										>
											<div className="flex items-center gap-3 min-w-0 flex-1">
												<div className="shrink-0 w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center">
													{getOperationIcon(
														item.operationType,
													)}
												</div>
												<div className="min-w-0 flex-1">
													<div className="text-sm font-medium text-gray-800 truncate">
														{item.name}
													</div>
													<div className="flex items-center gap-1.5 mt-0.5">
														<Repeat className="w-3 h-3 text-gray-400 shrink-0" />
														<span className="text-xs text-gray-500 truncate">
															{formatFrequency(
																item.frequency
																	?.value,
															)}
														</span>
														{item.category && (
															<>
																<span className="text-gray-300">
																	·
																</span>
																<span className="text-xs text-gray-500 truncate">
																	{
																		item.category
																	}
																</span>
															</>
														)}
													</div>
												</div>
											</div>
											<span
												className={`text-sm font-semibold shrink-0 tabular-nums ${item.operationType === "income" ? "text-emerald-600" : item.operationType === "expense" ? "text-rose-600" : "text-blue-600"}`}
											>
												{new TransactionAmount(
													item.monthlyAmount,
												).toString()}
												<span className="text-xs font-normal text-gray-400">
													/mo
												</span>
											</span>
										</motion.div>
									))}
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			)}
		</motion.div>
	);
}

const MONTH_NAMES = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];
const MONTH_NAMES_SHORT = [
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

export function ScheduledMonthlySummary() {
	const {
		useCases: {
			nextMonthExpensesUseCase,
			getScheduledTransactionsUntilDate,
		},
		scheduledItems,
	} = useContext(ScheduledTransactionsContext);
	const now = new Date();
	const [periodMode, setPeriodMode] = useState<PeriodMode>("month");
	const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
	const [selectedYear, setSelectedYear] = useState(now.getFullYear());

	const [recurrencesUntilDate, setRecurrencesUntilDate] = useState<
		ItemRecurrenceInfo[]
	>([]);

	useEffect(() => {
		const targetDate =
			periodMode === "month"
				? new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59)
				: new Date(selectedYear, 11, 31, 23, 59, 59);
		getScheduledTransactionsUntilDate.execute(targetDate).then((result) => {
			setRecurrencesUntilDate(result);
		});
	}, [
		getScheduledTransactionsUntilDate,
		periodMode,
		selectedMonth,
		selectedYear,
	]);

	// Fetch savings (expenses that need to be saved for) for the selected month
	const [monthExpenses, setMonthExpenses] = useState<
		{ info: ItemRecurrenceInfo; monthAmount: PriceValueObject }[]
	>([]);

	useEffect(() => {
		nextMonthExpensesUseCase
			.execute()
			.then((expenses) => setMonthExpenses(expenses));
	}, [nextMonthExpensesUseCase, selectedMonth, selectedYear]);

	// Generate future month options (next 24 months)
	const monthOptions = useMemo(() => {
		const options: {
			month: number;
			year: number;
			label: string;
		}[] = [];
		let m = now.getMonth();
		let y = now.getFullYear();
		for (let i = 0; i < 24; i++) {
			options.push({
				month: m,
				year: y,
				label: `${MONTH_NAMES_SHORT[m]} ${y}`,
			});
			m++;
			if (m > 11) {
				m = 0;
				y++;
			}
		}
		return options;
	}, []);

	// Generate future year options (current + next 5 years)
	const yearOptions = useMemo(() => {
		const options: number[] = [];
		for (let i = 0; i < 6; i++) {
			options.push(now.getFullYear() + i);
		}
		return options;
	}, []);

	// Filter transactions based on selected period
	const filteredTransactions = useMemo(() => {
		if (periodMode === "month") {
			return recurrencesUntilDate.filter((t) => {
				const scheduledTransaction = scheduledItems.find(
					(tr) => tr.id === t.scheduledTransactionId.value,
				);
				if (!scheduledTransaction) return false;
				return isActiveInMonth(
					t,
					scheduledTransaction,
					selectedYear,
					selectedMonth,
				);
			});
		} else {
			return recurrencesUntilDate.filter((t) => {
				const scheduledTransaction = scheduledItems.find(
					(tr) => tr.id === t.scheduledTransactionId.value,
				);
				if (!scheduledTransaction) return false;
				return isActiveInYear(t, scheduledTransaction, selectedYear);
			});
		}
	}, [
		periodMode,
		selectedMonth,
		selectedYear,
		recurrencesUntilDate,
		scheduledItems,
	]);

	// Build filtered MonthlySummaryData from filtered transactions
	const filteredMonthlySummaryData = useMemo<MonthlySummaryData>(() => {
		const yearMultiplier = periodMode === "year" ? 12 : 1;

		const scheduledTransactionsIds = new Set(
			filteredTransactions.map((t) => t.scheduledTransactionId.value),
		);

		const scheduledItemsForFilteredTransactions = scheduledItems.filter(
			(item) => scheduledTransactionsIds.has(item.id),
		);

		const incomeTransactions = scheduledItemsForFilteredTransactions.filter(
			(t) => t.operation.type.isIncome(),
		);
		const expenseTransactions =
			scheduledItemsForFilteredTransactions.filter((t) =>
				t.operation.type.isExpense(),
			);
		const longTermExpenseTransactions = expenseTransactions.filter(
			(t) => t.recurrencePattern.type === RecurrenceType.INFINITE,
		);
		const shortTermExpenseTransactions = expenseTransactions.filter(
			(t) => t.recurrencePattern.type !== RecurrenceType.INFINITE,
		);

		const totalIncome = incomeTransactions.reduce((acc, t) => {
			return acc + t.pricePerMonth.value * yearMultiplier;
		}, 0);
		const totalExpenses = expenseTransactions.reduce((acc, t) => {
			return acc + t.pricePerMonth.value * yearMultiplier;
		}, 0);
		const longTermExpenses = longTermExpenseTransactions.reduce(
			(acc, t) => {
				return acc + t.pricePerMonth.value * yearMultiplier;
			},
			0,
		);
		const shortTermExpenses = shortTermExpenseTransactions.reduce(
			(acc, t) => {
				return acc + t.pricePerMonth.value * yearMultiplier;
			},
			0,
		);
		const total = totalIncome - totalExpenses;

		const savingsTotal = monthExpenses.reduce(
			(acc, curr) => acc + curr.monthAmount.toNumber(),
			0,
		);
		const savingsTransactions = monthExpenses
			.map((expense) => {
				const scheduledTransaction = scheduledItems.find(
					(item) =>
						item.id === expense.info.scheduledTransactionId.value,
				);
				return scheduledTransaction;
			})
			.filter((item) => item !== undefined) as ScheduledTransaction[];

		return {
			savingsForNextMonth: {
				total: savingsTotal,
				transactions: savingsTransactions,
			},
			totalIncomePerMonth: {
				total: totalIncome,
				transactions: incomeTransactions,
			},
			totalExpensesPerMonth: {
				total: totalExpenses,
				transactions: expenseTransactions,
			},
			longTermExpensesPerMonth: {
				total: longTermExpenses,
				transactions: longTermExpenseTransactions,
			},
			shortTermExpensesPerMonth: {
				total: shortTermExpenses,
				transactions: shortTermExpenseTransactions,
			},
			totalPerMonth: {
				total: total,
				transactions: scheduledItemsForFilteredTransactions,
			},
		};
	}, [filteredTransactions, periodMode, monthExpenses, scheduledItems]);

	const periodTitle =
		periodMode === "month"
			? `${MONTH_NAMES[selectedMonth]} ${selectedYear}`
			: `${selectedYear}`;

	const navigatePeriod = (direction: -1 | 1) => {
		if (periodMode === "month") {
			let newMonth = selectedMonth + direction;
			let newYear = selectedYear;
			if (newMonth > 11) {
				newMonth = 0;
				newYear++;
			} else if (newMonth < 0) {
				newMonth = 11;
				newYear--;
			}
			// Don't go before current month
			if (
				newYear > now.getFullYear() ||
				(newYear === now.getFullYear() && newMonth >= now.getMonth())
			) {
				setSelectedMonth(newMonth);
				setSelectedYear(newYear);
			}
		} else {
			const newYear = selectedYear + direction;
			if (newYear >= now.getFullYear()) {
				setSelectedYear(newYear);
			}
		}
	};
	const canGoBack =
		periodMode === "month"
			? selectedYear > now.getFullYear() ||
				(selectedYear === now.getFullYear() &&
					selectedMonth > now.getMonth())
			: selectedYear > now.getFullYear();
	return (
		<section className="bg-white py-6 px-4 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto">
				{/* Section Header with Period Controls */}
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
					<div className="flex items-center gap-3">
						<div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
							<CalendarDays className="w-5 h-5 text-indigo-600" />
						</div>
						<div>
							<h3 className="text-lg font-semibold text-gray-900">
								Financial Summary
							</h3>
							<p className="text-xs text-gray-500">
								Projected{" "}
								{periodMode === "year" ? "annual" : "monthly"}{" "}
								totals based on scheduled transactions
							</p>
						</div>
					</div>

					{/* Period Mode Toggle */}
					<div className="flex items-center gap-2">
						<div className="flex bg-gray-100 rounded-lg p-0.5">
							<button
								onClick={() => setPeriodMode("month")}
								className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${periodMode === "month" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
							>
								Monthly
							</button>
							<button
								onClick={() => setPeriodMode("year")}
								className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${periodMode === "year" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
							>
								Yearly
							</button>
						</div>
					</div>
				</div>

				{/* Period Navigator */}
				<div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 mb-5">
					<button
						onClick={() => navigatePeriod(-1)}
						disabled={!canGoBack}
						className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
					>
						<ChevronLeft size={18} />
					</button>

					<span className="text-sm font-semibold text-gray-800">
						{periodTitle}
					</span>

					<button
						onClick={() => navigatePeriod(1)}
						className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
					>
						<ChevronRight size={18} />
					</button>
				</div>

				{/* Quick Month/Year Selector */}
				{periodMode === "month" ? (
					<div className="flex gap-1.5 overflow-x-auto pb-1 mb-5 scrollbar-hide">
						{monthOptions.slice(0, 12).map((opt) => {
							const isSelected =
								opt.month === selectedMonth &&
								opt.year === selectedYear;
							return (
								<button
									key={`${opt.year}-${opt.month}`}
									onClick={() => {
										setSelectedMonth(opt.month);
										setSelectedYear(opt.year);
									}}
									className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all shrink-0 ${isSelected ? "bg-indigo-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"}`}
								>
									{opt.label}
								</button>
							);
						})}
					</div>
				) : (
					<div className="flex gap-1.5 overflow-x-auto pb-1 mb-5 scrollbar-hide">
						{yearOptions.map((year) => {
							const isSelected = year === selectedYear;
							return (
								<button
									key={year}
									onClick={() => setSelectedYear(year)}
									className={`px-4 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all shrink-0 ${isSelected ? "bg-indigo-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"}`}
								>
									{year}
								</button>
							);
						})}
					</div>
				)}

				{/* Active transactions count */}
				<div className="text-xs text-gray-500 mb-4">
					{filteredTransactions.length} active scheduled transaction
					{filteredTransactions.length !== 1 ? "s" : ""} in{" "}
					{periodTitle}
				</div>
				<div className="space-y-3">
					<SummaryRow
						label={
							periodMode === "year"
								? "Projected Annual Savings"
								: "Savings for Next Month's Expenses"
						}
						data={filteredMonthlySummaryData.savingsForNextMonth}
						colorClass="text-blue-600"
						borderClass="border-blue-300"
						isExpandable
					/>

					<SummaryRow
						label={
							periodMode === "year"
								? "Total Annual Income"
								: "Total Incomes Per Month"
						}
						data={filteredMonthlySummaryData.totalIncomePerMonth}
						colorClass="text-emerald-600"
						borderClass="border-emerald-300"
						isExpandable
					/>

					<SummaryRow
						label={
							periodMode === "year"
								? "Total Annual Expenses"
								: "Total Expenses Per Month"
						}
						data={filteredMonthlySummaryData.totalExpensesPerMonth}
						colorClass="text-rose-600"
						borderClass="border-rose-300"
						isExpandable
					/>

					<SummaryRow
						label={
							periodMode === "year"
								? "Long-term Annual Expenses"
								: "Long-term Expenses Per Month"
						}
						data={
							filteredMonthlySummaryData.longTermExpensesPerMonth
						}
						colorClass="text-rose-600"
						borderClass="border-rose-300"
						isExpandable
					/>

					<SummaryRow
						label={
							periodMode === "year"
								? "Short-term Annual Expenses"
								: "Short-term Expenses Per Month"
						}
						data={
							filteredMonthlySummaryData.shortTermExpensesPerMonth
						}
						colorClass="text-rose-600"
						borderClass="border-rose-300"
						isExpandable
					/>

					<SummaryRow
						label={
							periodMode === "year"
								? "Short-term Annual Expenses"
								: "Short-term Expenses Per Month"
						}
						data={filteredMonthlySummaryData.totalPerMonth}
						colorClass={
							filteredMonthlySummaryData.totalPerMonth.total >= 0
								? "text-blue-600"
								: "text-rose-600"
						}
						borderClass="border-blue-300"
						isExpandable
					/>
				</div>
			</div>
		</section>
	);
}
