import {
	SubCategory,
	SubCategoryID,
	SubcategoryPrimitives,
	ISubCategoriesRepository,
	SubCategoryName,
} from "contexts/Subcategories/domain";
import {
	DexieDB,
	DexieRepository,
} from "contexts/Shared/infrastructure/persistence";
import { CategoryID } from "contexts/Categories";
import { Config } from "contexts/Shared/infrastructure";

export class SubcategoriesDexieRepository
	extends DexieRepository<SubCategory, SubCategoryID, SubcategoryPrimitives>
	implements ISubCategoriesRepository
{
	constructor(config: typeof Config, protected readonly _db: DexieDB) {
		super(_db, config.subCategoriesTableName);
	}

	async findAllByCategory(categoryID: CategoryID): Promise<SubCategory[]> {
		return (
			await this._table
				.where("category")
				.equals(categoryID.toString())
				.toArray()
		).map((v) => this.mapToDomain(v));
	}

	async findByName(name: SubCategoryName): Promise<SubCategory | null> {
		const record = await this._table
			.where("name")
			.equals(name.toString())
			.limit(1)
			.first();
		if (!record) return null;
		return this.mapToDomain(record);
	}

	protected mapToDomain(record: SubcategoryPrimitives): SubCategory {
		return SubCategory.fromPrimitives(record);
	}
}
