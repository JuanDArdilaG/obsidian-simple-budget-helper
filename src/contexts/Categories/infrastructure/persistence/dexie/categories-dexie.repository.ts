import {
	Category,
	CategoryID,
	CategoryName,
	CategoryPrimitives,
	ICategoriesRepository,
} from "contexts/Categories/domain";
import { Config } from "contexts/Shared/infrastructure/config/config";
import { DexieDB } from "contexts/Shared/infrastructure/persistence/dexie/dexie.db";
import { DexieRepository } from "contexts/Shared/infrastructure/persistence/dexie/dexie.repository";

export class CategoriesDexieRepository
	extends DexieRepository<Category, CategoryID, CategoryPrimitives>
	implements ICategoriesRepository
{
	constructor(config: typeof Config, protected readonly _db: DexieDB) {
		super(_db, config.categoriesTableName);
	}

	async findByName(name: CategoryName): Promise<Category | null> {
		const record = await this._table
			.where("name")
			.equals(name.toString())
			.limit(1)
			.first();
		if (!record) return null;
		return this.mapToDomain(record);
	}

	protected mapToDomain(record: CategoryPrimitives): Category {
		return Category.fromPrimitives(record);
	}
}
