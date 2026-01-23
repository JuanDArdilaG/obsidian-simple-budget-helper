import {
	CategoriesWithSubcategories,
	GetAllCategoriesWithSubCategoriesUseCase,
} from "contexts/Categories/application/get-all-categories-with-subcategories.usecase";
import { Category, CategoryID, CategoryName } from "contexts/Categories/domain";
import {
	SubCategory,
	SubCategoryID,
	SubCategoryName,
} from "contexts/Subcategories/domain";
import { useCallback, useEffect, useState } from "react";
import { useLogger } from "./useLogger";

export const useCategories = ({
	getAllCategoriesWithSubCategories,
}: {
	getAllCategoriesWithSubCategories: GetAllCategoriesWithSubCategoriesUseCase;
}) => {
	const { logger } = useLogger("useCategories");

	const [categoriesWithSubcategories, setCategoriesWithSubcategories] =
		useState<CategoriesWithSubcategories>([]);
	const [updateCatWithSubs, setUpdateCatWithSubs] = useState(true);
	useEffect(() => {
		if (updateCatWithSubs) {
			setUpdateCatWithSubs(false);
			logger.debug("updating categories with subcategories", {
				categoriesWithSubcategories,
			});
			getAllCategoriesWithSubCategories
				.execute()
				.then((catWithSubs) =>
					setCategoriesWithSubcategories(catWithSubs),
				);
		}
	}, [updateCatWithSubs]);

	const [categories, setCategories] = useState<Category[]>([]);
	const [updateCategories, setUpdateCategories] = useState(true);
	useEffect(() => {
		if (updateCategories) {
			setUpdateCategories(false);
			logger.debug("updating categories", {
				categories,
			});
			getAllCategoriesWithSubCategories.execute().then((catWithSubs) => {
				const allCategories = catWithSubs.map(
					(catWithSubs) => catWithSubs.category,
				);
				// Remove duplicates by ID using Map
				const categoryMap = new Map<string, Category>();
				allCategories.forEach((cat) => {
					categoryMap.set(cat.id.value, cat);
				});
				const uniqueCategories = Array.from(categoryMap.values());
				setCategories(uniqueCategories);
			});
		}
	}, [updateCategories]);

	const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
	const [updateSubCategories, setUpdateSubCategories] = useState(true);
	useEffect(() => {
		if (updateSubCategories) {
			setUpdateSubCategories(false);
			getAllCategoriesWithSubCategories.execute().then((catsWithSubs) => {
				const allSubCategories = catsWithSubs.flatMap(
					(catWithSubs) => catWithSubs.subcategories,
				);
				// Remove duplicates by ID using Map
				const subCategoryMap = new Map<string, SubCategory>();
				allSubCategories.forEach((subCat) => {
					subCategoryMap.set(subCat.id.value, subCat);
				});
				const uniqueSubCategories = Array.from(subCategoryMap.values());
				setSubCategories(uniqueSubCategories);
			});
		}
	}, [updateSubCategories]);

	const getCategoryByID = useCallback(
		(id: CategoryID) => categories.find((cat) => cat.id.equalTo(id)),
		[categories],
	);

	const getCategoryByName = useCallback(
		(name: CategoryName) => {
			const cat = categories.find((cat) => cat.name.equalTo(name));
			return cat;
		},
		[categories],
	);

	const getSubCategoryByID = useCallback(
		(id: SubCategoryID) => subCategories.find((sub) => sub.id.equalTo(id)),
		[subCategories],
	);

	const getSubCategoryByName = useCallback(
		(name: SubCategoryName) =>
			subCategories.find((sub) => sub.name.equalTo(name)),
		[subCategories],
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
