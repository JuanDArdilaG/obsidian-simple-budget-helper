import { useContext, useEffect, useMemo, useState } from "react";
import { Select } from "./Select";
import { CategoriesContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { Category, CategoryID, CategoryName } from "contexts/Categories";

export const useCategorySelect = ({
	label,
	initialValueName,
	initialValueID,
	lock,
	setLock,
}: {
	label?: string;
	initialValueName?: CategoryName;
	initialValueID?: CategoryID;
	lock?: boolean;
	setLock?: (lock: boolean) => void;
}) => {
	const [categoryName, setCategoryName] = useState(
		initialValueName?.valueOf() ?? ""
	);
	const [category, setCategory] = useState<Category>();

	const { categories, getCategoryByID } = useContext(CategoriesContext);
	const categoriesNames = useMemo(
		() => categories.map((acc) => acc.name.valueOf()).sort(),
		[categories]
	);

	useEffect(() => {
		if (initialValueID)
			setCategoryName(
				getCategoryByID(initialValueID)?.name.valueOf() ?? ""
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
				values={["", ...categoriesNames]}
				onChange={(category) => setCategoryName(category)}
				isLocked={lock}
				setIsLocked={setLock ? (lock) => setLock(lock) : undefined}
				// error={errors?.category}
			/>
		),
		category: category,
	};
};
