import {
	Subcategory,
	SubcategoryID,
	SubcategoryPrimitives,
	ISubcategoriesRepository,
} from "contexts/Subcategories/domain";
import {
	DexieDB,
	DexieRepository,
} from "contexts/Shared/infrastructure/persistence";
import { CategoryID } from "contexts/Categories";
import { Config } from "contexts/Shared/infrastructure";

export class SubcategoriesDexieRepository
	extends DexieRepository<Subcategory, SubcategoryID, SubcategoryPrimitives>
	implements ISubcategoriesRepository
{
	constructor(config: typeof Config, protected readonly _db: DexieDB) {
		super(_db, config.subCategoriesTableName);
	}

	async findAllByCategory(categoryID: CategoryID): Promise<Subcategory[]> {
		return (
			await this._table
				.where("category")
				.equals(categoryID.toString())
				.toArray()
		).map((v) => this.mapToDomain(v));
	}

	protected mapToDomain(record: SubcategoryPrimitives): Subcategory {
		return Subcategory.fromPrimitives(record);
	}
}
