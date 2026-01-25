import { Category } from "contexts/Categories/domain";
import { QueryUseCase } from "contexts/Shared/domain";
import {
	GetAllSubcategoriesUseCase,
	SubcategoriesMap,
} from "../../Subcategories/application/get-all-subcategories.usecase";
import { GetAllCategoriesUseCase } from "./get-all-categories.usecase";

export type CategoriesWithSubcategoriesMap = Map<
	string,
	{
		category: Category;
		subcategories: SubcategoriesMap;
	}
>;

export class GetAllCategoriesWithSubCategoriesUseCase implements QueryUseCase<
	void,
	CategoriesWithSubcategoriesMap
> {
	constructor(
		private readonly getAllCategoriesUseCase: GetAllCategoriesUseCase,
		private readonly getAllSubCategoriesUseCase: GetAllSubcategoriesUseCase,
	) {}

	async execute(): Promise<CategoriesWithSubcategoriesMap> {
		const categoriesMap = await this.getAllCategoriesUseCase.execute();
		const subcategoriesMap =
			await this.getAllSubCategoriesUseCase.execute();

		const categoriesWithSubcategories: CategoriesWithSubcategoriesMap =
			new Map();

		categoriesMap.forEach((category, categoryId) => {
			const subcategoriesForCategory: SubcategoriesMap = new Map();

			subcategoriesMap.forEach((subcategory, subcategoryId) => {
				if (subcategory.categoryId.value === categoryId) {
					subcategoriesForCategory.set(subcategoryId, subcategory);
				}
			});

			categoriesWithSubcategories.set(categoryId, {
				category,
				subcategories: subcategoriesForCategory,
			});
		});

		return categoriesWithSubcategories;
	}
}
