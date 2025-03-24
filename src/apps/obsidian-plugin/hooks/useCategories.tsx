import { useState, useEffect, useContext, useCallback } from "react";
import { CategoriesContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import {
	Category,
	CategoryID,
	CategoryName,
	GetAllCategoriesWithSubCategoriesUseCaseOutput,
	Subcategory,
	SubcategoryID,
	SubcategoryName,
} from "contexts";
import { Logger } from "contexts/Shared";

export const useCategories = () => {
	const {
		useCases: { getAllCategoriesWithSubCategories },
	} = useContext(CategoriesContext);

	const [categoriesWithSubcategories, setCategoriesWithSubcategories] =
		useState<GetAllCategoriesWithSubCategoriesUseCaseOutput>([]);
	const [updateCatWithSubs, setUpdateCatWithSubs] = useState(true);
	useEffect(() => {
		if (updateCatWithSubs) {
			setUpdateCatWithSubs(false);
			Logger.debug("updating categories with subcategories", {
				categoriesWithSubcategories,
			});
			getAllCategoriesWithSubCategories
				.execute()
				.then((catWithSubs) =>
					setCategoriesWithSubcategories(catWithSubs)
				);
		}
	}, [updateCatWithSubs]);

	const [categories, setCategories] = useState<Category[]>([]);
	const [updateCategories, setUpdateCategories] = useState(true);
	useEffect(() => {
		if (updateCategories) {
			setUpdateCategories(false);
			Logger.debug("updating categories", {
				categories,
			});
			getAllCategoriesWithSubCategories
				.execute()
				.then((catWithSubs) =>
					setCategories(
						catWithSubs.map((catWithSubs) => catWithSubs.category)
					)
				);
		}
	}, [updateCategories]);

	const [subCategories, setSubCategories] = useState<Subcategory[]>([]);
	const [updateSubCategories, setUpdateSubCategories] = useState(true);
	useEffect(() => {
		if (updateSubCategories) {
			setUpdateSubCategories(false);
			getAllCategoriesWithSubCategories
				.execute()
				.then((catsWithSubs) =>
					setSubCategories(
						catsWithSubs
							.map((catWithSubs) => catWithSubs.subCategories)
							.flat()
					)
				);
		}
	}, [updateSubCategories]);

	const getCategoryByID = useCallback(
		(id: CategoryID) => {
			const cat = categories.find((cat) => cat.id.equalTo(id));
			Logger.debug("searching category", { categories, id, cat });
			return cat;
		},
		[categories]
	);

	const getCategoryByName = useCallback(
		(name: CategoryName) => {
			const cat = categories.find((cat) => cat.name.equalTo(name));
			return cat;
		},
		[categories]
	);

	const getSubCategoryByID = useCallback(
		(id: SubcategoryID) => subCategories.find((sub) => sub.id.equalTo(id)),
		[subCategories]
	);

	const getSubCategoryByName = useCallback(
		(name: SubcategoryName) =>
			subCategories.find((sub) => sub.name.equalTo(name)),
		[subCategories]
	);

	return {
		categoriesWithSubcategories,
		updateCategoriesWithSubcategories: () => setUpdateCatWithSubs(true),
		categories,
		subCategories,
		updateCategories: () => setUpdateCategories(true),
		updateSubCategories: () => setUpdateSubCategories(true),
		getCategoryByID,
		getCategoryByName,
		getSubCategoryByID,
		getSubCategoryByName,
	};
};
