import { Item } from "contexts/Items/domain";
import { Search } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { ItemsContext } from "../Contexts";
import { RightSidebarReactTab } from "../RightSidebarReactTab";
import { ItemsList } from "./ItemsList";

export const ItemsSection = ({
	statusBarAddText,
}: {
	statusBarAddText: (val: string | DocumentFragment) => void;
}) => {
	const { useCases, updateItems } = useContext(ItemsContext);
	const [items, setItems] = useState<Item[]>([]);
	const [filteredItems, setFilteredItems] = useState<Item[]>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		loadItems();
	}, []);

	useEffect(() => {
		filterItems();
	}, [items, searchTerm]);

	const loadItems = async () => {
		try {
			setIsLoading(true);
			console.log("Loading items...");
			const result = await useCases.getAllRegularItems.execute();
			console.log("Items loaded:", result.items.length, "items");
			setItems(result.items);
		} catch (error) {
			console.error("Error loading items", error);
			// Set empty array to prevent infinite loading state
			setItems([]);
		} finally {
			setIsLoading(false);
		}
	};

	const filterItems = () => {
		if (!searchTerm.trim()) {
			setFilteredItems(items);
			return;
		}

		const filtered = items.filter((item) =>
			item.name.value.toLowerCase().includes(searchTerm.toLowerCase())
		);
		setFilteredItems(filtered);
	};

	const handleRefresh = async () => {
		await loadItems();
		updateItems();
	};

	return (
		<RightSidebarReactTab
			title="Items"
			handleRefresh={handleRefresh}
			isCreating={false}
		>
			<div className="items-section">
				<div className="search-container">
					<div className="search-input-wrapper">
						<Search size={16} className="search-icon" />
						<input
							type="text"
							placeholder="Search items by name..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="search-input"
						/>
						{searchTerm && (
							<div className="search-results-count">
								{filteredItems.length} of {items.length} items
							</div>
						)}
					</div>
				</div>

				{isLoading ? (
					<div className="loading">
						<div className="loading-spinner"></div>
						<span>Loading items...</span>
					</div>
				) : (
					<ItemsList
						items={filteredItems}
						statusBarAddText={statusBarAddText}
						onItemUpdate={loadItems}
					/>
				)}
			</div>
		</RightSidebarReactTab>
	);
};
