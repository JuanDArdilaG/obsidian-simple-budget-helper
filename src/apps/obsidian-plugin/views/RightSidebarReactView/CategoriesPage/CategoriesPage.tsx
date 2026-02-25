import { motion } from "framer-motion";
import {
	ChevronRight,
	FolderOpen,
	Pencil,
	Plus,
	Search,
	Tag,
	Trash2,
} from "lucide-react";
import { useContext, useMemo, useState } from "react";
import {
	Category,
	CategoryName,
} from "../../../../../contexts/Categories/domain";
import { Nanoid } from "../../../../../contexts/Shared/domain";
import {
	Subcategory,
	SubcategoryName,
} from "../../../../../contexts/Subcategories/domain";
import { LoadingSpinner } from "../../../components/LoadingSpinner";
import { CategoriesContext, TransactionsContext } from "../Contexts";
import {
	CategoryModal,
	DeleteCategoryModal,
	DeleteSubcategoryModal,
	SubcategoryModal,
} from "./CategoryModals";

export function CategoriesPage() {
	const {
		isLoading,
		categoriesWithSubcategories: categoriesMap,
		updateCategoriesWithSubcategories,
		useCases: {
			createCategory,
			createSubCategory,
			updateCategory,
			updateSubCategory,
			deleteCategory,
			deleteSubCategory,
		},
	} = useContext(CategoriesContext);
	const { transactions } = useContext(TransactionsContext);
	const [searchQuery, setSearchQuery] = useState("");
	const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
		new Set(),
	);
	// Modal states
	const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
	const [isAddSubcategoryModalOpen, setIsAddSubcategoryModalOpen] =
		useState(false);
	const [editingCategory, setEditingCategory] = useState<Category | null>(
		null,
	);
	const [editingSubcategory, setEditingSubcategory] =
		useState<Subcategory | null>(null);
	const [deletingCategory, setDeletingCategory] = useState<Category | null>(
		null,
	);
	const [deletingSubcategory, setDeletingSubcategory] =
		useState<Subcategory | null>(null);
	const [selectedCategoryForNewSub, setSelectedCategoryForNewSub] = useState<
		string | null
	>(null);

	const toggleCategory = (categoryId: string) => {
		const newExpanded = new Set(expandedCategories);
		if (newExpanded.has(categoryId)) {
			newExpanded.delete(categoryId);
		} else {
			newExpanded.add(categoryId);
		}
		setExpandedCategories(newExpanded);
	};

	const categoriesArray = useMemo(() => {
		return Array.from(categoriesMap.entries()).map(
			([id, { category, subcategories }]) => ({
				category,
				subcategories: Array.from(subcategories.values()),
			}),
		);
	}, [categoriesMap]);

	const filteredCategories = useMemo(() => {
		if (!searchQuery) return categoriesArray;
		return categoriesArray
			.map((item) => ({
				...item,
				subcategories: item.subcategories.filter((sub) =>
					sub.name.toLowerCase().includes(searchQuery.toLowerCase()),
				),
			}))
			.filter(
				(item) =>
					item.category.name
						.toLowerCase()
						.includes(searchQuery.toLowerCase()) ||
					item.subcategories.length > 0,
			);
	}, [categoriesArray, searchQuery]);
	const getTransactionCount = (
		categoryId: string,
		subcategoryId?: string,
	) => {
		if (subcategoryId) {
			return transactions.filter(
				(t) =>
					t.category.value === categoryId &&
					t.subcategory.value === subcategoryId,
			).length;
		}
		return transactions.filter((t) => t.category.value === categoryId)
			.length;
	};
	const getAffectedTransactions = (
		categoryId: string,
		subcategoryId?: string,
	) => {
		if (subcategoryId) {
			return transactions.filter(
				(t) =>
					t.category.value === categoryId &&
					t.subcategory.value === subcategoryId,
			);
		}
		return transactions.filter((t) => t.category.value === categoryId);
	};
	// Category handlers
	const handleAddCategory = async (name: string) => {
		const newCategory = Category.create(new CategoryName(name));
		await createCategory.execute(newCategory);
		updateCategoriesWithSubcategories();
	};

	const handleEditCategory = async (name: string) => {
		if (!editingCategory) return;
		// Create new category with updated name
		const updatedCategory = Category.fromPrimitives({
			id: editingCategory.id,
			name,
			updatedAt: new Date().toISOString(),
		});

		await updateCategory.execute(updatedCategory);
		updateCategoriesWithSubcategories();

		setEditingCategory(null);
	};

	const handleDeleteCategory = async (
		newCategoryId: string,
		newSubcategoryId: string,
	) => {
		if (!deletingCategory) return;
		await deleteCategory.execute(
			new Nanoid(deletingCategory.id),
			newCategoryId ? new Nanoid(newCategoryId) : undefined,
			newSubcategoryId ? new Nanoid(newSubcategoryId) : undefined,
		);
		updateCategoriesWithSubcategories();

		setDeletingCategory(null);
	};
	// Subcategory handlers
	const handleAddSubcategory = async (categoryId: string, name: string) => {
		const newSubcategory = Subcategory.create(
			new Nanoid(categoryId),
			new SubcategoryName(name),
		);
		await createSubCategory.execute(newSubcategory);
		updateCategoriesWithSubcategories();
		setSelectedCategoryForNewSub(null);
	};

	const handleEditSubcategory = async (categoryId: string, name: string) => {
		if (!editingSubcategory) return;
		await updateSubCategory.execute(
			Subcategory.fromPrimitives({
				id: editingSubcategory.id,
				category: categoryId,
				name,
				updatedAt: new Date().toISOString(),
			}),
		);
		updateCategoriesWithSubcategories();
		setEditingSubcategory(null);
	};
	const handleDeleteSubcategory = async (
		newCategoryId: string,
		newSubcategoryId: string,
	) => {
		if (!deletingSubcategory) return;
		await deleteSubCategory.execute(
			deletingSubcategory.categoryId,
			deletingSubcategory.nanoid,
			newCategoryId ? new Nanoid(newCategoryId) : undefined,
			newSubcategoryId ? new Nanoid(newSubcategoryId) : undefined,
		);
		updateCategoriesWithSubcategories();
		setDeletingSubcategory(null);
	};

	if (isLoading) {
		return <LoadingSpinner />;
	}

	return (
		<div className="min-h-screen! bg-gray-50! font-sans!">
			{/* Header */}
			<header className="bg-white! border-b! border-gray-200! sticky! top-0! z-20!">
				<div className="max-w-7xl! mx-auto! px-4! sm:px-6! lg:px-8! h-16! flex! items-center! justify-between! gap-4!">
					<div className="flex! items-center! gap-3!">
						<div className="p-2! bg-indigo-50! rounded-lg!">
							<FolderOpen className="w-5! h-5! text-indigo-600!" />
						</div>
						<h1 className="text-xl! font-bold! text-gray-900!">
							Categories
						</h1>
					</div>

					<div className="flex-1! max-w-lg! relative!">
						<Search
							className="absolute! left-3! top-1/2! -translate-y-1/2! text-gray-400!"
							size={18}
						/>
						<input
							type="text"
							placeholder="Search categories and subcategories..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full! pl-10! pr-4! py-2! border! border-gray-300! rounded-lg! focus:ring-2! focus:ring-indigo-500! focus:border-indigo-500! bg-gray-50! focus:bg-white! transition-colors!"
						/>
					</div>

					<button
						onClick={() => setIsAddCategoryModalOpen(true)}
						className="flex! items-center! gap-2! px-4! py-2! bg-indigo-600! text-white! rounded-lg! hover:bg-indigo-700! transition-colors! shadow-sm! font-medium!"
					>
						<Plus size={18} />
						<span className="hidden! sm:inline!">Add Category</span>
					</button>
				</div>
			</header>

			{/* Content */}
			<main className="max-w-7xl! mx-auto! px-4! sm:px-6! lg:px-8! py-6!">
				<div className="mb-4! text-sm! text-gray-600!">
					{filteredCategories.length} categor
					{filteredCategories.length !== 1 ? "ies" : "y"}
				</div>

				<div className="space-y-3!">
					{filteredCategories.map((item, index) => (
						<motion.div
							key={item.category.id}
							initial={{
								opacity: 0,
								y: 20,
							}}
							animate={{
								opacity: 1,
								y: 0,
							}}
							transition={{
								delay: index * 0.05,
							}}
							className="bg-white! rounded-lg! border! border-gray-200! overflow-hidden!"
						>
							{/* Category Header */}
							<div className="p-4! flex! items-center! justify-between! hover:bg-gray-50! transition-colors!">
								<div className="flex! items-center! gap-3! flex-1!">
									<button
										onClick={() =>
											toggleCategory(item.category.id)
										}
										className="p-1! hover:bg-gray-100! rounded! transition-colors!"
									>
										<motion.div
											animate={{
												rotate: expandedCategories.has(
													item.category.id,
												)
													? 90
													: 0,
											}}
											transition={{
												duration: 0.2,
											}}
										>
											<ChevronRight
												size={18}
												className="text-gray-500!"
											/>
										</motion.div>
									</button>
								<div className="p-2! bg-indigo-50! rounded-lg!">
									<FolderOpen className="w-5! h-5! text-indigo-600!" />
								</div>
								<div className="flex-1!">
									<h3 className="font-semibold! text-gray-900!">
											{item.category.name}
										</h3>
									<p className="text-sm! text-gray-500!">
											{item.subcategories.length}{" "}
											subcategor
											{item.subcategories.length !== 1
												? "ies"
												: "y"}{" "}
											•{" "}
											{getTransactionCount(
												item.category.id,
											)}{" "}
											transaction
											{getTransactionCount(
												item.category.id,
											) !== 1
												? "s"
												: ""}
										</p>
									</div>
								</div>

							<div className="flex! items-center! gap-2!">
									<button
										onClick={() => {
											setSelectedCategoryForNewSub(
												item.category.id,
											);
											setIsAddSubcategoryModalOpen(true);
										}}
									className="p-2! text-gray-600! hover:text-indigo-600! hover:bg-indigo-50! rounded-lg! transition-all!"
										title="Add subcategory"
									>
										<Plus size={16} />
									</button>
									<button
										onClick={() =>
											setEditingCategory(item.category)
										}
									className="p-2! text-gray-600! hover:text-indigo-600! hover:bg-indigo-50! rounded-lg! transition-all!"
									title="Edit category"
								>
									<Pencil size={16} />
								</button>
								<button
									onClick={() =>
										setDeletingCategory(item.category)
									}
									className="p-2! text-gray-600! hover:text-rose-600! hover:bg-rose-50! rounded-lg! transition-all!"
										title="Delete category"
									>
										<Trash2 size={16} />
									</button>
								</div>
							</div>

							{/* Subcategories */}
							{expandedCategories.has(item.category.id) && (
								<motion.div
									initial={{
										height: 0,
										opacity: 0,
									}}
									animate={{
										height: "auto",
										opacity: 1,
									}}
									exit={{
										height: 0,
										opacity: 0,
									}}
									transition={{
										duration: 0.2,
									}}
								className="border-t! border-gray-200! bg-gray-50!"
							>
								{item.subcategories.length > 0 ? (
									<div className="divide-y! divide-gray-200!">
											{item.subcategories.map(
												(subcategory) => (
													<div
														key={subcategory.id}
													className="p-4! pl-16! flex! items-center! justify-between! hover:bg-gray-100! transition-colors!"
												>
													<div className="flex! items-center! gap-3! flex-1!">
														<div className="p-1.5! bg-white! rounded! border! border-gray-200!">
															<Tag className="w-4! h-4! text-gray-600!" />
														</div>
														<div>
															<h4 className="font-medium! text-gray-900!">
																	{
																		subcategory.name
																	}
																</h4>
															<p className="text-sm! text-gray-500!">
																	{getTransactionCount(
																		item
																			.category
																			.id,
																		subcategory.id,
																	)}{" "}
																	transaction
																	{getTransactionCount(
																		item
																			.category
																			.id,
																		subcategory.id,
																	) !== 1
																		? "s"
																		: ""}
																</p>
															</div>
														</div>

													<div className="flex! items-center! gap-2!">
															<button
																onClick={() =>
																	setEditingSubcategory(
																		subcategory,
																	)
																}
															className="p-2! text-gray-600! hover:text-indigo-600! hover:bg-indigo-50! rounded-lg! transition-all!"
															title="Edit subcategory"
														>
															<Pencil
																size={14}
															/>
														</button>
														<button
															onClick={() =>
																setDeletingSubcategory(
																	subcategory,
																)
															}
															className="p-2! text-gray-600! hover:text-rose-600! hover:bg-rose-50! rounded-lg! transition-all!"
																title="Delete subcategory"
															>
																<Trash2
																	size={14}
																/>
															</button>
														</div>
													</div>
												),
											)}
										</div>
									) : (
										<div className="p-8! text-center! text-gray-500!">
											<Tag
												size={32}
												className="mx-auto! mb-2! text-gray-300!"
											/>
											<p className="text-sm!">
												No subcategories yet
											</p>
											<button
												onClick={() => {
													setSelectedCategoryForNewSub(
														item.category.id,
													);
													setIsAddSubcategoryModalOpen(
														true,
													);
												}}
												className="mt-2! text-sm! text-indigo-600! hover:text-indigo-700! font-medium!"
											>
												Add one now
											</button>
										</div>
									)}
								</motion.div>
							)}
						</motion.div>
					))}
				</div>

				{filteredCategories.length === 0 && (
					<div className="flex! flex-col! items-center! justify-center! h-64! text-gray-500!">
						<FolderOpen size={48} className="mb-4! text-gray-300!" />
						<p className="text-lg! font-medium!">
							No categories found
						</p>
						<p className="text-sm!">
							{searchQuery
								? "Try adjusting your search query"
								: "Create your first category"}
						</p>
					</div>
				)}
			</main>

			{/* Modals */}
			<CategoryModal
				isOpen={isAddCategoryModalOpen}
				onClose={() => setIsAddCategoryModalOpen(false)}
				onSave={handleAddCategory}
			/>

			<CategoryModal
				isOpen={!!editingCategory}
				onClose={() => setEditingCategory(null)}
				onSave={handleEditCategory}
				category={editingCategory}
			/>

			<SubcategoryModal
				isOpen={isAddSubcategoryModalOpen}
				onClose={() => {
					setIsAddSubcategoryModalOpen(false);
					setSelectedCategoryForNewSub(null);
				}}
				onSave={handleAddSubcategory}
				categoriesMap={categoriesMap}
				preselectedCategoryId={selectedCategoryForNewSub}
			/>

			<SubcategoryModal
				isOpen={!!editingSubcategory}
				onClose={() => setEditingSubcategory(null)}
				onSave={handleEditSubcategory}
				categoriesMap={categoriesMap}
				subcategory={editingSubcategory}
			/>

			<DeleteCategoryModal
				isOpen={!!deletingCategory}
				onClose={() => setDeletingCategory(null)}
				onConfirm={handleDeleteCategory}
				category={deletingCategory}
				categoriesMap={categoriesMap}
				affectedTransactions={
					deletingCategory
						? getAffectedTransactions(deletingCategory.id)
						: []
				}
			/>

			<DeleteSubcategoryModal
				isOpen={!!deletingSubcategory}
				onClose={() => setDeletingSubcategory(null)}
				onConfirm={handleDeleteSubcategory}
				subcategory={deletingSubcategory}
				categoriesMap={categoriesMap}
				affectedTransactions={
					deletingSubcategory
						? getAffectedTransactions(
								deletingSubcategory.categoryId.toString(),
								deletingSubcategory.id,
							)
						: []
				}
			/>
		</div>
	);
}
