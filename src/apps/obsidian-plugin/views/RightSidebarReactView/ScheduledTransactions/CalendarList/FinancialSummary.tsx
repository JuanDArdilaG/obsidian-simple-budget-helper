import { motion } from "framer-motion";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { useContext, useMemo } from "react";
import { AccountAssetSubtype } from "../../../../../../contexts/Accounts/domain";
import {
	AccountsReport,
	ScheduledTransactionsReport,
} from "../../../../../../contexts/Reports/domain";
import { ItemRecurrenceInfo } from "../../../../../../contexts/ScheduledTransactions/domain";
import { TransactionAmount } from "../../../../../../contexts/Transactions/domain";
import { AccountsContext } from "../../Contexts";

interface FinancialSummaryProps {
	untilDate: Date;
	recurrences: ItemRecurrenceInfo[];
}

export function FinancialSummary({
	untilDate,
	recurrences,
}: Readonly<FinancialSummaryProps>) {
	const { accountsMap } = useContext(AccountsContext);

	const scheduledTransactionsReport = useMemo(
		() => new ScheduledTransactionsReport(recurrences),
		[recurrences],
	);
	const accountsReport = useMemo(
		() =>
			new AccountsReport(
				Array.from(accountsMap.values()).filter(
					(account) =>
						account.subtype === AccountAssetSubtype.CASH ||
						account.subtype === AccountAssetSubtype.CHECKING,
				),
			),
		[accountsMap],
	);
	const totalSpendableAssets = useMemo(
		() => accountsReport.getTotalForAssets(),
		[accountsReport],
	);

	const total = useMemo(
		() => scheduledTransactionsReport.totalAmount,
		[scheduledTransactionsReport],
	);

	const isDeficit = useMemo(() => total < 0, [total]);
	const isProjectedNegative = useMemo(
		() => totalSpendableAssets + total < 0,
		[totalSpendableAssets, total],
	);

	const formatDate = (date: Date) => {
		return date.toLocaleDateString("en-US", {
			month: "numeric",
			day: "numeric",
			year: "numeric",
		});
	};
	return (
		<div className="bg-white border-b border-gray-200 py-6 px-4 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Scheduled Transactions Summary */}
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
						className="bg-gray-50 rounded-lg p-5 border border-gray-200"
					>
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-base font-semibold text-gray-700">
								Scheduled Transactions Summary
							</h3>
							<div className="p-2 bg-indigo-50 rounded-lg">
								<TrendingUp className="w-4 h-4 text-indigo-600" />
							</div>
						</div>

						<div className="space-y-3">
							{/* Incomes */}
							<div className="flex items-center justify-between py-2">
								<span className="text-sm text-gray-600">
									Incomes until {formatDate(untilDate)}:
								</span>
								<span className="text-base font-semibold text-emerald-600">
									{new TransactionAmount(
										scheduledTransactionsReport.onlyIncomes()
											.totalAmount,
									).toString()}
								</span>
							</div>

							{/* Expenses */}
							<div className="flex items-center justify-between py-2">
								<span className="text-sm text-gray-600">
									Expenses until {formatDate(untilDate)}:
								</span>
								<span className="text-base font-semibold text-rose-600">
									{new TransactionAmount(
										scheduledTransactionsReport.onlyExpenses()
											.totalAmount,
									).toString()}
								</span>
							</div>

							{/* Deficit/Surplus */}
							<div className="flex items-center justify-between py-2 pt-3 border-t border-gray-300">
								<span className="text-sm font-medium text-gray-700">
									{isDeficit ? "Deficit:" : "Surplus:"}
								</span>
								<span
									className={`text-lg font-bold ${isDeficit ? "text-rose-600" : "text-emerald-600"}`}
								>
									{isDeficit ? "-" : "+"}
									{new TransactionAmount(
										Math.abs(total),
									).toString()}
								</span>
							</div>
						</div>
					</motion.div>

					{/* Current Financial Position */}
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
							delay: 0.1,
						}}
						className="bg-gray-50 rounded-lg p-5 border border-gray-200"
					>
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-base font-semibold text-gray-700">
								Current Financial Position
							</h3>
							<div className="p-2 bg-blue-50 rounded-lg">
								<DollarSign className="w-4 h-4 text-blue-600" />
							</div>
						</div>

						<div className="space-y-3">
							{/* Current Cash */}
							<div className="flex items-center justify-between py-2">
								<span className="text-sm text-gray-600">
									Current Cash & Checking:
								</span>
								<span className="text-base font-semibold text-gray-900">
									{new TransactionAmount(
										totalSpendableAssets,
									).toString()}
								</span>
							</div>

							{/* Projected Balance */}
							<div className="flex items-center justify-between py-2 pt-3 border-t border-gray-300">
								<span className="text-sm font-medium text-gray-700">
									Projected Balance by {formatDate(untilDate)}
									:
								</span>
								<div className="flex items-center gap-2">
									{isProjectedNegative ? (
										<TrendingDown className="w-4 h-4 text-rose-600" />
									) : (
										<TrendingUp className="w-4 h-4 text-emerald-600" />
									)}
									<span
										className={`text-lg font-bold ${isProjectedNegative ? "text-rose-600" : "text-emerald-600"}`}
									>
										{new TransactionAmount(
											totalSpendableAssets + total,
										).toString()}
									</span>
								</div>
							</div>
						</div>

						{/* Warning message if projected negative */}
						{isProjectedNegative && (
							<motion.div
								initial={{
									opacity: 0,
									height: 0,
								}}
								animate={{
									opacity: 1,
									height: "auto",
								}}
								className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg"
							>
								<p className="text-xs text-rose-800">
									<strong>Warning:</strong> Your projected
									balance is negative. Consider adjusting your
									scheduled expenses or increasing income.
								</p>
							</motion.div>
						)}
					</motion.div>
				</div>
			</div>
		</div>
	);
}
