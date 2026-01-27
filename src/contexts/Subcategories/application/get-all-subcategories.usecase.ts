import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { Subcategory } from "contexts/Subcategories/domain";
import { ISubcategoriesRepository } from "../domain/subcategories-repository.interface";

export type SubcategoriesMap = Map<string, Subcategory>;

export class GetAllSubcategoriesUseCase implements QueryUseCase<
	void,
	SubcategoriesMap
> {
	constructor(
		private readonly _subCategoriesRepository: ISubcategoriesRepository,
	) {}

	async execute(): Promise<SubcategoriesMap> {
		const subcategories = (
			await this._subCategoriesRepository.findAll()
		).toSorted((a, b) => a.name.value.localeCompare(b.name.value));
		return new Map(
			subcategories.map((subcategory) => [subcategory.id, subcategory]),
		);
	}
}
