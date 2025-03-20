import { QueryUseCase } from "contexts/Shared/domain";
import { Category, ICategoriesRepository } from "contexts/Categories/domain";
import {
	Subcategory,
	ISubcategoriesRepository,
} from "contexts/Subcategories/domain";

export type GetAllCategoriesWithSubCategoriesUseCaseOutput = {
	category: Category;
	subCategories: Subcategory[];
}[];

export class GetAllCategoriesWithSubCategoriesUseCase
	implements
		QueryUseCase<void, GetAllCategoriesWithSubCategoriesUseCaseOutput>
{
	constructor(
		private _categoriesRepository: ICategoriesRepository,
		private _subCategoriesRepository: ISubcategoriesRepository
	) {}

	async execute(): Promise<GetAllCategoriesWithSubCategoriesUseCaseOutput> {
		const categories = await this._categoriesRepository.findAll();
		return Promise.all(
			categories.map(async (category) => ({
				category,
				subCategories:
					await this._subCategoriesRepository.findAllByCategory(
						category.id
					),
			}))
		);
	}
}
