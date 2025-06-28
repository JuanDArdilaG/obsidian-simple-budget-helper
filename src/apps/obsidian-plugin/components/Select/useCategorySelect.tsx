import { CategoriesContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { Category, CategoryID, CategoryName } from "contexts/Categories/domain";
import { useContext, useEffect, useMemo, useState } from "react";
import { Select } from "./Select";

export const useCategorySelect = ({
	label,
	initialValueName,
	initialValueID,
	lock,
	setLock,
	overrideCategoriesIDs,
	error,
}: {
	label?: string;
	initialValueName?: CategoryName;
	initialValueID?: string;
	lock?: boolean;
	setLock?: (lock: boolean) => void;
	overrideCategoriesIDs?: CategoryID[];
	error?: string;
}) => {
	const [categoryId, setCategoryId] = useState(initialValueID ?? "");
	const [category, setCategory] = useState<Category>();

	const { categories, getCategoryByID } = useContext(CategoriesContext);
	const categoriesList = useMemo(
		() =>
			!overrideCategoriesIDs
				? categories
						.map((cat) => ({
							id: cat.id.value,
							name: cat.name.value,
						}))
						.sort((a, b) => a.name.localeCompare(b.name))
				: [
						{ id: "", name: "" },
						...[
							...new Set(
								overrideCategoriesIDs.map(
									(catID) => catID.value
								)
							),
						].map((catID) => {
							const cat = getCategoryByID(new CategoryID(catID));
							return {
								id: catID,
								name:
									cat?.name.value ?? `not found id: ${catID}`,
							};
						}),
				  ],
		[categories, overrideCategoriesIDs]
	);

	useEffect(() => {
		setCategoryId(initialValueID ?? "");
	}, [initialValueID]);

	useEffect(() => {
		setCategory(
			categoryId ? getCategoryByID(new CategoryID(categoryId)) : undefined
		);
	}, [categoryId]);

	return {
		CategorySelect: (
			<Select
				id="category"
				label={label ?? "Category"}
				value={categoryId}
				values={[{ id: "", name: "" }, ...categoriesList]}
				onChange={(id) => setCategoryId(id)}
				isLocked={lock}
				setIsLocked={setLock ? (lock) => setLock(lock) : undefined}
				error={error}
				getOptionLabel={(option) => option.name}
				getOptionValue={(option) => option.id}
			/>
		),
		category: category,
	};
};
