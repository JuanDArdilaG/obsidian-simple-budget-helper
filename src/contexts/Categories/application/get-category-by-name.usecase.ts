import { EntityNotFoundError, QueryUseCase } from "contexts/Shared/domain";
import {
	Category,
	CategoryName,
	ICategoriesRepository,
} from "contexts/Categories/domain";

export type GetCategoryByNameUseCaseInput = CategoryName;
export type GetCategoryByNameUseCaseOutput = Category;

export class GetCategoryByNameUseCase
	implements
		QueryUseCase<
			GetCategoryByNameUseCaseInput,
			GetCategoryByNameUseCaseOutput
		>
{
	constructor(private _categoriesRepository: ICategoriesRepository) {}

	async execute(name: CategoryName): Promise<Category> {
		const category = await this._categoriesRepository.findByName(name);
		if (!category) throw new EntityNotFoundError("Category", name);
		return category;
	}
}
