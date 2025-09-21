import React, { useState } from "react";
import { Item, ItemName } from "../../../../../contexts/Items/domain";
import {
	useCategorySelect,
	useSubCategorySelect,
} from "../../../components/Select";

export const EditItemModal = ({
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
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							style={{
								width: "100%",
								padding: "8px 12px",
								borderRadius: 4,
								border: "1px solid var(--color-gray-light, #555)",
								background:
									"var(--color-background-primary, #333)",
								color: "var(--color-text, #fff)",
								fontSize: 14,
							}}
							placeholder="Item name"
						/>
						Name
					</label>
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
