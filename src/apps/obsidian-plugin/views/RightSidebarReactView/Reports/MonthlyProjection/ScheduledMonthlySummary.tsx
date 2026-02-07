import { AnimatePresence, motion } from "framer-motion";
import {
	ArrowDownLeft,
	ArrowUpRight,
	ChevronDown,
	RefreshCw,
	Repeat,
} from "lucide-react";
import { useContext, useMemo, useState } from "react";
import { ScheduledTransaction } from "../../../../../../contexts/ScheduledTransactions/domain";
import { TransactionAmount } from "../../../../../../contexts/Transactions/domain";
import { CategoriesContext } from "../../Contexts";

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

interface ScheduledMonthlySummaryProps {
	data: MonthlySummaryData;
}

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
															{item.frequency}
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

export function ScheduledMonthlySummary({
	data,
}: Readonly<ScheduledMonthlySummaryProps>) {
	return (
		<div className="bg-white border-t border-gray-200 py-6 px-4 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto">
				<h3 className="text-lg font-semibold text-gray-900 mb-4">
					Monthly Summary
				</h3>

				<div className="space-y-3">
					<SummaryRow
						label="Savings for Next Month's Expenses"
						data={data.savingsForNextMonth}
						colorClass="text-blue-600"
						borderClass="border-blue-300"
						isExpandable
					/>

					<SummaryRow
						label="Total Incomes Per Month"
						data={data.totalIncomePerMonth}
						colorClass="text-emerald-600"
						borderClass="border-emerald-300"
						isExpandable
					/>

					{/* <SummaryRow
						label="Total Expenses Per Month"
						data={data.totalExpensesPerMonth}
						colorClass="text-rose-600"
						borderClass="border-rose-300"
						isExpandable
					/> */}

					<SummaryRow
						label="Long-term Expenses Per Month"
						data={data.longTermExpensesPerMonth}
						colorClass="text-rose-600"
						borderClass="border-rose-300"
						isExpandable
					/>

					<SummaryRow
						label="Short-term Expenses Per Month"
						data={data.shortTermExpensesPerMonth}
						colorClass="text-rose-600"
						borderClass="border-rose-300"
						isExpandable
					/>

					<SummaryRow
						label="Total Per Month"
						data={data.totalPerMonth}
						colorClass={
							data.totalPerMonth.total >= 0
								? "text-blue-600"
								: "text-rose-600"
						}
						borderClass="border-blue-300"
						isExpandable
					/>
				</div>
			</div>
		</div>
	);
}
