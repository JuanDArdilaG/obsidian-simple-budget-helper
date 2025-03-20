import {
	Category,
	CategoryID,
	CategoryPrimitives,
	ICategoriesRepository,
} from "contexts/Categories/domain";
import { Config } from "contexts/Shared/infrastructure";
import {
	DexieDB,
	DexieRepository,
} from "contexts/Shared/infrastructure/persistence";

export class CategoriesDexieRepository
	extends DexieRepository<Category, CategoryID, CategoryPrimitives>
	implements ICategoriesRepository
{
	constructor(config: typeof Config, protected readonly _db: DexieDB) {
		super(_db, config.categoriesTableName);
	}

	protected mapToDomain(record: CategoryPrimitives): Category {
		return Category.fromPrimitives(record);
	}
}
