import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { ISubCategoriesRepository } from "../domain/subcategories-repository.interface";
import { Subcategory } from "contexts/Subcategories/domain";

export type GetAllSubcategoriesUseCaseOutput = Subcategory[];

export class GetAllSubcategoriesUseCase
	implements QueryUseCase<void, GetAllSubcategoriesUseCaseOutput>
{
	constructor(private _subCategoriesRepository: ISubCategoriesRepository) {}

	async execute(): Promise<GetAllSubcategoriesUseCaseOutput> {
		return await this._subCategoriesRepository.findAll();
	}
}
