import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { SubcategoryName } from "../domain/subcategory-name.valueobject";
import { ISubcategoriesRepository } from "../domain/subcategories-repository.interface";

export type GetAllSubcategoryNamesUseCaseOutput = SubcategoryName[];

export class GetAllSubcategoryNamesUseCase
	implements QueryUseCase<void, GetAllSubcategoryNamesUseCaseOutput>
{
	constructor(private _subcategoriesRepository: ISubcategoriesRepository) {}

	async execute(): Promise<GetAllSubcategoryNamesUseCaseOutput> {
		return await this._subcategoriesRepository.findAllNames();
	}
}
