import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export interface MonthlySummaryData {
	savingsForNextMonth: number;
	totalIncomePerMonth: number;
	totalExpensesPerMonth: number;
	longTermExpensesPerMonth: number;
	shortTermExpensesPerMonth: number;
	totalPerMonth: number;
}

interface ScheduledMonthlySummaryProps {
	data: MonthlySummaryData;
}

interface SummaryRowProps {
	label: string;
	amount: number;
	colorClass: string;
	borderClass: string;
	isExpandable?: boolean;
}

function SummaryRow({
	label,
	amount,
	colorClass,
	borderClass,
	isExpandable = false,
}: Readonly<SummaryRowProps>) {
	const [isExpanded, setIsExpanded] = useState(false);
	const formatCurrency = (value: number) => {
		const formatted = new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(Math.abs(value));
		return value < 0 ? `-${formatted}` : formatted;
	};
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
				onClick={() => isExpandable && setIsExpanded(!isExpanded)}
				className={`w-full px-5 py-4 flex items-center justify-between transition-colors ${isExpandable ? "hover:bg-gray-50 cursor-pointer" : "cursor-default"}`}
			>
				<span className="text-sm font-medium text-gray-700">
					{label}
				</span>
				<div className="flex items-center gap-2">
					<span className={`text-xl font-bold ${colorClass}`}>
						{formatCurrency(amount)}
					</span>
					{isExpandable && (
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

			{isExpandable && (
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
							className="border-t border-gray-200 bg-gray-50 px-5 py-3"
						>
							<p className="text-xs text-gray-600">
								Detailed breakdown would appear here
							</p>
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
						amount={data.savingsForNextMonth}
						colorClass="text-blue-600"
						borderClass="border-blue-300"
						isExpandable
					/>

					<SummaryRow
						label="Total Incomes Per Month"
						amount={data.totalIncomePerMonth}
						colorClass="text-emerald-600"
						borderClass="border-emerald-300"
						isExpandable
					/>

					<SummaryRow
						label="Total Expenses Per Month"
						amount={-data.totalExpensesPerMonth}
						colorClass="text-rose-600"
						borderClass="border-rose-300"
						isExpandable
					/>

					<SummaryRow
						label="Long-term Expenses Per Month"
						amount={-data.longTermExpensesPerMonth}
						colorClass="text-rose-600"
						borderClass="border-rose-300"
						isExpandable
					/>

					<SummaryRow
						label="Short-term Expenses Per Month"
						amount={-data.shortTermExpensesPerMonth}
						colorClass="text-rose-600"
						borderClass="border-rose-300"
						isExpandable
					/>

					<SummaryRow
						label="Total Per Month"
						amount={data.totalPerMonth}
						colorClass={
							data.totalPerMonth >= 0
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
