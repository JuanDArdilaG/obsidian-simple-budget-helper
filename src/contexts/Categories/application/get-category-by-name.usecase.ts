import {
	Category,
	CategoryName,
	ICategoriesRepository,
} from "contexts/Categories/domain";
import { EntityNotFoundError, QueryUseCase } from "contexts/Shared/domain";

export type GetCategoryByNameUseCaseInput = CategoryName;
export type GetCategoryByNameUseCaseOutput = Category;

export class GetCategoryByNameUseCase implements QueryUseCase<
	GetCategoryByNameUseCaseInput,
	GetCategoryByNameUseCaseOutput
> {
	constructor(
		private readonly _categoriesRepository: ICategoriesRepository,
	) {}

	async execute(name: CategoryName): Promise<Category> {
		const category = await this._categoriesRepository.findByName(name);
		if (!category) throw new EntityNotFoundError("Category", name.value);
		return category;
	}
}
