import { motion } from "framer-motion";
import { Calendar, PieChart, TrendingUp } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { ItemRecurrenceInfo } from "../../../../../contexts/ScheduledTransactions/domain";
import { TransactionAmount } from "../../../../../contexts/Transactions/domain";
import {
	AccountsContext,
	ScheduledTransactionsContext,
	TransactionsContext,
} from "../Contexts";
import {
	MonthlyDataPoint,
	MonthlyFinancialChart,
} from "./MonthlyProjection/MonthlyFinancialChart";

type ReportTab = "projection" | "spending" | "income";

export function ReportsPage() {
	const { accountsMap } = useContext(AccountsContext);
	const { transactions } = useContext(TransactionsContext);
	const {
		useCases: { getScheduledTransactionsUntilDate },
	} = useContext(ScheduledTransactionsContext);
	const [activeTab, setActiveTab] = useState<ReportTab>("projection");
	const tabs = [
		{
			id: "projection" as ReportTab,
			label: "Financial Projection",
			icon: TrendingUp,
			description:
				"View projected financial position over upcoming months",
		},
		{
			id: "spending" as ReportTab,
			label: "Spending Analysis",
			icon: PieChart,
			description: "Coming Soon",
			disabled: true,
		},
		{
			id: "income" as ReportTab,
			label: "Income Analysis",
			icon: Calendar,
			description: "Coming Soon",
			disabled: true,
		},
	];

	const [recurrences, setRecurrences] = useState<ItemRecurrenceInfo[]>([]);
	useEffect(() => {
		const fetchRecurrences = async () => {
			const endDate = new Date();
			endDate.setMonth(endDate.getMonth() + 12);
			const recs =
				await getScheduledTransactionsUntilDate.execute(endDate);
			setRecurrences(recs);
		};
		fetchRecurrences();
	}, [getScheduledTransactionsUntilDate]);

	const [monthlyData, setMonthlyData] = useState<MonthlyDataPoint[]>([]);
	useEffect(() => {
		// Calculate initial accumulated balance from account balances
		const months: MonthlyDataPoint[] = [];
		const now = new Date();

		for (let i = 0; i < 12; i++) {
			const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
			months.push({
				month: date.toLocaleString("default", {
					month: "short",
					year: "2-digit",
				}),
				income: 0,
				expense: 0,
				balance: 0,
				accumulated: 0,
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
						const amount = transaction.originAmount.value;
						months[monthIndex].income =
							months[monthIndex].income + amount;
					} else if (transaction.operation.isExpense()) {
						const amount = transaction.originAmount.value;
						months[monthIndex].expense =
							months[monthIndex].expense + amount;
					}
				}
			}
		};

		processTransactions();

		const processScheduledTransactions = async (
			months: MonthlyDataPoint[],
		) => {
			for (const recurrence of recurrences) {
				const monthIndex = calculateMonthIndex(recurrence.date.value);

				if (monthIndex >= 0 && monthIndex < 12) {
					const amount = recurrence.originAmount.value;
					if (recurrence.operation.type.isIncome()) {
						months[monthIndex].income =
							months[monthIndex].income + amount;
					} else if (recurrence.operation.type.isExpense()) {
						months[monthIndex].expense =
							months[monthIndex].expense + amount;
					}
				}
			}
			return months;
		};

		processScheduledTransactions(months).then((months) => {
			const initialBalance = Array.from(accountsMap.values()).reduce(
				(total, account) => {
					return total + account.realBalance.value;
				},
				0,
			);

			let accumulated = initialBalance;
			const finalMonths = months.map((month) => {
				const balance = month.income - month.expense;
				accumulated = accumulated + balance;
				return {
					...month,
					balance,
					accumulated,
				};
			});

			setMonthlyData(finalMonths);
		});
	}, [transactions, accountsMap, recurrences]);

	const [summary, setSummary] = useState({
		averageMonthlyIncome: 0,
		averageMonthlyExpenses: 0,
		projectedYearEndBalance: 0,
	});
	useEffect(() => {
		if (monthlyData.length === 0) return;

		const totalIncome = monthlyData.reduce(
			(total, month) => total + month.income,
			0,
		);
		const totalExpenses = monthlyData.reduce(
			(total, month) => total + month.expense,
			0,
		);
		const averageMonthlyIncome = totalIncome / monthlyData.length;
		const averageMonthlyExpenses = totalExpenses / monthlyData.length;
		const projectedYearEndBalance = monthlyData.at(-1)?.accumulated;

		setSummary({
			averageMonthlyIncome,
			averageMonthlyExpenses,
			projectedYearEndBalance: projectedYearEndBalance ?? 0,
		});
	}, [monthlyData]);

	return (
		<div className="min-h-screen bg-gray-50 font-sans">
			{/* Header */}
			<header className="bg-white border-b border-gray-200">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
					<h1 className="text-2xl font-bold text-gray-900">
						Reports
					</h1>
					<p className="text-sm text-gray-600 mt-1">
						Analyze your financial data and projections
					</p>
				</div>
			</header>

			{/* Tabs */}
			<div className="bg-white border-b border-gray-200 sticky top-0 z-10">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex gap-1 overflow-x-auto">
						{tabs.map((tab) => {
							const Icon = tab.icon;
							const isActive = activeTab === tab.id;
							if (tab.disabled) {
								return (
									<div
										key={tab.id}
										className="flex items-center gap-2 px-4 py-3 border-b-2 border-transparent text-gray-400 cursor-not-allowed text-sm font-medium whitespace-nowrap"
									>
										<Icon size={18} />
										<span>{tab.label}</span>
									</div>
								);
							}
							return (
								<button
									key={tab.id}
									onClick={() => setActiveTab(tab.id)}
									className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all font-medium text-sm whitespace-nowrap ${isActive ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"}`}
								>
									<Icon size={18} />
									<span>{tab.label}</span>
								</button>
							);
						})}
					</div>
				</div>
			</div>

			{/* Content */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				{activeTab === "projection" && (
					<motion.div
						initial={{
							opacity: 0,
							y: 20,
						}}
						animate={{
							opacity: 1,
							y: 0,
						}}
						transition={{
							duration: 0.3,
						}}
					>
						<div className="mb-6">
							<h2 className="text-lg font-semibold text-gray-900 mb-2">
								Monthly Financial Projection
							</h2>
							<p className="text-sm text-gray-600">
								Based on recorded transactions and scheduled
								transactions for upcoming months
							</p>
						</div>

						<MonthlyFinancialChart data={monthlyData} />

						{/* Additional Info */}
						<div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="bg-white rounded-lg border border-gray-200 p-4">
								<h3 className="text-sm font-medium text-gray-600 mb-1">
									Average Monthly Income
								</h3>
								<p className="text-2xl font-bold text-emerald-600">
									{new TransactionAmount(
										summary.averageMonthlyIncome,
									).toString()}
								</p>
							</div>

							<div className="bg-white rounded-lg border border-gray-200 p-4">
								<h3 className="text-sm font-medium text-gray-600 mb-1">
									Average Monthly Expenses
								</h3>
								<p className="text-2xl font-bold text-rose-600">
									{new TransactionAmount(
										summary.averageMonthlyExpenses,
									).toString()}
								</p>
							</div>

							<div className="bg-white rounded-lg border border-gray-200 p-4">
								<h3 className="text-sm font-medium text-gray-600 mb-1">
									Projected Year-End Balance
								</h3>
								<p className="text-2xl font-bold text-indigo-600">
									{new TransactionAmount(
										summary.projectedYearEndBalance,
									).toString()}
								</p>
							</div>
						</div>
					</motion.div>
				)}

				{activeTab === "spending" && (
					<div className="flex flex-col items-center justify-center h-64 text-gray-500">
						<PieChart size={48} className="mb-4 text-gray-300" />
						<p className="text-lg font-medium">Spending Analysis</p>
						<p className="text-sm">Coming Soon</p>
					</div>
				)}

				{activeTab === "income" && (
					<div className="flex flex-col items-center justify-center h-64 text-gray-500">
						<Calendar size={48} className="mb-4 text-gray-300" />
						<p className="text-lg font-medium">Income Analysis</p>
						<p className="text-sm">Coming Soon</p>
					</div>
				)}
			</main>
		</div>
	);
}
