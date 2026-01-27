import { AnimatePresence, motion } from "framer-motion";
import {
	ArrowDownLeft,
	ArrowLeft,
	ArrowUpRight,
	Calendar,
	CalendarRange,
	ChevronDown,
	DollarSign,
	RefreshCw,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Nanoid } from "../../../../../../contexts/Shared/domain";
import {
	Transaction,
	TransactionAmount,
} from "../../../../../../contexts/Transactions/domain";
import {
	AccountsContext,
	CategoriesContext,
	TransactionsContext,
} from "../../Contexts";

interface AccountReportPageProps {
	onBack: () => void;
}

type TimelineOption = "week" | "month" | "quarter" | "year" | "all" | "custom";
const TRANSACTIONS_PER_PAGE = 20;

export function AccountReportPage({
	onBack,
}: Readonly<AccountReportPageProps>) {
	const {
		useCases: { getTransactionsByAccount },
	} = useContext(TransactionsContext);
	const { getCategoryByID } = useContext(CategoriesContext);
	const { accountsMap, updateAccounts } = useContext(AccountsContext);
	const [selectedAccountId, setSelectedAccountId] = useState<Nanoid>();
	const [timeline, setTimeline] = useState<TimelineOption>("month");
	const [isLoading, setIsLoading] = useState(false);
	const [visibleCount, setVisibleCount] = useState(TRANSACTIONS_PER_PAGE);
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [customStartDate, setCustomStartDate] = useState("");
	const [customEndDate, setCustomEndDate] = useState("");
	const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

	useEffect(() => {
		updateAccounts();
	}, []);

	useEffect(() => {
		if (selectedAccountId) {
			setIsLoading(true);
			setVisibleCount(TRANSACTIONS_PER_PAGE); // Reset visible count
			getTransactionsByAccount
				.execute(selectedAccountId)
				.then((transactions) => {
					setTransactions(
						transactions.toSorted(
							(a, b) => b.date.getTime() - a.date.getTime(),
						),
					);
				})
				.finally(() => {
					setIsLoading(false);
				});
		}
	}, [selectedAccountId]);

	// Reset visible count when timeline changes
	useEffect(() => {
		setVisibleCount(TRANSACTIONS_PER_PAGE);
	}, [timeline]);

	const selectedAccount = useMemo(
		() =>
			selectedAccountId
				? accountsMap.get(selectedAccountId.value)
				: undefined,
		[selectedAccountId, accountsMap],
	);

	// Filter transactions by timeline
	const filteredTransactions = useMemo(() => {
		if (!selectedAccountId) return [];
		const now = new Date();
		let startDate = new Date();
		let endDate = new Date();
		switch (timeline) {
			case "week":
				startDate.setDate(now.getDate() - 7);
				break;
			case "month":
				startDate.setMonth(now.getMonth() - 1);
				break;
			case "quarter":
				startDate.setMonth(now.getMonth() - 3);
				break;
			case "year":
				startDate.setFullYear(now.getFullYear() - 1);
				break;
			case "all":
				return transactions;
			case "custom":
				if (customStartDate && customEndDate) {
					startDate = new Date(customStartDate);
					endDate = new Date(customEndDate);
					endDate.setHours(23, 59, 59, 999); // Include the entire end date
					return transactions.filter((t) => {
						const transactionDate = new Date(t.date);
						return (
							transactionDate >= startDate &&
							transactionDate <= endDate
						);
					});
				}
				return [];
		}
		return transactions.filter((t) => new Date(t.date) >= startDate);
	}, [
		transactions,
		timeline,
		selectedAccountId,
		customStartDate,
		customEndDate,
	]);

	// Get visible transactions
	const visibleTransactions = useMemo(() => {
		return filteredTransactions.slice(0, visibleCount);
	}, [filteredTransactions, visibleCount]);
	const hasMoreTransactions = visibleCount < filteredTransactions.length;
	const handleLoadMore = () => {
		setVisibleCount((prev) => prev + TRANSACTIONS_PER_PAGE);
	};

	const handleTimelineChange = (value: TimelineOption) => {
		setTimeline(value);
		if (value === "custom") {
			setShowCustomDatePicker(true);
			// Set default dates if not already set
			if (!customStartDate) {
				const defaultStart = new Date();
				defaultStart.setMonth(defaultStart.getMonth() - 1);
				setCustomStartDate(defaultStart.toISOString().split("T")[0]);
			}
			if (!customEndDate) {
				setCustomEndDate(new Date().toISOString().split("T")[0]);
			}
		} else {
			setShowCustomDatePicker(false);
		}
	};

	const handleApplyCustomDates = () => {
		if (customStartDate && customEndDate) {
			setShowCustomDatePicker(false);
		}
	};

	// Calculate summary statistics
	const summary = useMemo(() => {
		const income = filteredTransactions
			.filter((t) => t.operation.isIncome())
			.reduce((sum, t) => sum + (t.originAmount.value || 0), 0);
		const expenses = filteredTransactions
			.filter((t) => t.operation.isExpense())
			.reduce((sum, t) => sum + (t.originAmount.value || 0), 0);
		const transfersIn = filteredTransactions
			.filter(
				(t) =>
					t.operation.isTransfer() &&
					t.destinationAccounts.some(
						(s) => s.accountId.value === selectedAccountId?.value,
					),
			)
			.reduce(
				(sum, t) =>
					sum +
					(t.destinationAccounts.find(
						(s) => s.accountId.value === selectedAccountId?.value,
					)?.amount.value || 0),
				0,
			);
		const transfersOut = filteredTransactions
			.filter(
				(t) =>
					t.operation.isTransfer() &&
					t.originAccounts.some(
						(s) => s.accountId.value === selectedAccountId?.value,
					),
			)
			.reduce(
				(sum, t) =>
					sum +
					(t.originAccounts.find(
						(s) => s.accountId.value === selectedAccountId?.value,
					)?.amount.value || 0),
				0,
			);
		const netChange = income + transfersIn - expenses - transfersOut;
		return {
			income,
			expenses,
			transfersIn,
			transfersOut,
			netChange,
			transactionCount: filteredTransactions.length,
		};
	}, [filteredTransactions, selectedAccountId]);

	const timelineOptions: {
		value: TimelineOption;
		label: string;
	}[] = [
		{
			value: "week",
			label: "Last 7 Days",
		},
		{
			value: "month",
			label: "Last Month",
		},
		{
			value: "quarter",
			label: "Last Quarter",
		},
		{
			value: "year",
			label: "Last Year",
		},
		{
			value: "all",
			label: "All Time",
		},
		{ value: "custom", label: "Custom Range" },
	];

	const getTimelineLabel = useCallback(() => {
		if (timeline === "custom" && customStartDate && customEndDate) {
			const start = new Date(customStartDate).toLocaleDateString(
				undefined,
				{
					month: "short",
					day: "numeric",
					year: "numeric",
				},
			);
			const end = new Date(customEndDate).toLocaleDateString(undefined, {
				month: "short",
				day: "numeric",
				year: "numeric",
			});
			return `${start} - ${end}`;
		}
		return timelineOptions.find((o) => o.value === timeline)?.label || "";
	}, [timeline, customStartDate, customEndDate]);

	const getOperationIcon = (operation: string) => {
		switch (operation) {
			case "expense":
				return <ArrowUpRight className="w-4! h-4! text-rose-600!" />;
			case "income":
				return (
					<ArrowDownLeft className="w-4! h-4! text-emerald-600!" />
				);
			case "transfer":
				return <RefreshCw className="w-4! h-4! text-blue-600!" />;
			default:
				return null;
		}
	};

	return (
		<div className="min-h-screen! bg-gray-50! font-sans!">
			{/* Header */}
			<header className="bg-white! border-b! border-gray-200! sticky! top-0! z-20!">
				<div className="max-w-7xl! mx-auto! px-4! sm:px-6! lg:px-8! h-16! flex! items-center! gap-4!">
					<button
						onClick={onBack}
						className="p-2! text-gray-400! hover:text-indigo-600! hover:bg-gray-100! rounded-full! transition-colors!"
					>
						<ArrowLeft size={20} />
					</button>
					<div>
						<h1 className="text-lg! font-bold! text-gray-900!">
							Account Report
						</h1>
						<p className="text-xs! text-gray-600!">
							Detailed account analysis
						</p>
					</div>
				</div>
			</header>

			<main className="max-w-7xl! mx-auto! px-4! sm:px-6! lg:px-8! py-6!">
				{/* Account Selection */}
				<div className="bg-white! rounded-xl! border! border-gray-200! p-6! mb-6!">
					<h2 className="text-sm! font-semibold! text-gray-700! mb-3!">
						Select Account
					</h2>
					<div className="grid! grid-cols-1! sm:grid-cols-2! lg:grid-cols-4! gap-3!">
						{Array.from(accountsMap.values()).map((account) => (
							<button
								key={account.id}
								onClick={() =>
									setSelectedAccountId(account.nanoid)
								}
								className={`block! p-4! rounded-lg! border-2! transition-all! text-left! ${selectedAccountId?.equalTo(account.nanoid) ? "border-indigo-600! bg-indigo-50! ring-2! ring-indigo-600! ring-offset-2!" : "border-gray-200! hover:border-indigo-300! hover:bg-gray-50!"}`}
							>
								<div className="font-semibold! text-gray-900! mb-1! truncate!">
									{account.name}
								</div>
								<div className="text-xs! text-gray-500! mb-2!">
									{account.subtype}
								</div>
								<div className="text-lg! font-bold! text-indigo-600!">
									{account.balance.value.toString()}
								</div>
							</button>
						))}
					</div>
				</div>

				{/* Timeline Selection */}
				{selectedAccountId && (
					<motion.div
						initial={{
							opacity: 0,
							y: 20,
						}}
						animate={{
							opacity: 1,
							y: 0,
						}}
						className="bg-white! rounded-xl! border! border-gray-200! p-6! mb-6!"
					>
						<h2 className="text-sm! font-semibold! text-gray-700! mb-3!">
							Timeline
						</h2>
						<div className="flex flex-wrap gap-2 mb-4">
							{timelineOptions.map((option) => (
								<button
									key={option.value}
									onClick={() =>
										handleTimelineChange(option.value)
									}
									className={`px-4! py-2! rounded-lg! text-sm! font-medium! transition-all! flex! items-center! gap-2! ${timeline === option.value ? "bg-indigo-600! text-white! shadow-sm!" : "bg-gray-100! text-gray-700! hover:bg-gray-200!"}`}
								>
									{option.value === "custom" && (
										<CalendarRange size={16} />
									)}
									{option.label}
								</button>
							))}
						</div>
						<AnimatePresence>
							{showCustomDatePicker && (
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
									className="overflow-hidden!"
								>
									<div className="pt-4! border-t! border-gray-200!">
										<div className="grid! grid-cols-1! sm:grid-cols-2! gap-4!">
											<div>
												<label className="block! text-sm! font-medium! text-gray-700! mb-2!">
													Start Date
												</label>
												<input
													type="date"
													value={customStartDate}
													onChange={(e) =>
														setCustomStartDate(
															e.target.value,
														)
													}
													max={
														customEndDate ||
														undefined
													}
													className="w-full! px-3! py-2! border! border-gray-300! rounded-lg! focus:ring-2! focus:ring-indigo-500! focus:border-indigo-500!"
												/>
											</div>
											<div>
												<label className="block! text-sm! font-medium! text-gray-700! mb-2!">
													End Date
												</label>
												<input
													type="date"
													value={customEndDate}
													onChange={(e) =>
														setCustomEndDate(
															e.target.value,
														)
													}
													min={
														customStartDate ||
														undefined
													}
													max={
														new Date()
															.toISOString()
															.split("T")[0]
													}
													className="w-full! px-3! py-2! border! border-gray-300! rounded-lg! focus:ring-2! focus:ring-indigo-500! focus:border-indigo-500!"
												/>
											</div>
										</div>
										<div className="mt-4 flex gap-2">
											<button
												onClick={handleApplyCustomDates}
												disabled={
													!customStartDate ||
													!customEndDate
												}
												className="px-4! py-2! bg-indigo-600! text-white! rounded-lg! text-sm! font-medium! hover:bg-indigo-700! disabled:opacity-50! disabled:cursor-not-allowed! transition-colors!"
											>
												Apply Date Range
											</button>
											<button
												onClick={() => {
													setShowCustomDatePicker(
														false,
													);
													setTimeline("month");
												}}
												className="px-4! py-2! bg-gray-100! text-gray-700! rounded-lg! text-sm! font-medium! hover:bg-gray-200! transition-colors!"
											>
												Cancel
											</button>
										</div>
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</motion.div>
				)}

				{/* Summary Cards */}
				{selectedAccountId && !isLoading && (
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
							delay: 0.1,
						}}
						className="grid! grid-cols-1! md:grid-cols-2! lg:grid-cols-4! gap-4! mb-6!"
					>
						{/* Current Balance */}
						<div className="bg-white! rounded-xl! border! border-gray-200! p-5!">
							<div className="flex! items-center! justify-between! mb-2!">
								<span className="text-sm! font-medium! text-gray-600!">
									Current Balance
								</span>
								<DollarSign className="w-5! h-5! text-indigo-600!" />
							</div>
							<div className="text-2xl! font-bold! text-gray-900!">
								{selectedAccount?.balance.value.toString() || 0}
							</div>
						</div>

						{/* Income */}
						<div className="bg-white! rounded-xl! border! border-gray-200! p-5!">
							<div className="flex! items-center! justify-between! mb-2!">
								<span className="text-sm! font-medium! text-gray-600!">
									Income
								</span>
								<TrendingUp className="w-5! h-5! text-emerald-600!" />
							</div>
							<div className="text-2xl! font-bold! text-emerald-600!">
								{new TransactionAmount(
									summary.income + summary.transfersIn,
								).toString()}
							</div>
							<div className="text-xs! text-gray-500! mt-1!">
								{summary.transactionCount} transactions
							</div>
						</div>

						{/* Expenses */}
						<div className="bg-white! rounded-xl! border! border-gray-200! p-5!">
							<div className="flex! items-center! justify-between! mb-2!">
								<span className="text-sm! font-medium! text-gray-600!">
									Expenses
								</span>
								<TrendingDown className="w-5! h-5! text-rose-600!" />
							</div>
							<div className="text-2xl! font-bold! text-rose-600!">
								{new TransactionAmount(
									summary.expenses + summary.transfersOut,
								).toString()}
							</div>
							<div className="text-xs! text-gray-500! mt-1!">
								{summary.transactionCount} transactions
							</div>
						</div>

						{/* Net Change */}
						<div className="bg-white! rounded-xl! border! border-gray-200! p-5!">
							<div className="flex! items-center! justify-between! mb-2!">
								<span className="text-sm! font-medium! text-gray-600!">
									Net Change
								</span>
								<Calendar className="w-5! h-5! text-gray-600!" />
							</div>
							<div
								className={`text-2xl! font-bold! ${summary.netChange >= 0 ? "text-emerald-600!" : "text-rose-600!"}`}
							>
								{summary.netChange >= 0 ? "+" : ""}
								{new TransactionAmount(
									summary.netChange,
								).toString()}
							</div>
							<div className="text-xs! text-gray-500! mt-1!">
								{getTimelineLabel()}
							</div>
						</div>
					</motion.div>
				)}

				{/* Transactions List */}
				{selectedAccountId &&
					!isLoading &&
					filteredTransactions.length > 0 && (
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
								delay: 0.2,
							}}
							className="bg-white! rounded-xl! border! border-gray-200! overflow-hidden!"
						>
							<div className="p-6! border-b! border-gray-200!">
								<h2 className="text-lg! font-semibold! text-gray-900!">
									Transaction History
								</h2>
								<p className="text-sm! text-gray-600! mt-1!">
									Showing {visibleTransactions.length} of{" "}
									{filteredTransactions.length} transactions
								</p>
							</div>

							<div className="divide-y! divide-gray-100!">
								{visibleTransactions.map(
									(transaction, index) => {
										const amount = transaction.originAmount;
										const isIncoming =
											transaction.operation.isIncome() ||
											(transaction.operation.isTransfer() &&
												transaction.destinationAccounts.some(
													(s) =>
														s.accountId.equalTo(
															selectedAccountId,
														),
												));
										return (
											<motion.div
												key={transaction.id}
												initial={{
													opacity: 0,
													x: -20,
												}}
												animate={{
													opacity: 1,
													x: 0,
												}}
												transition={{
													delay: Math.min(
														index * 0.02,
														0.4,
													),
												}}
												className="p-4! hover:bg-gray-50! transition-colors!"
											>
												<div className="flex! items-center! justify-between! gap-4!">
													<div className="flex! items-center! gap-3! flex-1! min-w-0!">
														<div className="flex-shrink-0!">
															{getOperationIcon(
																transaction
																	.operation
																	.value,
															)}
														</div>
														<div className="flex-1! min-w-0!">
															<div className="font-medium! text-gray-900! truncate!">
																{
																	transaction.name
																}
															</div>
															<div className="text-xs! text-gray-500! truncate!">
																{
																	getCategoryByID(
																		transaction.category,
																	)?.name
																}
																{transaction.store &&
																	` • ${transaction.store}`}
															</div>
														</div>
													</div>
													<div className="text-right! flex-shrink-0!">
														<div
															className={`font-bold! ${isIncoming ? "text-emerald-600!" : "text-rose-600!"}`}
														>
															{isIncoming
																? "+"
																: "-"}
															{amount.toString()}
														</div>
														<div className="text-xs! text-gray-500!">
															{new Date(
																transaction.date,
															).toLocaleDateString(
																undefined,
																{
																	month: "short",
																	day: "numeric",
																},
															)}
														</div>
													</div>
												</div>
											</motion.div>
										);
									},
								)}
							</div>

							{/* Load More Button */}
							{hasMoreTransactions && (
								<div className="p-4! bg-gray-50! border-t! border-gray-100!">
									<button
										onClick={handleLoadMore}
										className="w-full! flex! items-center! justify-center! gap-2! px-4! py-3! bg-white! border! border-gray-300! rounded-lg! text-sm! font-medium! text-gray-700! hover:bg-gray-50! hover:border-indigo-300! transition-all!"
									>
										<span>Load More Transactions</span>
										<ChevronDown size={16} />
									</button>
									<p className="text-xs! text-gray-500! text-center! mt-2!">
										{filteredTransactions.length -
											visibleCount}{" "}
										more transactions available
									</p>
								</div>
							)}

							{/* All Loaded Message */}
							{!hasMoreTransactions &&
								filteredTransactions.length >
									TRANSACTIONS_PER_PAGE && (
									<div className="p-4! bg-gray-50! border-t! border-gray-100! text-center!">
										<p className="text-sm! text-gray-600!">
											All {filteredTransactions.length}{" "}
											transactions loaded
										</p>
									</div>
								)}
						</motion.div>
					)}

				{/* Empty State */}
				{!selectedAccountId && (
					<div className="flex! flex-col! items-center! justify-center! h-64! text-gray-500!">
						<DollarSign
							size={48}
							className="mb-4! text-gray-300!"
						/>
						<p className="text-lg! font-medium!">
							Select an account to view report
						</p>
						<p className="text-sm!">
							Choose an account above to see detailed analysis
						</p>
					</div>
				)}

				{/* Loading State */}
				{isLoading && (
					<div className="flex! flex-col! items-center! justify-center! h-64! text-gray-500!">
						<motion.div
							animate={{
								rotate: 360,
							}}
							transition={{
								duration: 1,
								repeat: Infinity,
								ease: "linear",
							}}
						>
							<RefreshCw size={32} className="text-indigo-600!" />
						</motion.div>
						<p className="text-sm! mt-4!">
							Loading transactions...
						</p>
					</div>
				)}

				{/* No Transactions State */}
				{selectedAccountId &&
					!isLoading &&
					filteredTransactions.length === 0 && (
						<div className="flex! flex-col! items-center! justify-center! h-64! text-gray-500!">
							<Calendar
								size={48}
								className="mb-4! text-gray-300!"
							/>
							<p className="text-lg! font-medium!">
								No transactions found
							</p>
							<p className="text-sm!">
								Try selecting a different timeline
							</p>
						</div>
					)}
			</main>
		</div>
	);
}
