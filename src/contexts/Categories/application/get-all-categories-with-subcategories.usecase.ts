import { Category, ICategoriesRepository } from "contexts/Categories/domain";
import { QueryUseCase } from "contexts/Shared/domain";
import {
	ISubCategoriesRepository,
	SubCategory,
} from "contexts/Subcategories/domain";

export type CategoriesWithSubcategories = {
	category: Category;
	subcategories: SubCategory[];
}[];

export class GetAllCategoriesWithSubCategoriesUseCase implements QueryUseCase<
	void,
	CategoriesWithSubcategories
> {
	constructor(
		private readonly _categoriesRepository: ICategoriesRepository,
		private readonly _subCategoriesRepository: ISubCategoriesRepository,
	) {}

	async execute(): Promise<CategoriesWithSubcategories> {
		const categories = await this._categoriesRepository.findAll();
		return Promise.all(
			categories.map(async (category) => ({
				category,
				subcategories:
					await this._subCategoriesRepository.findAllByCategory(
						category.id,
					),
			})),
		);
	}
}
