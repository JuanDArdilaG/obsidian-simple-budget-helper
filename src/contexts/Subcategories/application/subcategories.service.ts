import { Service } from "contexts/Shared/application/service.abstract";
import { InvalidArgumentError } from "contexts/Shared/domain/errors";
import { Nanoid } from "../../Shared/domain";
import {
	ISubcategoriesRepository,
	Subcategory,
	SubcategoryName,
	SubcategoryPrimitives,
} from "../domain";

export class SubCategoriesService extends Service<
	string,
	Subcategory,
	SubcategoryPrimitives
> {
	constructor(
		private readonly _subCategoriesRepository: ISubcategoriesRepository,
	) {
		super("Subcategory", _subCategoriesRepository);
	}

	async create(subCategory: Subcategory): Promise<void> {
		const existingSubcategory =
			await this._subCategoriesRepository.findByName(subCategory.name);
		if (existingSubcategory?.categoryId.equalTo(subCategory.categoryId))
			throw new InvalidArgumentError(
				"Subcategory",
				subCategory.name.toString(),
				`subCategory with name ${subCategory.name} already exists`,
			);
		await this._subCategoriesRepository.persist(subCategory);
	}

	async getByNameWithCreation(
		categoryID: Nanoid,
		name: SubcategoryName,
	): Promise<Subcategory> {
		const existingSubcategory =
			await this._subCategoriesRepository.findByName(name);
		if (existingSubcategory) return existingSubcategory;

		const subCategory = Subcategory.create(categoryID, name);
		await this._subCategoriesRepository.persist(subCategory);

		return subCategory;
	}
}
