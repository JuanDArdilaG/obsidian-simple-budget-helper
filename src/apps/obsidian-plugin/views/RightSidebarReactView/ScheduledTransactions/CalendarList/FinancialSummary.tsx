import { AnimatePresence, motion } from "framer-motion";
import {
	ChevronDown,
	DollarSign,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import { useContext, useMemo, useState } from "react";
import { AccountAssetSubtype } from "../../../../../../contexts/Accounts/domain";
import {
	AccountsReport,
	ScheduledTransactionsReport,
} from "../../../../../../contexts/Reports/domain";
import { ItemRecurrenceInfo } from "../../../../../../contexts/ScheduledTransactions/domain";
import { PriceVO } from "../../../../../../contexts/Shared/domain/value-objects/price.vo";
import { TransactionAmount } from "../../../../../../contexts/Transactions/domain";
import { AccountsContext, AppContext } from "../../Contexts";

interface FinancialSummaryProps {
	untilDate: Date;
	recurrences: ItemRecurrenceInfo[];
}

export function FinancialSummary({
	untilDate,
	recurrences,
}: Readonly<FinancialSummaryProps>) {
	const {
		plugin: { settings },
	} = useContext(AppContext);
	const { accountsMap } = useContext(AccountsContext);

	const scheduledTransactionsReport = useMemo(
		() => new ScheduledTransactionsReport(recurrences),
		[recurrences],
	);
	const accountsReport = useMemo(
		() =>
			new AccountsReport(
				Array.from(accountsMap.values())
					.filter(
						(account) =>
							account.subtype === AccountAssetSubtype.CASH ||
							account.subtype === AccountAssetSubtype.CHECKING,
					)
					.filter((account) => account.balance.value.value !== 0),
			),
		[accountsMap],
	);
	const totalSpendableAssets = useMemo(
		() => accountsReport.getTotalForAssets(),
		[accountsReport],
	);

	const total = useMemo(
		() => scheduledTransactionsReport.getTotalAmount(accountsMap),
		[scheduledTransactionsReport, accountsMap],
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

	const [showAccountBreakdown, setShowAccountBreakdown] = useState(false);

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
										scheduledTransactionsReport
											.onlyIncomes(accountsMap)
											.getTotalAmount(accountsMap),
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
										scheduledTransactionsReport
											.onlyExpenses(accountsMap)
											.getTotalAmount(accountsMap),
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
							{/* Current Cash — clickable to expand */}
							<div>
								<button
									onClick={() =>
										accountsReport.accounts.length > 0 &&
										setShowAccountBreakdown(
											!showAccountBreakdown,
										)
									}
									className={`w-full flex items-center justify-between py-2 ${accountsReport.accounts.length > 0 ? "cursor-pointer group" : ""}`}
								>
									<span className="text-sm text-gray-600 flex items-center gap-1.5">
										Current Cash & Checking:
										{accountsReport.accounts.length > 0 && (
											<motion.span
												animate={{
													rotate: showAccountBreakdown
														? 180
														: 0,
												}}
												transition={{
													duration: 0.2,
												}}
											>
												<ChevronDown
													size={14}
													className="text-gray-400 group-hover:text-indigo-500 transition-colors"
												/>
											</motion.span>
										)}
									</span>
									<span className="text-base font-semibold text-gray-900">
										{new PriceVO(
											totalSpendableAssets,
										).toString()}
									</span>
								</button>
								{/* Account breakdown */}
								<AnimatePresence>
									{showAccountBreakdown &&
										accountsReport.accounts.length > 0 && (
											<motion.div
												initial={{
													opacity: 0,
													height: 0,
												}}
												animate={{
													opacity: 1,
													height: "auto",
												}}
												exit={{
													opacity: 0,
													height: 0,
												}}
												transition={{
													duration: 0.2,
												}}
												className="overflow-hidden"
											>
												<div className="ml-2 pl-3 border-l-2 border-indigo-200 space-y-1.5 py-2">
													{accountsReport.accounts
														.toSorted(
															(a, b) =>
																b.convertedBalance -
																a.convertedBalance,
														)
														.map((account) => {
															const isNonDefault =
																account.currency
																	.value !==
																settings.defaultCurrency;
															return (
																<div
																	key={
																		account.id
																	}
																	className="flex items-center justify-between text-sm"
																>
																	<div className="flex items-center gap-2 min-w-0">
																		<div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
																		<span className="text-gray-600 truncate">
																			{
																				account.name
																			}
																		</span>
																		{isNonDefault && (
																			<span className="text-[10px] font-semibold tracking-wider uppercase px-1 py-0.5 rounded bg-gray-100 text-gray-500 shrink-0">
																				{
																					account.currency
																				}
																			</span>
																		)}
																	</div>
																	<div className="flex flex-col items-end shrink-0 ml-3">
																		<span className="font-medium text-gray-800 tabular-nums">
																			{new Intl.NumberFormat(
																				"en-US",
																				{
																					style: "currency",
																					currency:
																						account
																							.currency
																							.value,
																					minimumFractionDigits: 0,
																				},
																			).format(
																				account
																					.balance
																					.value
																					.value,
																			)}
																		</span>
																		{isNonDefault && (
																			<span className="text-xs text-gray-400 tabular-nums">
																				≈{" "}
																				{new Intl.NumberFormat(
																					"en-US",
																					{
																						style: "currency",
																						currency:
																							settings.defaultCurrency,
																						minimumFractionDigits: 0,
																					},
																				).format(
																					account.convertedBalance,
																				)}
																			</span>
																		)}
																	</div>
																</div>
															);
														})}
												</div>
											</motion.div>
										)}
								</AnimatePresence>
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
