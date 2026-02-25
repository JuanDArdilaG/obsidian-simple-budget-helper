import { memo } from "react";

interface DonutChartProps {
	assets: number;
	liabilities: number;
}

const DonutChart = memo(function DonutChart({
	assets,
	liabilities,
}: Readonly<DonutChartProps>) {
	const total = assets + liabilities;
	const assetsPercent = total > 0 ? (assets / total) * 100 : 50;
	const liabilitiesPercent = total > 0 ? (liabilities / total) * 100 : 50;
	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: 0,
		}).format(value);
	};
	return (
		<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
			<h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
				Ratio Analysis
			</h3>

			<div className="flex-1 flex flex-col justify-center items-center gap-6">
				{/* Simple bar visualization */}
				<div className="w-full max-w-xs">
					<div className="flex h-8 rounded-lg overflow-hidden border border-gray-200">
						<div
							className="bg-emerald-500 flex items-center justify-center text-white text-xs font-semibold"
							style={{
								width: `${assetsPercent}%`,
							}}
						>
							{assetsPercent > 15 &&
								`${Math.round(assetsPercent)}%`}
						</div>
						<div
							className="bg-rose-500 flex items-center justify-center text-white text-xs font-semibold"
							style={{
								width: `${liabilitiesPercent}%`,
							}}
						>
							{liabilitiesPercent > 15 &&
								`${Math.round(liabilitiesPercent)}%`}
						</div>
					</div>
				</div>

				{/* Legend */}
				<div className="flex flex-col gap-3 w-full max-w-xs">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 rounded-full bg-emerald-500" />
							<span className="text-sm font-medium text-gray-700">
								Assets
							</span>
						</div>
						<span className="text-sm font-semibold text-gray-900">
							{formatCurrency(assets)}
						</span>
					</div>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 rounded-full bg-rose-500" />
							<span className="text-sm font-medium text-gray-700">
								Liabilities
							</span>
						</div>
						<span className="text-sm font-semibold text-gray-900">
							{formatCurrency(liabilities)}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
});

export { DonutChart };
