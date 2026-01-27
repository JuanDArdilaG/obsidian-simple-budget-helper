import { motion } from "framer-motion";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { useCallback, useMemo } from "react";

interface SummaryCardProps {
	title: string;
	amount: number;
	trend: number;
	delay?: number;
	isCurrency?: boolean;
	reductionIsPositive?: boolean;
}
export function SummaryCard({
	title,
	amount,
	trend,
	delay = 0,
	isCurrency = true,
	reductionIsPositive = false,
}: Readonly<SummaryCardProps>) {
	const isPositive = useMemo(() => trend > 0, [trend]);
	const isNeutral = useMemo(() => trend === 0, [trend]);

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(value);
	};

	const getTrendStyles = useCallback(() => {
		const positiveStyle = "bg-emerald-50 text-emerald-700";
		const negativeStyle = "bg-rose-50 text-rose-700";
		const positiveIcon = <TrendingUp className="w-3 h-3 mr-1" />;
		const negativeIcon = <TrendingDown className="w-3 h-3 mr-1" />;

		if (isPositive) {
			if (reductionIsPositive) {
				return {
					style: negativeStyle,
					icon: positiveIcon,
				};
			}
			return {
				style: positiveStyle,
				icon: positiveIcon,
			};
		}
		if (isNeutral) {
			return {
				style: "bg-gray-100 text-gray-600",
				icon: <Minus className="w-3 h-3 mr-1" />,
			};
		}
		if (reductionIsPositive) {
			return {
				style: positiveStyle,
				icon: negativeIcon,
			};
		}
		return {
			style: negativeStyle,
			icon: negativeIcon,
		};
	}, [isPositive, isNeutral]);

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
