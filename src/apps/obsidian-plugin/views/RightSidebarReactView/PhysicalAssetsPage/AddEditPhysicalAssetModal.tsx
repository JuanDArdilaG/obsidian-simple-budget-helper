import { StringValueObject } from "@juandardilag/value-objects";
import { motion } from "framer-motion";
import { Calendar, Clock, DollarSign, Save, Tag, X } from "lucide-react";
import React, { useContext, useEffect, useState } from "react";
import { PhysicalAsset } from "../../../../../contexts/PhysicalAssets/domain/physical-asset.entity";
import { Nanoid } from "../../../../../contexts/Shared/domain";
import { TransactionAmount } from "../../../../../contexts/Transactions/domain";
import { CategoriesContext } from "../Contexts";

interface AddEditPhysicalAssetModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (asset: PhysicalAsset) => void;
	editAsset?: PhysicalAsset | null;
}

export function AddEditPhysicalAssetModal({
	isOpen,
	onClose,
	onSave,
	editAsset,
}: Readonly<AddEditPhysicalAssetModalProps>) {
	const { categoriesMap, subCategoriesMap } = useContext(CategoriesContext);
	const [name, setName] = useState("");
	const [category, setCategory] = useState("");
	const [subcategory, setSubcategory] = useState("");
	const [purchaseDate, setPurchaseDate] = useState(
		new Date().toISOString().split("T")[0],
	);
	const [purchasePrice, setPurchasePrice] = useState<TransactionAmount>(
		TransactionAmount.zero(),
	);
	const [usefulLife, setUsefulLife] = useState("5");

	useEffect(() => {
		if (editAsset) {
			setName(editAsset.name.value);
			setCategory(editAsset.category.value);
			setSubcategory(editAsset.subcategory.value);
			setPurchaseDate(editAsset.purchaseDate.toISOString().split("T")[0]);
			setPurchasePrice(editAsset.purchasePrice);
			setUsefulLife(editAsset.usefulLifeInYears.toString());
		} else {
			resetForm();
		}
	}, [editAsset, isOpen]);

	const resetForm = () => {
		setName("");
		setCategory("");
		setSubcategory("");
		setPurchaseDate(new Date().toISOString().split("T")[0]);
		setPurchasePrice(TransactionAmount.zero());
		setUsefulLife("5");
	};

	const handleSubmit = (e: React.SubmitEvent) => {
		e.preventDefault();
		if (!name || !category || !purchasePrice || !usefulLife) return;
		const newAsset = new PhysicalAsset(
			editAsset ? editAsset.nanoid : Nanoid.generate(),
			new StringValueObject(name),
			new Nanoid(category),
			new Nanoid(subcategory),
			Number.parseFloat(usefulLife),
			new Date(purchaseDate),
			purchasePrice,
		);

		onSave(newAsset);
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
			<motion.div
				initial={{
					opacity: 0,
					scale: 0.95,
				}}
				animate={{
					opacity: 1,
					scale: 1,
				}}
				exit={{
					opacity: 0,
					scale: 0.95,
				}}
				className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
			>
				<div className="flex justify-between items-center p-6 border-b border-gray-100">
					<h2 className="text-xl font-bold text-gray-900">
						{editAsset ? "Edit Asset" : "Add New Asset"}
					</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition-colors"
					>
						<X size={24} />
					</button>
				</div>

				<form
					onSubmit={handleSubmit}
					className="p-6 space-y-4 overflow-y-auto"
				>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Asset Name
						</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. MacBook Pro M1"
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
							required
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Category
							</label>
							<div className="relative">
								<Tag
									size={16}
									className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
								/>
								<select
									value={category}
									onChange={(e) => {
										setCategory(e.target.value);
										setSubcategory("");
									}}
									className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
									required
								>
									<option value="">Select Category</option>
									{[...categoriesMap.values()].map((cat) => (
										<option key={cat.id} value={cat.id}>
											{cat.name}
										</option>
									))}
								</select>
							</div>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Subcategory
							</label>
							<select
								value={subcategory}
								onChange={(e) => setSubcategory(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
								disabled={!category}
							>
								<option value="">Select Subcategory</option>
								{category &&
									[...subCategoriesMap.values()]
										.filter(
											(sub) =>
												sub.categoryId.value ===
												category,
										)
										.map((sub) => (
											<option key={sub.id} value={sub.id}>
												{sub.name}
											</option>
										))}
							</select>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Purchase Date
							</label>
							<div className="relative">
								<Calendar
									size={16}
									className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
								/>
								<input
									type="date"
									value={purchaseDate}
									onChange={(e) =>
										setPurchaseDate(e.target.value)
									}
									className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
									required
								/>
							</div>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Purchase Price
							</label>
							<div className="relative">
								<DollarSign
									size={16}
									className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
								/>
								<input
									type="text"
									value={purchasePrice.toString()}
									onChange={(e) =>
										setPurchasePrice(
											TransactionAmount.fromString(
												e.target.value,
												{ withSign: false },
											),
										)
									}
									placeholder="0.00"
									className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
									required
								/>
							</div>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Useful Life (Years)
						</label>
						<div className="relative">
							<Clock
								size={16}
								className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
							/>
							<input
								type="number"
								value={usefulLife}
								onChange={(e) => setUsefulLife(e.target.value)}
								placeholder="e.g. 5"
								min="0.1"
								step="0.1"
								className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
								required
							/>
						</div>
						<p className="mt-1 text-xs text-gray-500">
							Used to calculate depreciation over time.
						</p>
					</div>

					<div className="pt-4 flex gap-3">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
						>
							<Save size={18} />
							{editAsset ? "Update Asset" : "Save Asset"}
						</button>
					</div>
				</form>
			</motion.div>
		</div>
	);
}
