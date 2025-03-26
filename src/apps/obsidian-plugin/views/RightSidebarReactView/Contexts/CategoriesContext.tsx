import { createContext, useCallback } from "react";
import { AwilixContainer } from "awilix";
import {
	Category,
	CategoryID,
	CategoryName,
	CreateCategoryUseCase,
	GetAllCategoriesWithSubCategoriesUseCase,
	GetAllCategoriesWithSubCategoriesUseCaseOutput,
} from "contexts/Categories";
import {
	CreateSubCategoryUseCase,
	SubCategory,
	SubCategoryID,
	SubCategoryName,
} from "contexts/Subcategories";
import { useCategories } from "apps/obsidian-plugin/hooks";

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
	};
};
