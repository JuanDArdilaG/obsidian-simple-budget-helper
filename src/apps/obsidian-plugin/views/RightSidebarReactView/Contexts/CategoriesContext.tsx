import { createContext, useCallback } from "react";
import { AwilixContainer } from "awilix";
import { Category, CategoryID, CategoryName } from "contexts/Categories/domain";
import {
	SubCategory,
	SubCategoryID,
	SubCategoryName,
} from "contexts/Subcategories/domain";
import { useCategories } from "apps/obsidian-plugin/hooks";
import { CreateCategoryUseCase } from "contexts/Categories/application/create-category.usecase";
import {
	GetAllCategoriesWithSubCategoriesUseCase,
	GetAllCategoriesWithSubCategoriesUseCaseOutput,
} from "contexts/Categories/application/get-all-categories-with-subcategories.usecase";
import { CreateSubCategoryUseCase } from "contexts/Subcategories/application/create-subcategory.usecase";

export type CategoriesContextType = {
	useCases: {
		createCategory: CreateCategoryUseCase;
		createSubCategory: CreateSubCategoryUseCase;
		getAllCategoriesWithSubCategories: GetAllCategoriesWithSubCategoriesUseCase;
	};
	categoriesWithSubcategories: GetAllCategoriesWithSubCategoriesUseCaseOutput;
	categories: Category[];
	subCategories: SubCategory[];
	getCategoryByID: (id: CategoryID) => Category | undefined;
	getSubCategoryByID: (id: SubCategoryID) => SubCategory | undefined;
	getCategoryByName: (name: CategoryName) => Category | undefined;
	getSubCategoryByName: (name: SubCategoryName) => SubCategory | undefined;
	getSubCategoriesByCategory: (category: Category) => SubCategory[];
	updateCategoriesWithSubcategories: () => void;
	updateCategories: () => void;
	updateSubCategories: () => void;
};

export const CategoriesContext = createContext<CategoriesContextType>({
	useCases: {
		createCategory: {} as CreateCategoryUseCase,
		createSubCategory: {} as CreateSubCategoryUseCase,
		getAllCategoriesWithSubCategories:
			{} as GetAllCategoriesWithSubCategoriesUseCase,
	},
	categoriesWithSubcategories: [],
	categories: [],
	subCategories: [],
	getCategoryByID: () => undefined,
	getSubCategoryByID: () => undefined,
	getCategoryByName: () => undefined,
	getSubCategoryByName: () => undefined,
	getSubCategoriesByCategory: () => [],
	updateCategoriesWithSubcategories: () => {},
	updateCategories: () => {},
	updateSubCategories: () => {},
});

export const getCategoriesContextDefault = (
	container: AwilixContainer
): CategoriesContextType => {
	const createCategory = container.resolve("createCategoryUseCase");
	const createSubCategory = container.resolve("createSubCategoryUseCase");
	const getAllCategoriesWithSubCategories = container.resolve(
		"getAllCategoriesWithSubCategoriesUseCase"
	);

	const {
		categoriesWithSubcategories,
		categories,
		subCategories,
		getCategoryByID,
		getSubCategoryByID,
		getCategoryByName,
		getSubCategoryByName,
		updateCategoriesWithSubcategories,
		updateCategories,
		updateSubCategories,
	} = useCategories({ getAllCategoriesWithSubCategories });

	const getSubCategoriesByCategory = useCallback(
		(category: Category) =>
			category
				? categoriesWithSubcategories.find((catWithSubs) =>
						catWithSubs.category.name.equalTo(category.name)
				  )?.subCategories ?? []
				: [],
		[categoriesWithSubcategories]
	);

	return {
		useCases: {
			createCategory,
			createSubCategory,
			getAllCategoriesWithSubCategories,
		},
		categoriesWithSubcategories,
		categories,
		subCategories,
		getCategoryByID,
		getSubCategoryByID,
		getCategoryByName,
		getSubCategoryByName,
		getSubCategoriesByCategory,
		updateCategoriesWithSubcategories,
		updateCategories,
		updateSubCategories,
	};
};
