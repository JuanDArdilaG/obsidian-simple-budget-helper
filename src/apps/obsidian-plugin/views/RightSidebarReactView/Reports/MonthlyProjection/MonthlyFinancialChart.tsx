import { motion } from "framer-motion";
import {
	CartesianGrid,
	DotProps,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { TransactionAmount } from "../../../../../../contexts/Transactions/domain";

export interface MonthlyDataPoint {
	month: string;
	accumulated: number;
	balance: number;
	expense: number;
	income: number;
}

interface MonthlyFinancialChartProps {
	data: MonthlyDataPoint[];
	selectedMonth?: string;
}

// Custom Tooltip Component
function CustomTooltip({ active, payload, label }: any) {
	if (!active || !payload || !payload.length) return null;

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
			className="bg-white! border! border-gray-200! rounded-lg! shadow-lg! p-4! min-w-[280px]!"
		>
			<h4 className="font-semibold! text-gray-900! mb-3!">{label}</h4>
			<div className="space-y-2! text-sm!">
				{payload.map((entry) => (
					<div
						key={entry.value}
						className="flex! justify-between! items-center!"
					>
						<span
							style={{
								color: entry.color,
							}}
						>
							{entry.name}:
						</span>
						<span
							className="font-semibold!"
							style={{
								color: entry.color,
							}}
						>
							{new TransactionAmount(
								entry.value as number,
							).toString()}
						</span>
					</div>
				))}
			</div>
		</motion.div>
	);
}
// Custom Dot Component
function CustomDot(props: DotProps) {
	const { cx, cy, stroke } = props;
	return (
		<circle
			cx={cx}
			cy={cy}
			r={4}
			fill="white"
			stroke={stroke}
			strokeWidth={2}
		/>
	);
}

export function MonthlyFinancialChart({
	data,
}: Readonly<MonthlyFinancialChartProps>) {
	return (
		<div className="bg-white! rounded-lg! border! border-gray-200! p-6!">
			<h2 className="text-xl! font-bold! text-gray-900! mb-6!">
				Monthly Financial Summary
			</h2>

			{/* Chart Container */}
			<div
				className="w-full!"
				style={{
					height: 400,
				}}
			>
				<ResponsiveContainer width="100%" height="100%">
					<LineChart
						data={data}
						margin={{
							top: 20,
							right: 30,
							left: 20,
							bottom: 20,
						}}
					>
						<CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />

						<XAxis
							dataKey="month"
							tick={{
								fill: "#6b7280",
								fontSize: 12,
							}}
							tickLine={{
								stroke: "#e5e7eb",
							}}
							axisLine={{
								stroke: "#e5e7eb",
							}}
						/>

						<YAxis
							tick={{
								fill: "#6b7280",
								fontSize: 12,
							}}
							tickLine={{
								stroke: "#e5e7eb",
							}}
							axisLine={{
								stroke: "#e5e7eb",
							}}
							tickFormatter={(value) =>
								new TransactionAmount(
									value as number,
								).toString()
							}
						/>

						<Tooltip content={<CustomTooltip />} />

						<Legend
							wrapperStyle={{
								paddingTop: "20px",
							}}
							iconType="circle"
							iconSize={12}
						/>

						<Line
							type="monotone"
							dataKey="accumulated"
							name="Accumulated"
							stroke="#6366f1"
							strokeWidth={2}
							dot={<CustomDot />}
							activeDot={{
								r: 6,
							}}
						/>

						<Line
							type="monotone"
							dataKey="balance"
							name="Balance"
							stroke="#3b82f6"
							strokeWidth={2}
							dot={<CustomDot />}
							activeDot={{
								r: 6,
							}}
						/>

						<Line
							type="monotone"
							dataKey="expense"
							name="Expense"
							stroke="#ef4444"
							strokeWidth={2}
							dot={<CustomDot />}
							activeDot={{
								r: 6,
							}}
						/>

						<Line
							type="monotone"
							dataKey="income"
							name="Income"
							stroke="#10b981"
							strokeWidth={2}
							dot={<CustomDot />}
							activeDot={{
								r: 6,
							}}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
