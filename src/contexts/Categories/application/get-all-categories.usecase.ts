import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { CategoryName } from "../domain/category-name.valueobject";
import { ICategoriesRepository } from "../domain/categories-repository.interface";

export type GetAllCategoryNamesUseCaseOutput = CategoryName[];

export class GetAllCategoryNamesUseCase
	implements QueryUseCase<void, GetAllCategoryNamesUseCaseOutput>
{
	constructor(private _categoriesRepository: ICategoriesRepository) {}

	async execute(): Promise<GetAllCategoryNamesUseCaseOutput> {
		return await this._categoriesRepository.findAllNames();
	}
}
