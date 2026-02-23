import { motion } from "framer-motion";
import { Calendar, Pencil, Tag, Trash2, TrendingDown } from "lucide-react";
import { useContext } from "react";
import { PhysicalAsset } from "../../../../../contexts/PhysicalAssets/domain/physical-asset.entity";
import { TransactionAmount } from "../../../../../contexts/Transactions/domain";
import { CategoriesContext } from "../Contexts";

interface PhysicalAssetRowProps {
	asset: PhysicalAsset;
	onEdit: (asset: PhysicalAsset) => void;
	onDelete: (id: string) => void;
}

export function PhysicalAssetRow({
	asset,
	onEdit,
	onDelete,
}: Readonly<PhysicalAssetRowProps>) {
	const { getCategoryByID, getSubCategoryByID } =
		useContext(CategoriesContext);
	// Calculate depreciation percentage
	const depreciationPercentage =
		asset.purchasePrice.value > 0
			? Math.max(
					0,
					Math.min(
						100,
						((asset.purchasePrice.value -
							(asset.currentValue?.value || 0)) /
							asset.purchasePrice.value) *
							100,
					),
				)
			: 0;
	return (
		<motion.div
			layout
			initial={{
				opacity: 0,
				y: 10,
			}}
			animate={{
				opacity: 1,
				y: 0,
			}}
			exit={{
				opacity: 0,
				height: 0,
			}}
			className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow group"
		>
			<div className="flex items-start justify-between gap-4">
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1">
						<h3 className="font-semibold text-gray-900 truncate">
							{asset.name}
						</h3>
						<span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600 border border-gray-200">
							{asset.usefulLifeInYears}y life
						</span>
					</div>

					<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mb-3">
						<div className="flex items-center gap-1.5">
							<Tag size={14} />
							<span>
								{getCategoryByID(asset.category)?.name ||
									asset.category}
								{` • ${getSubCategoryByID(asset.subcategory)?.name || asset.subcategory}`}
							</span>
						</div>
						<div className="flex items-center gap-1.5">
							<Calendar size={14} />
							<span>
								Purchased{" "}
								{new Date(
									asset.purchaseDate,
								).toLocaleDateString()}
							</span>
						</div>
					</div>

					<div className="flex items-center gap-6">
						<div>
							<p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
								Original Value
							</p>
							<p className="text-sm font-semibold text-gray-700">
								{new TransactionAmount(
									asset.purchasePrice.value,
								).toString()}
							</p>
						</div>
						<div>
							<p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
								Current Value
							</p>
							<p className="text-lg font-bold text-indigo-600">
								{new TransactionAmount(
									asset.currentValue?.value || 0,
								).toString()}
							</p>
						</div>
						<div className="hidden sm:block">
							<p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
								Depreciation
							</p>
							<div className="flex items-center gap-1 text-rose-600">
								<TrendingDown size={14} />
								<span className="text-sm font-medium">
									{depreciationPercentage.toFixed(1)}%
								</span>
							</div>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
					<button
						onClick={() => onEdit(asset)}
						className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
						aria-label="Edit asset"
					>
						<Pencil size={18} />
					</button>
					<button
						onClick={() => onDelete(asset.id)}
						className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
						aria-label="Delete asset"
					>
						<Trash2 size={18} />
					</button>
				</div>
			</div>

			{/* Depreciation Progress Bar */}
			<div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
				<div
					className="h-full bg-indigo-500 rounded-full transition-all duration-500"
					style={{
						width: `${100 - depreciationPercentage}%`,
					}}
				/>
			</div>
		</motion.div>
	);
}
