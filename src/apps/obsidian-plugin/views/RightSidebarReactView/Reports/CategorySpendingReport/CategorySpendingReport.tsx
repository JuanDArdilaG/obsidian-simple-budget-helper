import { AnimatePresence, motion } from "framer-motion";
import {
	ArrowLeft,
	ChevronLeft,
	ChevronRight,
	PieChartIcon,
} from "lucide-react";
import { useContext, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CategoriesContext, TransactionsContext } from "../../Contexts";

type TimeframeMode = "month" | "year" | "custom";
const COLORS = [
	"#10b981",
	"#f59e0b",
	"#8b5cf6",
	"#64748b",
	"#f43f5e",
	"#06b6d4",
	"#ec4899",
	"#3b82f6",
	"#84cc16",
	"#a855f7", // Purple
];
export function CategorySpendingReport() {
	const [timeframe, setTimeframe] = useState<TimeframeMode>("month");
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [customRange, setCustomRange] = useState<{
		from: string;
		to: string;
	}>({
		from: "",
		to: "",
	});
	const [selectedCategory, setSelectedCategory] = useState<string | null>(
		null,
	);
	const { transactions } = useContext(TransactionsContext);
	const { getCategoryByID, getSubCategoryByID } =
		useContext(CategoriesContext);

	// Filter transactions based on timeframe
	const filteredTransactions = useMemo(() => {
		return transactions.filter((t) => {
			// Only include expenses
			if (!t.operation.isExpense()) return false;
			const tDate = new Date(t.date);
			if (timeframe === "month") {
				return (
					tDate.getMonth() === selectedDate.getMonth() &&
					tDate.getFullYear() === selectedDate.getFullYear()
				);
			} else if (timeframe === "year") {
				return tDate.getFullYear() === selectedDate.getFullYear();
			} else if (timeframe === "custom") {
				if (!customRange.from || !customRange.to) return true;
				const from = new Date(customRange.from);
				const to = new Date(customRange.to);
				// Set to end of day for inclusive filtering
				to.setHours(23, 59, 59, 999);
				return tDate >= from && tDate <= to;
			}
			return true;
		});
	}, [transactions, timeframe, selectedDate, customRange]);
	// Process data for chart and list
	const { chartData, totalExpense } = useMemo(() => {
		const dataMap = new Map<string, number>();
		let total = 0;
		filteredTransactions.forEach((t) => {
			// Iterate over items to get category data
			const amount = t.originAccounts.reduce(
				(sum, s) => sum + s.amount.value,
				0,
			);
			if (t.items && t.items.length > 0) {
				const totalItemValue = t.items.reduce(
					(sum, item) => sum + item.price.value * item.quantity,
					0,
				);
				t.items.forEach((item) => {
					const itemCategory = getCategoryByID(item.categoryId)?.name;
					const itemSubcategory = getSubCategoryByID(
						item.subcategoryId,
					)?.name;
					// Proportional amount based on item value relative to total
					const itemProportion =
						totalItemValue > 0
							? (item.price.value * item.quantity) /
								totalItemValue
							: 1 / t.items.length;
					const itemAmount = amount * itemProportion;
					const key = selectedCategory
						? itemCategory?.value === selectedCategory
							? itemSubcategory
							: null
						: itemCategory;
					if (key) {
						dataMap.set(
							key.value,
							(dataMap.get(key.value) || 0) + itemAmount,
						);
						total += itemAmount;
					}
				});
			}
		});
		const data = Array.from(dataMap.entries())
			.map(([name, value]) => ({
				name,
				value,
				percentage: total > 0 ? (value / total) * 100 : 0,
			}))
			.sort((a, b) => b.value - a.value);
		return {
			chartData: data,
			totalExpense: total,
		};
	}, [filteredTransactions, selectedCategory]);
	// Navigation handlers
	const navigateDate = (direction: -1 | 1) => {
		const newDate = new Date(selectedDate);
		if (timeframe === "month") {
			newDate.setMonth(newDate.getMonth() + direction);
		} else {
			newDate.setFullYear(newDate.getFullYear() + direction);
		}
		setSelectedDate(newDate);
	};
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount);
	};
	const CustomTooltip = ({ active, payload }: any) => {
		if (active && payload && payload.length) {
			const data = payload[0].payload;
			return (
				<div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg text-sm">
					<p className="font-medium text-gray-900">{data.name}</p>
					<p className="text-gray-500">
						{formatCurrency(data.value)} (
						{data.percentage.toFixed(1)}%)
					</p>
				</div>
			);
		}
		return null;
	};
	return (
		<div className="space-y-6">
			{/* Header / Controls */}
			<div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
				<div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
					{(["month", "year", "custom"] as const).map((mode) => (
						<button
							key={mode}
							onClick={() => setTimeframe(mode)}
							className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${timeframe === mode ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
						>
							{mode.charAt(0).toUpperCase() + mode.slice(1)}
						</button>
					))}
				</div>

				{timeframe !== "custom" ? (
					<div className="flex items-center gap-4">
						<button
							onClick={() => navigateDate(-1)}
							className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
						>
							<ChevronLeft size={20} />
						</button>
						<span className="text-base font-semibold text-gray-900 min-w-35 text-center">
							{selectedDate.toLocaleDateString("en-US", {
								month:
									timeframe === "month" ? "long" : undefined,
								year: "numeric",
							})}
						</span>
						<button
							onClick={() => navigateDate(1)}
							className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
						>
							<ChevronRight size={20} />
						</button>
					</div>
				) : (
					<div className="flex items-center gap-2">
						<input
							type="date"
							value={customRange.from}
							onChange={(e) =>
								setCustomRange((prev) => ({
									...prev,
									from: e.target.value,
								}))
							}
							className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
						/>
						<span className="text-gray-400">-</span>
						<input
							type="date"
							value={customRange.to}
							onChange={(e) =>
								setCustomRange((prev) => ({
									...prev,
									to: e.target.value,
								}))
							}
							className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
						/>
					</div>
				)}
			</div>

			{/* Main Content */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Chart Section */}
				<motion.div
					layout
					className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm min-h-100 flex flex-col"
				>
					<div className="flex items-center justify-between mb-6">
						<h3 className="text-lg font-semibold text-gray-900">
							{selectedCategory ? (
								<button
									onClick={() => setSelectedCategory(null)}
									className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-colors"
								>
									<ArrowLeft size={18} />
									{selectedCategory} Breakdown
								</button>
							) : (
								"Expense Distribution"
							)}
						</h3>
						<div className="text-right">
							<p className="text-sm text-gray-500">
								Total Expenses
							</p>
							<p className="text-xl font-bold text-gray-900">
								{formatCurrency(totalExpense)}
							</p>
						</div>
					</div>

					{chartData.length > 0 ? (
						<div className="flex-1">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={chartData}
										cx="50%"
										cy="50%"
										innerRadius={80}
										outerRadius={120}
										paddingAngle={2}
										dataKey="value"
									>
										{chartData.map((entry, index) => (
											<Cell
												key={`cell-${entry.name}`}
												fill={
													COLORS[
														index % COLORS.length
													]
												}
												strokeWidth={0}
											/>
										))}
									</Pie>
									<Tooltip content={<CustomTooltip />} />
								</PieChart>
							</ResponsiveContainer>
						</div>
					) : (
						<div className="flex-1 flex flex-col items-center justify-center text-gray-400">
							<PieChartIcon
								size={48}
								className="mb-4 opacity-20"
							/>
							<p>No expenses found for this period</p>
						</div>
					)}
				</motion.div>

				{/* List Section */}
				<motion.div
					layout
					className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
				>
					<div className="p-4 border-b border-gray-100 bg-gray-50/50">
						<h3 className="font-semibold text-gray-900">
							{selectedCategory ? "Subcategories" : "Categories"}
						</h3>
					</div>

					<div className="overflow-y-auto max-h-125 p-2">
						<AnimatePresence mode="wait">
							{chartData.length > 0 ? (
								<motion.div
									key={selectedCategory || "root"}
									initial={{
										opacity: 0,
										x: 20,
									}}
									animate={{
										opacity: 1,
										x: 0,
									}}
									exit={{
										opacity: 0,
										x: -20,
									}}
									transition={{
										duration: 0.2,
									}}
									className="space-y-1"
								>
									{chartData.map((item, index) => (
										<button
											key={item.name}
											onClick={() =>
												!selectedCategory &&
												setSelectedCategory(item.name)
											}
											disabled={!!selectedCategory}
											className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${selectedCategory ? "cursor-default" : "hover:bg-gray-50 cursor-pointer group"}`}
										>
											<div className="flex items-center gap-3">
												<div
													className="w-3 h-3 rounded-full shrink-0"
													style={{
														backgroundColor:
															COLORS[
																index %
																	COLORS.length
															],
													}}
												/>
												<div className="text-left">
													<p
														className={`font-medium text-gray-900 ${!selectedCategory && "group-hover:text-indigo-600 transition-colors"}`}
													>
														{item.name}
													</p>
													<div className="flex items-center gap-2">
														<div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
															<div
																className="h-full rounded-full"
																style={{
																	width: `${item.percentage}%`,
																	backgroundColor:
																		COLORS[
																			index %
																				COLORS.length
																		],
																}}
															/>
														</div>
														<span className="text-xs text-gray-500 font-medium">
															{item.percentage.toFixed(
																1,
															)}
															%
														</span>
													</div>
												</div>
											</div>
											<div className="text-right">
												<p className="font-semibold text-gray-900">
													{formatCurrency(item.value)}
												</p>
												{!selectedCategory && (
													<span className="text-xs text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
														View details →
													</span>
												)}
											</div>
										</button>
									))}
								</motion.div>
							) : (
								<div className="p-8 text-center text-gray-500">
									No data available
								</div>
							)}
						</AnimatePresence>
					</div>
				</motion.div>
			</div>
		</div>
	);
}
