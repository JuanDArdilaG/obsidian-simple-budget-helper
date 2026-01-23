import { motion } from "framer-motion";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";

interface SummaryCardProps {
	title: string;
	amount: number;
	trend: number;
	delay?: number;
	isCurrency?: boolean;
}
export function SummaryCard({
	title,
	amount,
	trend,
	delay = 0,
	isCurrency = true,
}: Readonly<SummaryCardProps>) {
	const isPositive = trend > 0;
	const isNeutral = trend === 0;

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(value);
	};

	const getTrendStyles = () => {
		if (isPositive) {
			return {
				style: "bg-emerald-50 text-emerald-700",
				icon: <TrendingUp className="w-3 h-3 mr-1" />,
			};
		}
		if (isNeutral) {
			return {
				style: "bg-gray-100 text-gray-600",
				icon: <Minus className="w-3 h-3 mr-1" />,
			};
		}
		return {
			style: "bg-rose-50 text-rose-700",
			icon: <TrendingDown className="w-3 h-3 mr-1" />,
		};
	};

	const { style, icon } = getTrendStyles();

	return (
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
				duration: 0.4,
				delay,
				ease: "easeOut",
			}}
			className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-full"
		>
			<div className="flex justify-between items-start mb-4">
				<h3 className="text-sm! font-medium! uppercase tracking-wide">
					{title}
				</h3>
				<div
					className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${style}`}
				>
					{icon}
					{Math.abs(trend).toFixed(2)}%
				</div>
			</div>

			<div>
				<div className="text-3xl font-bold text-gray-900 tracking-tight">
					{isCurrency ? formatCurrency(amount) : amount}
				</div>
				<p className="text-xs text-gray-400 mt-1">vs last month</p>
			</div>
		</motion.div>
	);
}
