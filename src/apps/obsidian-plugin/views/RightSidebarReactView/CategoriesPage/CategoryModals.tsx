import { motion } from "framer-motion";
import { AlertTriangle, FolderOpen, Tag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { CategoriesWithSubcategoriesMap } from "../../../../../contexts/Categories/application/get-all-categories-with-subcategories.usecase";
import { Category } from "../../../../../contexts/Categories/domain";
import { Subcategory } from "../../../../../contexts/Subcategories/domain";
import { Transaction } from "../../../../../contexts/Transactions/domain";

// Add/Edit Category Modal
interface CategoryModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (name: string) => void;
	category?: Category | null;
}

export function CategoryModal({
	isOpen,
	onClose,
	onSave,
	category,
}: Readonly<CategoryModalProps>) {
	const [name, setName] = useState("");

	useEffect(() => {
		if (isOpen) {
			setName(category?.name.value || "");
		}
	}, [isOpen, category]);

	const handleSubmit = () => {
		if (!name.trim()) {
			alert("Please enter a category name");
			return;
		}
		onSave(name.trim());
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
				className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-100"
			>
				<div className="flex justify-between items-center mb-6">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-indigo-50 rounded-lg">
							<FolderOpen className="w-6 h-6 text-indigo-600" />
						</div>
						<h2 className="text-xl font-bold text-gray-900">
							{category ? "Edit Category" : "Add Category"}
						</h2>
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600"
					>
						<X size={24} />
					</button>
				</div>

				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Category Name *
						</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. Food, Transport, Shopping"
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
							autoFocus
						/>
					</div>
				</div>

				<div className="flex gap-3 mt-6">
					<button
						onClick={onClose}
						className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
					>
						Cancel
					</button>
					<button
						onClick={handleSubmit}
						className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
					>
						{category ? "Save Changes" : "Add Category"}
					</button>
				</div>
			</motion.div>
		</div>
	);
}
// Add/Edit Subcategory Modal
interface SubcategoryModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (categoryId: string, name: string) => void;
	categoriesMap: CategoriesWithSubcategoriesMap;
	subcategory?: Subcategory | null;
	preselectedCategoryId?: string | null;
}

export function SubcategoryModal({
	isOpen,
	onClose,
	onSave,
	categoriesMap,
	subcategory,
	preselectedCategoryId,
}: Readonly<SubcategoryModalProps>) {
	const [name, setName] = useState("");
	const [categoryId, setCategoryId] = useState("");
	useEffect(() => {
		if (isOpen) {
			setName(subcategory?.name.value || "");
			setCategoryId(
				subcategory?.categoryId.toString() ||
					preselectedCategoryId ||
					"",
			);
		}
	}, [isOpen, subcategory, preselectedCategoryId]);
	const handleSubmit = () => {
		if (!name.trim()) {
			alert("Please enter a subcategory name");
			return;
		}
		if (!categoryId) {
			alert("Please select a category");
			return;
		}
		onSave(categoryId, name.trim());
		onClose();
	};
	if (!isOpen) return null;
	const categoriesArray = Array.from(categoriesMap.values()).map(
		(item) => item.category,
	);
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
				className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-100"
			>
				<div className="flex justify-between items-center mb-6">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-indigo-50 rounded-lg">
							<Tag className="w-6 h-6 text-indigo-600" />
						</div>
						<h2 className="text-xl font-bold text-gray-900">
							{subcategory
								? "Edit Subcategory"
								: "Add Subcategory"}
						</h2>
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600"
					>
						<X size={24} />
					</button>
				</div>

				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Parent Category *
						</label>
						<select
							value={categoryId}
							onChange={(e) => setCategoryId(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
						>
							<option value="">Select a category</option>
							{categoriesArray.map((cat) => (
								<option key={cat.id} value={cat.id}>
									{cat.name}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Subcategory Name *
						</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. Groceries, Gas, Clothing"
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
							autoFocus
						/>
					</div>
				</div>

				<div className="flex gap-3 mt-6">
					<button
						onClick={onClose}
						className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
					>
						Cancel
					</button>
					<button
						onClick={handleSubmit}
						className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
					>
						{subcategory ? "Save Changes" : "Add Subcategory"}
					</button>
				</div>
			</motion.div>
		</div>
	);
}
// Delete Category Modal with Migration
interface DeleteCategoryModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (newCategoryId: string, newSubcategoryId: string) => void;
	category: Category | null;
	categoriesMap: CategoriesWithSubcategoriesMap;
	affectedTransactions: Transaction[];
}
export function DeleteCategoryModal({
	isOpen,
	onClose,
	onConfirm,
	category,
	categoriesMap,
	affectedTransactions,
}: Readonly<DeleteCategoryModalProps>) {
	const [newCategoryId, setNewCategoryId] = useState("");
	const [newSubcategoryId, setNewSubcategoryId] = useState("");
	const availableCategories = Array.from(categoriesMap.values())
		.map((item) => item.category)
		.filter((c) => c.id !== category?.id);
	const selectedCategoryData = categoriesMap.get(newCategoryId);
	const selectedCategorySubcategories = selectedCategoryData
		? Array.from(selectedCategoryData.subcategories.values())
		: [];
	useEffect(() => {
		if (isOpen) {
			setNewCategoryId("");
			setNewSubcategoryId("");
		}
	}, [isOpen]);

	const handleConfirm = () => {
		if (affectedTransactions.length > 0) {
			if (!newCategoryId || !newSubcategoryId) {
				alert(
					"Please select both a category and subcategory to migrate all transactions",
				);
				return;
			}
		}
		onConfirm(newCategoryId, newSubcategoryId);
		onClose();
	};

	if (!isOpen || !category) return null;

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
				className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-gray-100"
			>
				<div className="flex justify-between items-center mb-6">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-rose-50 rounded-lg">
							<AlertTriangle className="w-6 h-6 text-rose-600" />
						</div>
						<h2 className="text-xl font-bold text-gray-900">
							Delete Category
						</h2>
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600"
					>
						<X size={24} />
					</button>
				</div>

				<div className="space-y-4">
					<div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
						<p className="text-sm text-amber-800">
							<strong>Warning:</strong> You are about to delete
							the category "<strong>{category.name}</strong>".
						</p>
					</div>

					{affectedTransactions.length > 0 ? (
						<>
							<div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
								<h3 className="font-semibold text-gray-900 mb-2">
									Affected Transactions (
									{affectedTransactions.length})
								</h3>
								<div className="max-h-32 overflow-y-auto space-y-1">
									{affectedTransactions
										.slice(0, 5)
										.map((transaction) => (
											<div
												key={transaction.id}
												className="text-sm text-gray-600 flex justify-between"
											>
												<span className="truncate">
													{transaction.name}
												</span>
												<span className="font-medium">
													$
													{transaction.originAmount.toString()}
												</span>
											</div>
										))}
									{affectedTransactions.length > 5 && (
										<p className="text-xs text-gray-500 pt-1">
											...and{" "}
											{affectedTransactions.length - 5}{" "}
											more
										</p>
									)}
								</div>
							</div>

							<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
								<p className="text-xs text-blue-800">
									<strong>Note:</strong> All transactions
									require both a category and subcategory.
									Please select where to migrate these
									transactions.
								</p>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Migrate to Category *
								</label>
								<select
									value={newCategoryId}
									onChange={(e) => {
										setNewCategoryId(e.target.value);
										setNewSubcategoryId("");
									}}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
								>
									<option value="">Select a category</option>
									{availableCategories.map((cat) => (
										<option key={cat.id} value={cat.id}>
											{cat.name}
										</option>
									))}
								</select>
							</div>

							{selectedCategorySubcategories.length > 0 && (
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Migrate to Subcategory *
									</label>
									<select
										value={newSubcategoryId}
										onChange={(e) =>
											setNewSubcategoryId(e.target.value)
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
									>
										<option value="">
											Select a subcategory
										</option>
										{selectedCategorySubcategories.map(
											(sub) => (
												<option
													key={sub.id}
													value={sub.id}
												>
													{sub.name}
												</option>
											),
										)}
									</select>
								</div>
							)}

							{newCategoryId &&
								selectedCategorySubcategories.length === 0 && (
									<div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
										<p className="text-xs text-amber-800">
											The selected category has no
											subcategories. Please choose a
											different category or create a
											subcategory first.
										</p>
									</div>
								)}
						</>
					) : (
						<p className="text-sm text-gray-600">
							This category has no associated transactions and can
							be safely deleted.
						</p>
					)}
				</div>

				<div className="flex gap-3 mt-6">
					<button
						onClick={onClose}
						className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
					>
						Cancel
					</button>
					<button
						onClick={handleConfirm}
						disabled={
							affectedTransactions.length > 0 &&
							(!newCategoryId || !newSubcategoryId)
						}
						className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Delete Category
					</button>
				</div>
			</motion.div>
		</div>
	);
}
// Delete Subcategory Modal with Migration
interface DeleteSubcategoryModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (newCategoryId: string, newSubcategoryId: string) => void;
	subcategory: Subcategory | null;
	categoriesMap: CategoriesWithSubcategoriesMap;
	affectedTransactions: Transaction[];
}
export function DeleteSubcategoryModal({
	isOpen,
	onClose,
	onConfirm,
	subcategory,
	categoriesMap,
	affectedTransactions,
}: DeleteSubcategoryModalProps) {
	const [newCategoryId, setNewCategoryId] = useState("");
	const [newSubcategoryId, setNewSubcategoryId] = useState("");
	const categoriesArray = Array.from(categoriesMap.values()).map(
		(item) => item.category,
	);
	const selectedCategoryData = categoriesMap.get(newCategoryId);
	const availableSubcategories = selectedCategoryData
		? Array.from(selectedCategoryData.subcategories.values()).filter(
				(s) => s.id !== subcategory?.id,
			)
		: [];
	useEffect(() => {
		if (isOpen && subcategory) {
			setNewCategoryId(subcategory.categoryId.toString());
			setNewSubcategoryId("");
		}
	}, [isOpen, subcategory]);
	const handleConfirm = () => {
		if (affectedTransactions.length > 0) {
			if (!newCategoryId || !newSubcategoryId) {
				alert(
					"Please select both a category and subcategory to migrate all transactions",
				);
				return;
			}
		}
		onConfirm(newCategoryId, newSubcategoryId);
		onClose();
	};
	if (!isOpen || !subcategory) return null;
	const parentCategoryData = categoriesMap.get(
		subcategory.categoryId.toString(),
	);
	const parentCategory = parentCategoryData?.category;
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
				className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-gray-100"
			>
				<div className="flex justify-between items-center mb-6">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-rose-50 rounded-lg">
							<AlertTriangle className="w-6 h-6 text-rose-600" />
						</div>
						<h2 className="text-xl font-bold text-gray-900">
							Delete Subcategory
						</h2>
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600"
					>
						<X size={24} />
					</button>
				</div>

				<div className="space-y-4">
					<div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
						<p className="text-sm text-amber-800">
							<strong>Warning:</strong> You are about to delete
							the subcategory "<strong>{subcategory.name}</strong>
							" from "{parentCategory?.name}
							".
						</p>
					</div>

					{affectedTransactions.length > 0 ? (
						<>
							<div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
								<h3 className="font-semibold text-gray-900 mb-2">
									Affected Transactions (
									{affectedTransactions.length})
								</h3>
								<div className="max-h-32 overflow-y-auto space-y-1">
									{affectedTransactions
										.slice(0, 5)
										.map((transaction) => (
											<div
												key={transaction.id}
												className="text-sm text-gray-600 flex justify-between"
											>
												<span className="truncate">
													{transaction.name}
												</span>
												<span className="font-medium">
													$
													{transaction.originAmount.toString()}
												</span>
											</div>
										))}
									{affectedTransactions.length > 5 && (
										<p className="text-xs text-gray-500 pt-1">
											...and{" "}
											{affectedTransactions.length - 5}{" "}
											more
										</p>
									)}
								</div>
							</div>

							<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
								<p className="text-xs text-blue-800">
									<strong>Note:</strong> All transactions
									require both a category and subcategory.
									Please select where to migrate these
									transactions.
								</p>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Migrate to Category *
								</label>
								<select
									value={newCategoryId}
									onChange={(e) => {
										setNewCategoryId(e.target.value);
										setNewSubcategoryId("");
									}}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
								>
									<option value="">Select a category</option>
									{categoriesArray.map((cat) => (
										<option key={cat.id} value={cat.id}>
											{cat.name}
										</option>
									))}
								</select>
							</div>

							{availableSubcategories.length > 0 && (
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Migrate to Subcategory *
									</label>
									<select
										value={newSubcategoryId}
										onChange={(e) =>
											setNewSubcategoryId(e.target.value)
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
									>
										<option value="">
											Select a subcategory
										</option>
										{availableSubcategories.map((sub) => (
											<option key={sub.id} value={sub.id}>
												{sub.name}
											</option>
										))}
									</select>
								</div>
							)}

							{newCategoryId &&
								availableSubcategories.length === 0 && (
									<div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
										<p className="text-xs text-amber-800">
											The selected category has no other
											subcategories. Please choose a
											different category or create a
											subcategory first.
										</p>
									</div>
								)}
						</>
					) : (
						<p className="text-sm text-gray-600">
							This subcategory has no associated transactions and
							can be safely deleted.
						</p>
					)}
				</div>

				<div className="flex gap-3 mt-6">
					<button
						onClick={onClose}
						className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
					>
						Cancel
					</button>
					<button
						onClick={handleConfirm}
						disabled={
							affectedTransactions.length > 0 &&
							(!newCategoryId || !newSubcategoryId)
						}
						className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Delete Subcategory
					</button>
				</div>
			</motion.div>
		</div>
	);
}
