import { useCategories } from "apps/obsidian-plugin/hooks";
import { AwilixContainer } from "awilix";
import { CreateCategoryUseCase } from "contexts/Categories/application/create-category.usecase";
import {
	CategoriesWithSubcategoriesMap,
	GetAllCategoriesWithSubCategoriesUseCase,
} from "contexts/Categories/application/get-all-categories-with-subcategories.usecase";
import { Category } from "contexts/Categories/domain";
import { CreateSubCategoryUseCase } from "contexts/Subcategories/application/create-subcategory.usecase";
import { Subcategory } from "contexts/Subcategories/domain";
import { createContext, useCallback } from "react";
import { DeleteCategoryUseCase } from "../../../../../contexts/Categories/application/delete-category.usecase";
import {
	CategoriesMap,
	GetAllCategoriesUseCase,
} from "../../../../../contexts/Categories/application/get-all-categories.usecase";
import { UpdateCategoryUseCase } from "../../../../../contexts/Categories/application/update-category.usecase";
import { Nanoid } from "../../../../../contexts/Shared/domain";
import { DeleteSubCategoryUseCase } from "../../../../../contexts/Subcategories/application/delete-subcategory.usecase";
import {
	GetAllSubcategoriesUseCase,
	SubcategoriesMap,
} from "../../../../../contexts/Subcategories/application/get-all-subcategories.usecase";
import { UpdateSubCategoryUseCase } from "../../../../../contexts/Subcategories/application/update-subcategory.usecase";

export type CategoriesContextType = {
	useCases: {
		createCategory: CreateCategoryUseCase;
		createSubCategory: CreateSubCategoryUseCase;
		getAllCategoriesWithSubCategories: GetAllCategoriesWithSubCategoriesUseCase;
		updateCategory: UpdateCategoryUseCase;
		updateSubCategory: UpdateSubCategoryUseCase;
		deleteCategory: DeleteCategoryUseCase;
		deleteSubCategory: DeleteSubCategoryUseCase;
	};
	categoriesWithSubcategories: CategoriesWithSubcategoriesMap;
	categoriesMap: CategoriesMap;
	subCategoriesMap: SubcategoriesMap;
	getCategoryByID: (id: Nanoid) => Category | undefined;
	getSubCategoryByID: (id: Nanoid) => Subcategory | undefined;
	getSubCategoriesByCategory: (category: Category) => SubcategoriesMap;
	updateCategoriesWithSubcategories: () => void;
	updateCategories: () => void;
	updateSubCategories: () => void;
	isLoading: boolean;
};

export const CategoriesContext = createContext<CategoriesContextType>({
	useCases: {
		createCategory: {} as CreateCategoryUseCase,
		createSubCategory: {} as CreateSubCategoryUseCase,
		getAllCategoriesWithSubCategories:
			{} as GetAllCategoriesWithSubCategoriesUseCase,
		updateCategory: {} as UpdateCategoryUseCase,
		deleteCategory: {} as DeleteCategoryUseCase,
		updateSubCategory: {} as UpdateSubCategoryUseCase,
		deleteSubCategory: {} as DeleteSubCategoryUseCase,
	},
	categoriesWithSubcategories: new Map(),
	categoriesMap: new Map(),
	subCategoriesMap: new Map(),
	getCategoryByID: () => undefined,
	getSubCategoryByID: () => undefined,
	getSubCategoriesByCategory: () => new Map(),
	updateCategoriesWithSubcategories: () => {},
	updateCategories: () => {},
	updateSubCategories: () => {},
	isLoading: false,
});

export const getCategoriesContextDefault = (
	container: AwilixContainer,
): CategoriesContextType => {
	const createCategory = container.resolve("createCategoryUseCase");
	const createSubCategory = container.resolve("createSubCategoryUseCase");
	const getAllCategories = container.resolve<GetAllCategoriesUseCase>(
		"getAllCategoriesUseCase",
	);
	const getAllSubCategories = container.resolve<GetAllSubcategoriesUseCase>(
		"getAllSubCategoriesUseCase",
	);
	const getAllCategoriesWithSubCategories = container.resolve(
		"getAllCategoriesWithSubCategoriesUseCase",
	);

	const {
		categoriesWithSubcategories,
		categoriesMap,
		subCategoriesMap,
		getCategoryByID,
		getSubCategoryByID,
		updateCategoriesWithSubcategories,
		updateCategories,
		updateSubCategories,
		isLoading,
	} = useCategories({
		getAllCategories,
		getAllSubCategories,
		getAllCategoriesWithSubCategories,
	});

	const getSubCategoriesByCategory = useCallback(
		(category: Category) =>
			category
				? (categoriesWithSubcategories.get(category.id)
						?.subcategories ?? (new Map() as SubcategoriesMap))
				: (new Map() as SubcategoriesMap),
		[categoriesWithSubcategories],
	);

	console.log("[CategoriesContext] Context value created", {
		categoriesCount: categoriesMap.size,
		subCategoriesCount: subCategoriesMap.size,
	});

	return {
		useCases: {
			createCategory,
			createSubCategory,
			getAllCategoriesWithSubCategories,
			updateCategory: container.resolve("updateCategoryUseCase"),
			updateSubCategory: container.resolve("updateSubCategoryUseCase"),
			deleteCategory: container.resolve("deleteCategoryUseCase"),
			deleteSubCategory: container.resolve("deleteSubCategoryUseCase"),
		},
		categoriesWithSubcategories,
		categoriesMap,
		subCategoriesMap,
		getCategoryByID,
		getSubCategoryByID,
		getSubCategoriesByCategory,
		updateCategoriesWithSubcategories,
		updateCategories,
		updateSubCategories,
		isLoading,
	};
};
