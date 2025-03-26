import { useState, useEffect, useCallback } from "react";
import {
	Category,
	CategoryID,
	CategoryName,
	GetAllCategoriesWithSubCategoriesUseCase,
	GetAllCategoriesWithSubCategoriesUseCaseOutput,
	SubCategory,
	SubCategoryID,
	SubCategoryName,
} from "contexts";
import { useLogger } from "./useLogger";

export const useCategories = ({
	getAllCategoriesWithSubCategories,
}: {
	getAllCategoriesWithSubCategories: GetAllCategoriesWithSubCategoriesUseCase;
}) => {
	const logger = useLogger("useCategories");

	const [categoriesWithSubcategories, setCategoriesWithSubcategories] =
		useState<GetAllCategoriesWithSubCategoriesUseCaseOutput>([]);
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
					setCategoriesWithSubcategories(catWithSubs)
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
			getAllCategoriesWithSubCategories
				.execute()
				.then((catWithSubs) =>
					setCategories(
						catWithSubs.map((catWithSubs) => catWithSubs.category)
					)
				);
		}
	}, [updateCategories]);

	const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
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
			logger.debug(
				"searching category",
				{ categories, id, cat },
				{ on: false }
			);
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
		(id: SubCategoryID) => subCategories.find((sub) => sub.id.equalTo(id)),
		[subCategories]
	);

	const getSubCategoryByName = useCallback(
		(name: SubCategoryName) =>
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
