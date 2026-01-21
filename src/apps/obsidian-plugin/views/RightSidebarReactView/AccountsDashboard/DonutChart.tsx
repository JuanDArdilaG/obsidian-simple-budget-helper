import { motion } from "framer-motion";
import {
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
} from "recharts";

interface DonutChartProps {
	assets: number;
	liabilities: number;
}

const CustomTooltip = ({ active, payload, total }: any) => {
	if (active && payload?.length) {
		return (
			<div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg text-sm">
				<p className="font-medium text-gray-900">{payload[0].name}</p>
				<p className="text-gray-500">
					{new Intl.NumberFormat("en-US", {
						style: "currency",
						currency: "USD",
						minimumFractionDigits: 0,
					}).format(payload[0].value)}
				</p>
				<p className="text-xs text-gray-400 mt-1">
					{((payload[0].value / total) * 100).toFixed(2)}%
				</p>
			</div>
		);
	}
	return null;
};

export function DonutChart({ assets, liabilities }: Readonly<DonutChartProps>) {
	const data = [
		{
			name: "Assets",
			value: assets,
		},
		{
			name: "Liabilities",
			value: liabilities,
		},
	];
	const COLORS = ["#10b981", "#f43f5e"]; // Emerald-500, Rose-500

	return (
		<motion.div
			initial={{
				opacity: 0,
				scale: 0.95,
			}}
			animate={{
				opacity: 1,
				scale: 1,
			}}
			transition={{
				duration: 0.5,
				delay: 0.2,
			}}
			className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col"
		>
			<h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
				Ratio Analysis
			</h3>
			<div className="flex-1 min-h-[200px]">
				<ResponsiveContainer width="100%" height="100%">
					<PieChart>
						<Pie
							data={data}
							cx="50%"
							cy="50%"
							innerRadius={60}
							outerRadius={80}
							paddingAngle={5}
							dataKey="value"
							stroke="none"
						>
							{data.map((entry, index) => (
								<Cell
									key={`cell-${entry.name}`}
									fill={COLORS[index % COLORS.length]}
								/>
							))}
						</Pie>
						<Tooltip
							content={
								<CustomTooltip total={assets + liabilities} />
							}
							cursor={false}
						/>
						<Legend
							verticalAlign="bottom"
							height={36}
							iconType="circle"
							formatter={(value) => (
								<span className="text-sm text-gray-600 font-medium ml-1">
									{value}
								</span>
							)}
						/>
					</PieChart>
				</ResponsiveContainer>
			</div>
		</motion.div>
	);
}
