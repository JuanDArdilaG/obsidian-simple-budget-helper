import { useContext, useEffect, useMemo, useState } from "react";
import { Select } from "./Select";
import { CategoriesContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { Category, CategoryID, CategoryName } from "contexts/Categories/domain";

export const useCategorySelect = ({
	label,
	initialValueName,
	initialValueID,
	lock,
	setLock,
	overrideCategoriesIDs,
}: {
	label?: string;
	initialValueName?: CategoryName;
	initialValueID?: string;
	lock?: boolean;
	setLock?: (lock: boolean) => void;
	overrideCategoriesIDs?: CategoryID[];
}) => {
	const [categoryName, setCategoryName] = useState(
		initialValueName?.value ?? ""
	);
	const [category, setCategory] = useState<Category>();

	const { categories, getCategoryByID } = useContext(CategoriesContext);
	const categoriesNames = useMemo(
		() =>
			!overrideCategoriesIDs
				? categories
						.map((acc) => acc.name.value)
						.sort((a, b) => a.localeCompare(b))
				: [
						...new Set(
							overrideCategoriesIDs.map((catID) => catID.value)
						),
				  ].map(
						(catID) =>
							getCategoryByID(new CategoryID(catID))?.name
								.value ?? `not found id: ${catID}`
				  ),
		[categories, overrideCategoriesIDs]
	);

	useEffect(() => {
		setCategoryName(
			initialValueID
				? getCategoryByID(new CategoryID(initialValueID))?.name.value ??
						""
				: ""
		);
	}, [initialValueID]);

	useEffect(() => {
		setCategory(
			categoryName
				? categories.find((acc) =>
						acc.name.equalTo(new CategoryName(categoryName))
				  )
				: undefined
		);
	}, [categoryName]);

	return {
		CategorySelect: (
			<Select
				id="category"
				label={label ?? "Category"}
				value={categoryName}
				values={[
					"",
					...categoriesNames.toSorted((a, b) => a.localeCompare(b)),
				]}
				onChange={(category) => setCategoryName(category)}
				isLocked={lock}
				setIsLocked={setLock ? (lock) => setLock(lock) : undefined}
				// error={errors?.category}
			/>
		),
		category: category,
	};
};
