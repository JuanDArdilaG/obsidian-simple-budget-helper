import { AnimatePresence } from "framer-motion";
import { DollarSign, Package, Plus, Search, TrendingDown } from "lucide-react";
import { useContext, useEffect, useMemo, useState } from "react";
import { PhysicalAsset } from "../../../../../contexts/PhysicalAssets/domain/physical-asset.entity";
import { TransactionAmount } from "../../../../../contexts/Transactions/domain";
import { LoadingSpinner } from "../../../components/LoadingSpinner";
import { TransactionsContext } from "../Contexts";
import { AddEditPhysicalAssetModal } from "./AddEditPhysicalAssetModal";
import { PhysicalAssetRow } from "./PhysicalAssetRow";

export function PhysicalAssetsPage() {
	const { physicalAssetsService } = useContext(TransactionsContext);
	const [assets, setAssets] = useState<PhysicalAsset[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [editingAsset, setEditingAsset] = useState<PhysicalAsset | null>(
		null,
	);

	// Load initial data
	useEffect(() => {
		const loadData = async () => {
			setIsLoading(true);
			physicalAssetsService
				.getAll()
				.then((assets) => {
					setAssets(assets);
				})
				.finally(() => {
					setIsLoading(false);
				});
		};
		loadData();
	}, []);

	const filteredAssets = useMemo(() => {
		return assets.filter(
			(asset) =>
				asset.name.value
					.toLowerCase()
					.includes(searchQuery.toLowerCase()) ||
				asset.category.value
					.toLowerCase()
					.includes(searchQuery.toLowerCase()),
		);
	}, [assets, searchQuery]);

	const stats = useMemo(() => {
		const totalPurchase = assets.reduce(
			(sum, a) => sum + a.purchasePrice.value,
			0,
		);
		const totalCurrent = assets.reduce(
			(sum, a) => sum + (a.currentValue?.value || 0),
			0,
		);
		const totalDepreciation = totalPurchase - totalCurrent;
		return {
			totalPurchase,
			totalCurrent,
			totalDepreciation,
		};
	}, [assets]);

	const handleAddAsset = (newAsset: PhysicalAsset) => {
		physicalAssetsService.create(newAsset).then(() => {
			setAssets((prev) => [...prev, newAsset]);
		});
	};

	const handleUpdateAsset = (updatedAsset: PhysicalAsset) => {
		if (!editingAsset) return;
		physicalAssetsService.update(updatedAsset).then(() => {
			setAssets((prev) =>
				prev.map((a) => (a.id === updatedAsset.id ? updatedAsset : a)),
			);
		});
		setEditingAsset(null);
	};

	const handleDeleteAsset = (id: string) => {
		if (confirm("Are you sure you want to delete this asset?")) {
			setAssets(assets.filter((a) => a.id !== id));
		}
	};

	if (isLoading) return <LoadingSpinner />;

	return (
		<div className="min-h-screen bg-gray-50 font-sans pb-20">
			{/* Header */}
			<header className="bg-white border-b border-gray-200 sticky top-0 z-20">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
					<div className="flex-1 max-w-lg relative">
						<Search
							className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
							size={18}
						/>
						<input
							type="text"
							placeholder="Search assets..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors"
						/>
					</div>

					<button
						onClick={() => setIsAddModalOpen(true)}
						className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
					>
						<Plus size={18} />
						<span className="hidden sm:inline">Add Asset</span>
					</button>
				</div>
			</header>

			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
						<div className="flex items-center gap-3 mb-2">
							<div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
								<Package size={20} />
							</div>
							<h3 className="text-sm font-medium text-gray-500">
								Total Purchase Value
							</h3>
						</div>
						<p className="text-2xl font-bold text-gray-900">
							{new TransactionAmount(
								stats.totalPurchase,
							).toString()}
						</p>
					</div>

					<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
						<div className="flex items-center gap-3 mb-2">
							<div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
								<DollarSign size={20} />
							</div>
							<h3 className="text-sm font-medium text-gray-500">
								Current Value
							</h3>
						</div>
						<p className="text-2xl font-bold text-gray-900">
							{new TransactionAmount(
								stats.totalCurrent,
							).toString()}
						</p>
					</div>

					<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
						<div className="flex items-center gap-3 mb-2">
							<div className="p-2 bg-rose-50 rounded-lg text-rose-600">
								<TrendingDown size={20} />
							</div>
							<h3 className="text-sm font-medium text-gray-500">
								Total Depreciation
							</h3>
						</div>
						<p className="text-2xl font-bold text-rose-600">
							-
							{new TransactionAmount(
								stats.totalDepreciation,
							).toString()}
						</p>
					</div>
				</div>

				{/* Assets List */}
				{filteredAssets.length > 0 ? (
					<div className="space-y-4">
						<div className="flex justify-between items-center mb-2">
							<h2 className="text-lg font-semibold text-gray-900">
								Your Assets
							</h2>
							<span className="text-sm text-gray-500">
								{filteredAssets.length} item
								{filteredAssets.length !== 1 && "s"}
							</span>
						</div>
						<AnimatePresence>
							{filteredAssets.map((asset) => (
								<PhysicalAssetRow
									key={asset.id}
									asset={asset}
									onEdit={setEditingAsset}
									onDelete={handleDeleteAsset}
								/>
							))}
						</AnimatePresence>
					</div>
				) : (
					<div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
						<Package size={48} className="mb-4 text-gray-300" />
						<p className="text-lg font-medium">No assets found</p>
						<p className="text-sm">
							{searchQuery
								? "Try adjusting your search"
								: "Add your first physical asset to track its value"}
						</p>
					</div>
				)}
			</main>

			{/* Add/Edit Modal */}
			<AddEditPhysicalAssetModal
				isOpen={isAddModalOpen || !!editingAsset}
				onClose={() => {
					setIsAddModalOpen(false);
					setEditingAsset(null);
				}}
				onSave={editingAsset ? handleUpdateAsset : handleAddAsset}
				editAsset={editingAsset}
			/>
		</div>
	);
}
