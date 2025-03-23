import { InvalidArgumentError } from "contexts/Shared/domain/errors";
import {
	Subcategory,
	SubcategoryName,
	ISubCategoriesRepository,
	ISubCategoriesService,
} from "../domain";
import { CategoryID } from "contexts/Categories/domain/category-id.valueobject";

export class SubCategoriesService implements ISubCategoriesService {
	constructor(private _subCategoriesRepository: ISubCategoriesRepository) {}

	async create(subCategory: Subcategory): Promise<void> {
		const existingSubcategory =
			await this._subCategoriesRepository.findByName(subCategory.name);
		if (existingSubcategory)
			throw new InvalidArgumentError(
				"Subcategory",
				subCategory.name.toString(),
				`subCategory with name ${subCategory.name} already exists`
			);
		await this._subCategoriesRepository.persist(subCategory);
	}

	async getByNameWithCreation(
		categoryID: CategoryID,
		name: SubcategoryName
	): Promise<Subcategory> {
		const existingSubcategory =
			await this._subCategoriesRepository.findByName(name);
		if (existingSubcategory) return existingSubcategory;

		const subCategory = Subcategory.create(categoryID, name);
		await this._subCategoriesRepository.persist(subCategory);

		return subCategory;
	}
}
