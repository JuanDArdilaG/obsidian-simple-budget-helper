import { createContext } from "react";
import { AwilixContainer } from "awilix";
import {
	CreateCategoryUseCase,
	GetAllCategoriesWithSubCategoriesUseCase,
} from "contexts/Categories";
import { CreateSubCategoryUseCase } from "contexts/Subcategories";

export type CategoriesContextType = {
	useCases: {
		createCategory: CreateCategoryUseCase;
		createSubCategory: CreateSubCategoryUseCase;
		getAllCategoriesWithSubCategories: GetAllCategoriesWithSubCategoriesUseCase;
	};
};

export const CategoriesContext = createContext<CategoriesContextType>({
	useCases: {
		createCategory: {} as CreateCategoryUseCase,
		createSubCategory: {} as CreateSubCategoryUseCase,
		getAllCategoriesWithSubCategories:
			{} as GetAllCategoriesWithSubCategoriesUseCase,
	},
});

export const getCategoriesContextDefault = (
	container: AwilixContainer
): CategoriesContextType => {
	const createCategory = container.resolve("createCategoryUseCase");
	const createSubCategory = container.resolve("createSubCategoryUseCase");
	const getAllCategoriesWithSubCategories = container.resolve(
		"getAllCategoriesWithSubCategoriesUseCase"
	);

	return {
		useCases: {
			createCategory,
			createSubCategory,
			getAllCategoriesWithSubCategories,
		},
	};
};
