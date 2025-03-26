import { useContext, useEffect, useMemo, useState } from "react";
import { Select } from "./Select";
import { CategoriesContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import {
	SubCategory,
	SubCategoryID,
	SubCategoryName,
} from "contexts/Subcategories";

export const useSubCategorySelect = ({
	label,
	initialValueName,
	initialValueID,
	lock,
	setLock,
}: {
	label?: string;
	initialValueName?: SubCategoryName;
	initialValueID?: SubCategoryID;
	lock?: boolean;
	setLock?: (lock: boolean) => void;
}) => {
	const [subCategoryName, setSubCategoryName] = useState(
		initialValueName?.value ?? ""
	);
	const [subCategory, setSubCategory] = useState<SubCategory>();

	const { subCategories, getSubCategoryByID } = useContext(CategoriesContext);
	const subCategoriesNames = useMemo(
		() => subCategories.map((acc) => acc.name.value).sort(),
		[subCategories]
	);

	useEffect(() => {
		if (initialValueID)
			setSubCategoryName(
				getSubCategoryByID(initialValueID)?.name.value ?? ""
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
