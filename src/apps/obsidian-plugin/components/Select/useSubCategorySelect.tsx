import { CategoriesContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { Category } from "contexts/Categories/domain";
import {
	SubCategory,
	SubCategoryID,
	SubCategoryName,
} from "contexts/Subcategories/domain";
import { useContext, useEffect, useMemo, useState } from "react";
import { Select } from "./Select";

export const useSubCategorySelect = ({
	label,
	initialValueName,
	initialValueID,
	category,
	lock,
	setLock,
	overrideSubCategoriesIDs,
	error,
}: {
	label?: string;
	initialValueName?: SubCategoryName;
	initialValueID?: string;
	category?: Category;
	lock?: boolean;
	setLock?: (lock: boolean) => void;
	overrideSubCategoriesIDs?: SubCategoryID[];
	error?: string;
}) => {
	const [subCategoryId, setSubCategoryId] = useState(initialValueID ?? "");
	const [subCategory, setSubCategory] = useState<SubCategory>();

	const { subCategories, getSubCategoriesByCategory, getSubCategoryByID } =
		useContext(CategoriesContext);

	const subCategoriesList = useMemo(() => {
		if (category) {
			// If a category is selected, show only subcategories for that category
			try {
				const categorySubCategories = getSubCategoriesByCategory(
					category
				)
					.map((subCat) => ({
						id: subCat.id.value,
						name: subCat.name.value,
					}))
					.sort((a, b) => a.name.localeCompare(b.name));

				// Remove duplicates by ID using Map
				const subCategoryMap = new Map<
					string,
					{ id: string; name: string }
				>();
				categorySubCategories.forEach((subCat) => {
					subCategoryMap.set(subCat.id, subCat);
				});
				const uniqueSubCategories = Array.from(subCategoryMap.values());

				return uniqueSubCategories;
			} catch {
				return [];
			}
		} else if (overrideSubCategoriesIDs) {
			// Use only the specified subcategory IDs
			const filteredSubCategories = overrideSubCategoriesIDs
				.map((subID) => {
					try {
						const sub = getSubCategoryByID(subID);
						return {
							id: subID.value,
							name:
								sub?.name.value ??
								`Subcategory not found: ${subID.value}`,
						};
					} catch {
						return {
							id: subID.value,
							name: `Error loading subcategory: ${subID.value}`,
						};
					}
				})
				.filter(
					(sub) =>
						!sub.name.includes("not found") &&
						!sub.name.includes("Error loading")
				) // Remove not found subcategories
				.sort((a, b) => a.name.localeCompare(b.name));

			// Remove duplicates by ID using Map
			const subCategoryMap = new Map<
				string,
				{ id: string; name: string }
			>();
			filteredSubCategories.forEach((subCat) => {
				subCategoryMap.set(subCat.id, subCat);
			});
			const uniqueSubCategories = Array.from(subCategoryMap.values());

			return uniqueSubCategories;
		} else {
			// Use all subcategories
			const allSubCategories = (subCategories || [])
				.map((subCat) => ({
					id: subCat.id.value,
					name: subCat.name.value,
				}))
				.sort((a, b) => a.name.localeCompare(b.name));

			// Remove duplicates by ID using Map
			const subCategoryMap = new Map<
				string,
				{ id: string; name: string }
			>();
			allSubCategories.forEach((subCat) => {
				subCategoryMap.set(subCat.id, subCat);
			});
			const uniqueSubCategories = Array.from(subCategoryMap.values());

			return uniqueSubCategories;
		}
	}, [
		subCategories,
		category,
		overrideSubCategoriesIDs,
		getSubCategoriesByCategory,
		getSubCategoryByID,
	]);

	useEffect(() => {
		if (initialValueID) setSubCategoryId(initialValueID);
	}, [initialValueID]);

	useEffect(() => {
		if (subCategoryId && getSubCategoryByID) {
			try {
				setSubCategory(
					getSubCategoryByID(new SubCategoryID(subCategoryId))
				);
			} catch {
				setSubCategory(undefined);
			}
		} else {
			setSubCategory(undefined);
		}
	}, [subCategoryId, getSubCategoryByID]);

	return {
		SubCategorySelect: (
			<Select
				id="subCategory"
				label={label ?? "SubCategory"}
				value={subCategoryId}
				values={[{ id: "", name: "" }, ...subCategoriesList]}
				onChange={(id) => setSubCategoryId(id)}
				isLocked={lock}
				setIsLocked={setLock ? (lock) => setLock(lock) : undefined}
				error={error}
				getOptionLabel={(option) => option.name}
				getOptionValue={(option) => option.id}
			/>
		),
		subCategory,
	};
};
