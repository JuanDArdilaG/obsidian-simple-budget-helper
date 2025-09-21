import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { ISubCategoriesRepository } from "../domain/subcategories-repository.interface";
import { SubCategory } from "contexts/Subcategories/domain";

export type GetAllSubcategoriesUseCaseOutput = SubCategory[];

export class GetAllSubcategoriesUseCase
	implements QueryUseCase<void, GetAllSubcategoriesUseCaseOutput>
{
	constructor(private _subCategoriesRepository: ISubCategoriesRepository) {}

	async execute(): Promise<GetAllSubcategoriesUseCaseOutput> {
		return await this._subCategoriesRepository.findAll();
	}
}
