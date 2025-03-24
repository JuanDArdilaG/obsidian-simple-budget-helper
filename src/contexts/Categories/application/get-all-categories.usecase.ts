import { QueryUseCase } from "contexts/Shared/domain";
import { Category, ICategoriesRepository } from "contexts/Categories/domain";

export type GetAllCategoriesUseCaseOutput = Category[];

export class GetAllCategoriesUseCase
	implements QueryUseCase<void, GetAllCategoriesUseCaseOutput>
{
	constructor(private _categoriesRepository: ICategoriesRepository) {}

	async execute(): Promise<GetAllCategoriesUseCaseOutput> {
		return await this._categoriesRepository.findAll();
	}
}
