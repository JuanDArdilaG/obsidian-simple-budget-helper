import { Category, ICategoriesRepository } from "contexts/Categories/domain";
import { QueryUseCase } from "contexts/Shared/domain";

export type CategoriesMap = Map<string, Category>;

export class GetAllCategoriesUseCase implements QueryUseCase<
	void,
	CategoriesMap
> {
	constructor(
		private readonly _categoriesRepository: ICategoriesRepository,
	) {}

	async execute(): Promise<CategoriesMap> {
		const categories = (
			await this._categoriesRepository.findAll()
		).toSorted((a, b) => a.name.value.localeCompare(b.name.value));
		return new Map(categories.map((category) => [category.id, category]));
	}
}
