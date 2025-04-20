import { useContext, useEffect, useMemo, useState } from "react";
import { Select } from "./Select";
import { CategoriesContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import {
	SubCategory,
	SubCategoryID,
	SubCategoryName,
} from "contexts/Subcategories/domain";
import { Category } from "contexts/Categories/domain";

export const useSubCategorySelect = ({
	label,
	initialValueName,
	initialValueID,
	category,
	lock,
	setLock,
	overrideSubCategoriesIDs,
}: {
	label?: string;
	initialValueName?: SubCategoryName;
	initialValueID?: string;
	category?: Category;
	lock?: boolean;
	setLock?: (lock: boolean) => void;
	overrideSubCategoriesIDs?: SubCategoryID[];
}) => {
	const [subCategoryName, setSubCategoryName] = useState(
		initialValueName?.value ?? ""
	);
	const [subCategory, setSubCategory] = useState<SubCategory>();

	const { subCategories, getSubCategoriesByCategory, getSubCategoryByID } =
		useContext(CategoriesContext);

	const subCategoriesNames = useMemo(() => {
		if (category)
			return getSubCategoriesByCategory(category)
				.map((cat) => cat.name.value)
				.unique()
				.sort((a, b) => a.localeCompare(b));
		return (
			!overrideSubCategoriesIDs
				? subCategories.map((acc) => acc.name.value)
				: [
						...new Set(
							overrideSubCategoriesIDs.map((subID) => subID.value)
						),
				  ].map(
						(subID) =>
							getSubCategoryByID(new SubCategoryID(subID))?.name
								.value ?? `not found id: ${subID}`
				  )
		)
			.unique()
			.sort((a, b) => a.localeCompare(b));
	}, [subCategories, category, overrideSubCategoriesIDs]);

	useEffect(() => {
		if (initialValueID)
			setSubCategoryName(
				getSubCategoryByID(new SubCategoryID(initialValueID))?.name
					.value ?? ""
			);
	}, [initialValueID]);

	useEffect(() => {
		setSubCategory(
			subCategoryName
				? subCategories.find((acc) =>
						acc.name.equalTo(new SubCategoryName(subCategoryName))
				  )
				: undefined
		);
	}, [subCategoryName]);

	return {
		SubCategorySelect: (
			<Select
				id="subCategory"
				label={label ?? "SubCategory"}
				value={subCategoryName}
				values={["", ...subCategoriesNames]}
				onChange={(subCategory) => setSubCategoryName(subCategory)}
				isLocked={lock}
				setIsLocked={setLock ? (lock) => setLock(lock) : undefined}
				// error={errors?.subCategory}
			/>
		),
		subCategory,
	};
};
