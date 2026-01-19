import { CategoriesContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { Category, CategoryID, CategoryName } from "contexts/Categories/domain";
import { useContext, useEffect, useMemo, useState } from "react";
import { Select } from "./Select";

export const useCategorySelect = ({
	label,
	initialValueName,
	initialValueID,
	overrideCategoriesIDs,
	error,
}: {
	label?: string;
	initialValueName?: CategoryName;
	initialValueID?: string;
	overrideCategoriesIDs?: CategoryID[];
	error?: string;
}) => {
	const [categoryId, setCategoryId] = useState(initialValueID ?? "");
	const [category, setCategory] = useState<Category>();

	const { categories, getCategoryByID } = useContext(CategoriesContext);
	const categoriesList = useMemo(() => {
		if (!overrideCategoriesIDs) {
			// Use all categories, sorted by name
			const allCategories = (categories || [])
				.map((cat) => ({
					id: cat.id.value,
					name: cat.name.value,
				}))
				.sort((a, b) => a.name.localeCompare(b.name));

			// Remove duplicates by ID using Map
			const categoryMap = new Map<string, { id: string; name: string }>();
			allCategories.forEach((cat) => {
				categoryMap.set(cat.id, cat);
			});
			const uniqueCategories = Array.from(categoryMap.values());

			return uniqueCategories;
		} else {
			// Use only the specified category IDs
			const filteredCategories = overrideCategoriesIDs
				.map((catID) => {
					try {
						const cat = getCategoryByID(catID);
						return {
							id: catID.value,
							name:
								cat?.name.value ??
								`Category not found: ${catID.value}`,
						};
					} catch {
						return {
							id: catID.value,
							name: `Error loading category: ${catID.value}`,
						};
					}
				})
				.filter(
					(cat) =>
						!cat.name.includes("not found") &&
						!cat.name.includes("Error loading"),
				) // Remove not found categories
				.sort((a, b) => a.name.localeCompare(b.name));

			// Remove duplicates by ID using Map
			const categoryMap = new Map<string, { id: string; name: string }>();
			filteredCategories.forEach((cat) => {
				categoryMap.set(cat.id, cat);
			});
			const uniqueCategories = Array.from(categoryMap.values());

			return uniqueCategories;
		}
	}, [categories, overrideCategoriesIDs, getCategoryByID]);

	useEffect(() => {
		setCategoryId(initialValueID ?? "");
	}, [initialValueID]);

	useEffect(() => {
		if (categoryId && getCategoryByID) {
			try {
				setCategory(getCategoryByID(new CategoryID(categoryId)));
			} catch {
				setCategory(undefined);
			}
		} else {
			setCategory(undefined);
		}
	}, [categoryId, getCategoryByID]);

	return {
		CategorySelect: (
			<Select
				id="category"
				label={label ?? "Category"}
				value={categoryId}
				values={[{ id: "", name: "" }, ...categoriesList]}
				onChange={(id) => setCategoryId(id)}
				error={error}
				getOptionLabel={(option) => option.name}
				getOptionValue={(option) => option.id}
			/>
		),
		category: category,
	};
};
