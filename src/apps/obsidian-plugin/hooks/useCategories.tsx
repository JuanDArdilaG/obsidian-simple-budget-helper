import {
	CategoriesWithSubcategoriesMap,
	GetAllCategoriesWithSubCategoriesUseCase,
} from "contexts/Categories/application/get-all-categories-with-subcategories.usecase";
import { useCallback, useEffect, useState } from "react";
import {
	CategoriesMap,
	GetAllCategoriesUseCase,
} from "../../../contexts/Categories/application/get-all-categories.usecase";
import { Nanoid } from "../../../contexts/Shared/domain";
import {
	GetAllSubcategoriesUseCase,
	SubcategoriesMap,
} from "../../../contexts/Subcategories/application/get-all-subcategories.usecase";
import { useLogger } from "./useLogger";

export const useCategories = ({
	getAllCategories,
	getAllSubCategories,
	getAllCategoriesWithSubCategories,
}: {
	getAllCategories: GetAllCategoriesUseCase;
	getAllSubCategories: GetAllSubcategoriesUseCase;
	getAllCategoriesWithSubCategories: GetAllCategoriesWithSubCategoriesUseCase;
}) => {
	const { logger } = useLogger("useCategories");

	const [isLoading, setIsLoading] = useState(true);

	const [categoriesWithSubcategoriesMap, setCategoriesWithSubcategoriesMap] =
		useState<CategoriesWithSubcategoriesMap>(new Map());
	const [updateCatWithSubs, setUpdateCatWithSubs] = useState(true);

	useEffect(() => {
		if (updateCatWithSubs) setIsLoading(true);
	}, [updateCatWithSubs]);

	useEffect(() => {
		console.log("[useCategories] CatWithSubs effect triggered", {
			updateCatWithSubs,
			count: categoriesWithSubcategoriesMap.size,
		});
		if (updateCatWithSubs) {
			console.log(
				"[useCategories] Fetching categories with subcategories",
			);
			setUpdateCatWithSubs(false);
			logger.debug("updating categories with subcategories", {
				categoriesWithSubcategoriesMap,
			});
			getAllCategoriesWithSubCategories
				.execute()
				.then((catWithSubs) => {
					console.log("[useCategories] CatWithSubs fetched", {
						count: catWithSubs.size,
					});
					setCategoriesWithSubcategoriesMap(catWithSubs);
				})
				.catch((error) => {
					console.error(
						"[useCategories] Error fetching catWithSubs:",
						error,
					);
				})
				.finally(() => {
					setIsLoading(false);
				});
		}
	}, [updateCatWithSubs]);

	const [categoriesMap, setCategoriesMap] = useState<CategoriesMap>(
		new Map(),
	);
	const [updateCategories, setUpdateCategories] = useState(true);
	useEffect(() => {
		console.log("[useCategories] Categories effect triggered", {
			updateCategories,
			count: categoriesMap.size,
		});
		if (updateCategories) {
			console.log("[useCategories] Fetching categories");
			setUpdateCategories(false);
			logger.debug("updating categories", {
				categories: categoriesMap,
			});
			getAllCategories
				.execute()
				.then((cats) => {
					console.log("[useCategories] Categories fetched", {
						count: cats.size,
					});
					setCategoriesMap(cats);
				})
				.catch((error) => {
					console.error(
						"[useCategories] Error fetching categories:",
						error,
					);
				});
		}
	}, [updateCategories]);

	const [subCategoriesMap, setSubCategoriesMap] = useState<SubcategoriesMap>(
		new Map(),
	);
	const [updateSubCategories, setUpdateSubCategories] = useState(true);
	useEffect(() => {
		console.log("[useCategories] SubCategories effect triggered", {
			updateSubCategories,
			count: subCategoriesMap.size,
		});
		if (updateSubCategories) {
			console.log("[useCategories] Fetching subcategories");
			setUpdateSubCategories(false);
			getAllSubCategories
				.execute()
				.then((subs) => {
					console.log("[useCategories] SubCategories fetched", {
						count: subs.size,
					});
					setSubCategoriesMap(subs);
				})
				.catch((error) => {
					console.error(
						"[useCategories] Error fetching subcategories:",
						error,
					);
				});
		}
	}, [updateSubCategories]);

	const getCategoryByID = useCallback(
		(id: Nanoid) => categoriesMap.get(id.value),
		[categoriesMap],
	);

	const getSubCategoryByID = useCallback(
		(id: Nanoid) => subCategoriesMap.get(id.value),
		[subCategoriesMap],
	);

	return {
		categoriesWithSubcategories: categoriesWithSubcategoriesMap,
		updateCategoriesWithSubcategories: () => setUpdateCatWithSubs(true),
		categoriesMap,
		subCategoriesMap,
		updateCategories: () => setUpdateCategories(true),
		updateSubCategories: () => setUpdateSubCategories(true),
		getCategoryByID,
		getSubCategoryByID,
		isLoading,
	};
};
