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
		if (category)
			return getSubCategoriesByCategory(category)
				.map((cat) => ({ id: cat.id.value, name: cat.name.value }))
				.unique()
				.sort((a, b) => a.name.localeCompare(b.name));
		return (
			!overrideSubCategoriesIDs
				? subCategories.map((cat) => ({
						id: cat.id.value,
						name: cat.name.value,
				  }))
				: [
						{ id: "", name: "" },
						...[
							...new Set(
								overrideSubCategoriesIDs.map(
									(subID) => subID.value
								)
							),
						].map((subID) => {
							const sub = getSubCategoryByID(
								new SubCategoryID(subID)
							);
							return {
								id: subID,
								name:
									sub?.name.value ?? `not found id: ${subID}`,
							};
						}),
				  ]
		)
			.unique()
			.sort((a, b) => a.name.localeCompare(b.name));
	}, [subCategories, category, overrideSubCategoriesIDs]);

	useEffect(() => {
		if (initialValueID) setSubCategoryId(initialValueID);
	}, [initialValueID]);

	useEffect(() => {
		setSubCategory(
			subCategoryId
				? getSubCategoryByID(new SubCategoryID(subCategoryId))
				: undefined
		);
	}, [subCategoryId]);

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
