import {
	useCategorySelect,
	useSubCategorySelect,
} from "apps/obsidian-plugin/components/Select";
import { CategoryID } from "contexts/Categories/domain";
import {
	Item,
	ItemName,
	ItemType,
	ProductItem,
	ServiceItem,
} from "contexts/Items/domain";
import { ItemID } from "contexts/Items/domain/item-id.valueobject";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { Transaction } from "contexts/Transactions/domain";
import {
	BarChart2,
	Calendar,
	Edit,
	MapPin,
	Package,
	Tag,
	Trash2,
	Users,
	Wrench,
} from "lucide-react";
import React, { useContext, useState } from "react";
import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	CategoriesContext,
	ItemsContext,
	TransactionsContext,
} from "../Contexts";

interface ItemsListProps {
	items: Item[];
	statusBarAddText: (val: string | DocumentFragment) => void;
	onItemUpdate: () => void;
}

const ConfirmDeleteModal = ({
	open,
	onConfirm,
	onCancel,
	count,
}: {
	open: boolean;
	onConfirm: () => void;
	onCancel: () => void;
	count: number;
}) => {
	if (!open) return null;
	return (
		<div
			className="modal-backdrop"
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				width: "100vw",
				height: "100vh",
				background: "rgba(0,0,0,0.3)",
				zIndex: 1000,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<div
				className="modal-content"
				style={{
					background: "var(--color-background-secondary, #222)",
					color: "var(--color-text, #fff)",
					padding: 24,
					borderRadius: 8,
					minWidth: 300,
					boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
				}}
			>
				<h3 style={{ margin: 0, marginBottom: 12 }}>
					Delete {count} item{count !== 1 ? "s" : ""}?
				</h3>
				<p style={{ margin: 0, marginBottom: 20 }}>
					Are you sure you want to delete the selected item
					{count !== 1 ? "s" : ""}? This action cannot be undone.
				</p>
				<div
					style={{
						display: "flex",
						gap: 12,
						justifyContent: "flex-end",
					}}
				>
					<button
						onClick={onCancel}
						style={{
							padding: "6px 16px",
							borderRadius: 4,
							border: "none",
							background: "var(--color-gray-light, #888)",
							color: "#fff",
							cursor: "pointer",
						}}
					>
						Cancel
					</button>
					<button
						onClick={onConfirm}
						style={{
							padding: "6px 16px",
							borderRadius: 4,
							border: "none",
							background: "var(--color-red, #d32f2f)",
							color: "#fff",
							cursor: "pointer",
						}}
					>
						Delete
					</button>
				</div>
			</div>
		</div>
	);
};

function groupTransactionsByBrandStore(transactions: Transaction[]) {
	const result: Record<
		string,
		Record<string, Array<{ date: string; amount: number }>>
	> = {};
	for (const tx of transactions) {
		const brand = tx.brand?.value || "No Brand";
		const store = tx.store?.value || "No Store";
		if (!result[brand]) result[brand] = {};
		if (!result[brand][store]) result[brand][store] = [];
		result[brand][store].push({
			date:
				tx.date.value instanceof Date
					? tx.date.value.toISOString().slice(0, 10)
					: tx.date.value,
			amount: tx.fromAmount.value,
		});
	}
	return result;
}

const EditItemModal = ({
	open,
	item,
	onClose,
	onSave,
}: {
	open: boolean;
	item: Item | null;
	onClose: () => void;
	onSave: (updatedItem: Item) => void;
}) => {
	const [name, setName] = useState("");
	const [category, setCategory] = useState("");
	const [subCategory, setSubCategory] = useState("");

	const { CategorySelect, category: selectedCategory } = useCategorySelect({
		initialValueID: category,
	});
	const { SubCategorySelect, subCategory: selectedSubCategory } =
		useSubCategorySelect({
			category: selectedCategory,
			initialValueID: subCategory,
		});

	React.useEffect(() => {
		if (item) {
			setName(item.name.value);
			setCategory(item.category.value);
			setSubCategory(item.subCategory.value);
		}
	}, [item]);

	if (!open || !item) return null;

	const handleSave = () => {
		if (name.trim()) {
			const updatedItem = item.copy();
			updatedItem.updateName(new ItemName(name.trim()));
			if (selectedCategory) {
				updatedItem.updateCategory(selectedCategory.id);
			}
			if (selectedSubCategory) {
				updatedItem.updateSubCategory(selectedSubCategory.id);
			}
			onSave(updatedItem);
			onClose();
		}
	};

	return (
		<div
			className="modal-backdrop"
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				width: "100vw",
				height: "100vh",
				background: "rgba(0,0,0,0.3)",
				zIndex: 1000,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<div
				className="modal-content"
				style={{
					background: "var(--color-background-secondary, #222)",
					color: "var(--color-text, #fff)",
					padding: 24,
					borderRadius: 8,
					minWidth: 400,
					maxWidth: 500,
					boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
				}}
			>
				<h3 style={{ margin: 0, marginBottom: 20 }}>Edit Item</h3>

				<div style={{ marginBottom: 16 }}>
					<label
						style={{
							display: "block",
							marginBottom: 8,
							fontSize: 14,
						}}
					>
						Name
					</label>
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						style={{
							width: "100%",
							padding: "8px 12px",
							borderRadius: 4,
							border: "1px solid var(--color-gray-light, #555)",
							background: "var(--color-background-primary, #333)",
							color: "var(--color-text, #fff)",
							fontSize: 14,
						}}
						placeholder="Item name"
					/>
				</div>

				<div style={{ marginBottom: 16 }}>{CategorySelect}</div>

				<div style={{ marginBottom: 24 }}>{SubCategorySelect}</div>

				<div
					style={{
						display: "flex",
						gap: 12,
						justifyContent: "flex-end",
					}}
				>
					<button
						onClick={onClose}
						style={{
							padding: "8px 16px",
							borderRadius: 4,
							border: "none",
							background: "var(--color-gray-light, #888)",
							color: "#fff",
							cursor: "pointer",
							fontSize: 14,
						}}
					>
						Cancel
					</button>
					<button
						onClick={handleSave}
						disabled={!name.trim()}
						style={{
							padding: "8px 16px",
							borderRadius: 4,
							border: "none",
							background: name.trim()
								? "var(--color-blue, #1976d2)"
								: "var(--color-gray, #666)",
							color: "#fff",
							cursor: name.trim() ? "pointer" : "not-allowed",
							fontSize: 14,
						}}
					>
						Save
					</button>
				</div>
			</div>
		</div>
	);
};

export const ItemsList = ({
	items,
	statusBarAddText,
	onItemUpdate,
}: ItemsListProps) => {
	const { useCases } = useContext(ItemsContext);
	const { getCategoryByID, getSubCategoryByID } =
		useContext(CategoriesContext);
	const { transactions } = useContext(TransactionsContext);
	const [selectedItems, setSelectedItems] = useState<Item[]>([]);
	const [showConfirm, setShowConfirm] = useState(false);
	const [expanded, setExpanded] = useState<{ [itemId: string]: boolean }>({});
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<Item | null>(null);

	// Debug logging
	console.log("ItemsList render:", {
		itemsCount: items.length,
		items: items.map((item) => ({
			id: item.id.value,
			name: item.name.value,
		})),
		selectedItemsCount: selectedItems.length,
		transactionsCount: transactions.length,
	});

	const handleItemSelect = (item: Item) => {
		const isSelected = selectedItems.some(
			(selected) => selected.id.value === item.id.value
		);
		if (isSelected) {
			setSelectedItems(
				selectedItems.filter(
					(selected) => selected.id.value !== item.id.value
				)
			);
		} else {
			setSelectedItems([...selectedItems, item]);
		}
	};

	const handleDeleteSelected = () => {
		setShowConfirm(true);
	};

	const confirmDelete = async () => {
		setShowConfirm(false);
		try {
			for (const item of selectedItems) {
				await useCases.deleteItem.execute(new ItemID(item.id.value));
			}
			setSelectedItems([]);
			onItemUpdate();
			statusBarAddText(`Deleted ${selectedItems.length} item(s)`);
		} catch (error) {
			console.error("Error deleting items", error);
			statusBarAddText("Error deleting items");
		}
	};

	const cancelDelete = () => setShowConfirm(false);

	const handleEditItem = (item: Item, e: React.MouseEvent) => {
		e.stopPropagation();
		setEditingItem(item);
		setEditModalOpen(true);
	};

	const handleSaveEdit = async (updatedItem: Item) => {
		try {
			await useCases.updateRegularItem.execute(updatedItem);
			onItemUpdate();
			statusBarAddText(`Updated item: ${updatedItem.name.value}`);
		} catch (error) {
			console.error("Error updating item", error);
			statusBarAddText("Error updating item");
		}
	};

	const closeEditModal = () => {
		setEditModalOpen(false);
		setEditingItem(null);
	};

	const getItemTypeIcon = (type: ItemType) => {
		switch (type) {
			case ItemType.PRODUCT:
				return <Package size={16} />;
			case ItemType.SERVICE:
				return <Wrench size={16} />;
			default:
				return <Package size={16} />;
		}
	};

	const getItemTypeLabel = (type: ItemType) => {
		switch (type) {
			case ItemType.PRODUCT:
				return "Product";
			case ItemType.SERVICE:
				return "Service";
			default:
				return "Unknown";
		}
	};

	const getItemTypeColor = (type: ItemType) => {
		switch (type) {
			case ItemType.PRODUCT:
				return "var(--color-blue)";
			case ItemType.SERVICE:
				return "var(--color-green)";
			default:
				return "var(--color-gray)";
		}
	};

	const isProductItem = (item: Item): item is ProductItem => {
		return item.type === ItemType.PRODUCT;
	};

	const isServiceItem = (item: Item): item is ServiceItem => {
		return item.type === ItemType.SERVICE;
	};

	const getCategoryName = (id: string) => {
		if (!id || id.trim() === "") return "";
		const cat = getCategoryByID
			? getCategoryByID(new CategoryID(id))
			: undefined;
		return cat ? cat.name.value : id;
	};

	const getSubCategoryName = (id: string) => {
		if (!id || id.trim() === "") return "";
		const sub = getSubCategoryByID
			? getSubCategoryByID(new SubCategoryID(id))
			: undefined;
		return sub ? sub.name.value : id;
	};

	const toggleExpand = (itemId: string) => {
		setExpanded((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
	};

	if (items.length === 0) {
		return (
			<div className="items-list-empty">
				<div className="empty-state">
					<Package
						size={48}
						style={{
							color: "var(--color-gray)",
							marginBottom: "16px",
						}}
					/>
					<h3>No items found</h3>
					<p>
						Items are automatically created when you record
						transactions. They represent the products and services
						you buy or sell.
					</p>
					<p
						style={{
							fontSize: "12px",
							marginTop: "8px",
							opacity: 0.7,
						}}
					>
						To create items, go to the Accounting section and create
						a transaction. The items will appear here automatically.
					</p>
					<p
						style={{
							fontSize: "12px",
							marginTop: "4px",
							opacity: 0.7,
						}}
					>
						Note: This is different from Scheduled Items, which are
						recurring transactions.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="items-list">
			<ConfirmDeleteModal
				open={showConfirm}
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
				count={selectedItems.length}
			/>
			<EditItemModal
				open={editModalOpen}
				item={editingItem}
				onClose={closeEditModal}
				onSave={handleSaveEdit}
			/>
			{selectedItems.length > 0 && (
				<div className="items-actions">
					<div className="selection-info">
						<span className="selection-count">
							{selectedItems.length} item(s) selected
						</span>
					</div>
					<button
						onClick={handleDeleteSelected}
						className="delete-button"
						title={`Delete ${selectedItems.length} selected item(s)`}
					>
						<Trash2 size={16} />
						<span>Delete Selected</span>
					</button>
				</div>
			)}

			<div className="items-container">
				{items.map((item) => {
					const isSelected = selectedItems.some(
						(selected) => selected.id.value === item.id.value
					);
					const isExpanded = expanded[item.id.value];

					// Filter and group transactions for this item
					const itemTransactions = transactions.filter(
						(tx) => tx.itemID && tx.itemID.value === item.id.value
					);
					const grouped =
						groupTransactionsByBrandStore(itemTransactions);

					return (
						<div
							key={item.id.value}
							className={`item-card ${
								isSelected ? "selected" : ""
							}`}
							onClick={() => handleItemSelect(item)}
						>
							<div className="item-selection-indicator">
								<div
									className={`selection-circle ${
										isSelected ? "selected" : ""
									}`}
								>
									{isSelected && (
										<div className="selection-checkmark">
											✓
										</div>
									)}
								</div>
							</div>

							<div className="item-content">
								<div className="item-header">
									<div className="item-header-left">
										<div
											className="item-type-badge"
											style={{
												color: getItemTypeColor(
													item.type
												),
											}}
										>
											{getItemTypeIcon(item.type)}
											<span>
												{getItemTypeLabel(item.type)}
											</span>
										</div>
										<div className="item-date">
											<Calendar size={12} />
											<span>
												{new Date(
													item.updatedAt.value
												).toLocaleDateString()}
											</span>
										</div>
									</div>
									<div className="item-header-actions">
										<button
											type="button"
											className="edit-item-btn"
											onClick={(e) =>
												handleEditItem(item, e)
											}
											style={{
												background: "none",
												border: "none",
												cursor: "pointer",
												color: "var(--color-blue)",
												display: "flex",
												alignItems: "center",
												gap: 4,
												marginRight: 8,
											}}
											title="Edit item"
										>
											<Edit size={16} />
										</button>
										<button
											type="button"
											className="show-history-btn"
											onClick={(e) => {
												e.stopPropagation();
												toggleExpand(item.id.value);
											}}
											style={{
												background: "none",
												border: "none",
												cursor: "pointer",
												color: "var(--color-cyan)",
												display: "flex",
												alignItems: "center",
												gap: 4,
											}}
										>
											<BarChart2 size={16} />
											<span style={{ fontSize: 12 }}>
												{isExpanded ? "Hide" : "Show"}{" "}
												Price History
											</span>
										</button>
									</div>
								</div>

								<div className="item-name">
									{item.name.value}
								</div>

								<div className="item-meta">
									<div className="item-category">
										<Tag size={12} />
										<span>
											{getCategoryName(
												item.category.value
											)}
										</span>
									</div>
									<div className="item-subcategory">
										<Tag size={12} />
										<span>
											{getSubCategoryName(
												item.subCategory.value
											)}
										</span>
									</div>
								</div>

								<div className="item-details">
									{isProductItem(item) &&
										item.brands.length > 0 && (
											<div className="item-detail-item">
												<Package size={12} />
												<span>
													{item.brands.length} brand
													{item.brands.length !== 1
														? "s"
														: ""}
												</span>
											</div>
										)}

									{isProductItem(item) &&
										item.stores.length > 0 && (
											<div className="item-detail-item">
												<MapPin size={12} />
												<span>
													{item.stores.length} store
													{item.stores.length !== 1
														? "s"
														: ""}
												</span>
											</div>
										)}

									{isServiceItem(item) &&
										item.providers.length > 0 && (
											<div className="item-detail-item">
												<Users size={12} />
												<span>
													{item.providers.length}{" "}
													provider
													{item.providers.length !== 1
														? "s"
														: ""}
												</span>
											</div>
										)}
								</div>

								{/* Price History Chart Section */}
								{isExpanded && (
									<div
										style={{
											marginTop: 24,
											background:
												"var(--color-background-secondary, #222)",
											borderRadius: 8,
											padding: 16,
										}}
									>
										{Object.keys(grouped).length === 0 ? (
											<div
												style={{
													color: "var(--color-gray)",
													fontSize: 14,
												}}
											>
												No price history found for this
												item.
											</div>
										) : (
											Object.entries(grouped).map(
												([brand, stores]: [
													string,
													Record<
														string,
														Array<{
															date: string;
															amount: number;
														}>
													>
												]) => (
													<div
														key={brand}
														style={{
															marginBottom: 32,
														}}
													>
														<h4
															style={{
																margin: 0,
																marginBottom: 8,
																color: "var(--color-blue)",
															}}
														>
															Brand: {brand}
														</h4>
														<ResponsiveContainer
															width="100%"
															height={250}
														>
															<LineChart>
																<CartesianGrid strokeDasharray="3 3" />
																<XAxis dataKey="date" />
																<YAxis />
																<Tooltip />
																<Legend />
																{Object.entries(
																	stores
																).map(
																	(
																		[
																			store,
																			data,
																		],
																		idx
																	) => (
																		<Line
																			type="monotone"
																			dataKey="amount"
																			data={
																				data
																			}
																			name={
																				store
																			}
																			stroke={`hsl(${
																				(idx *
																					60) %
																				360
																			}, 70%, 50%)`}
																			key={
																				store
																			}
																			connectNulls
																		/>
																	)
																)}
															</LineChart>
														</ResponsiveContainer>
													</div>
												)
											)
										)}
									</div>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};
