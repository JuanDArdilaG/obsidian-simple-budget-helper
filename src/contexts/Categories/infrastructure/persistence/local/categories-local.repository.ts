import {
	Category,
	CategoryID,
	CategoryName,
	CategoryPrimitives,
	ICategoriesRepository,
} from "contexts/Categories/domain";
import { Config } from "contexts/Shared/infrastructure/config/config";
import { LocalDB } from "contexts/Shared/infrastructure/persistence/local/local.db";
import { LocalRepository } from "contexts/Shared/infrastructure/persistence/local/local.repository";

export class CategoriesLocalRepository
	extends LocalRepository<CategoryID, Category, CategoryPrimitives>
	implements ICategoriesRepository
{
	constructor(protected readonly _db: LocalDB) {
		super(_db, Config.categoriesTableName);
	}

	async findByName(name: CategoryName): Promise<Category | null> {
		const records = await this.where("name", name.toString());
		return records.length > 0 ? records[0] : null;
	}

	protected mapToDomain(record: CategoryPrimitives): Category {
		return Category.fromPrimitives(record);
	}

	protected mapToPrimitives(entity: Category): CategoryPrimitives {
		return entity.toPrimitives();
	}
}
