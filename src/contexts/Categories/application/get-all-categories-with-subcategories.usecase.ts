import { QueryUseCase } from "contexts/Shared/domain";
import { Category, ICategoriesRepository } from "contexts/Categories/domain";
import {
	SubCategory,
	ISubCategoriesRepository,
} from "contexts/Subcategories/domain";

export type GetAllCategoriesWithSubCategoriesUseCaseOutput = {
	category: Category;
	subCategories: SubCategory[];
}[];

export class GetAllCategoriesWithSubCategoriesUseCase
	implements
		QueryUseCase<void, GetAllCategoriesWithSubCategoriesUseCaseOutput>
{
	constructor(
		private _categoriesRepository: ICategoriesRepository,
		private _subCategoriesRepository: ISubCategoriesRepository
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
