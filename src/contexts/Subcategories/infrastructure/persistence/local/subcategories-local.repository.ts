import {
	SubCategory,
	SubCategoryID,
	SubcategoryPrimitives,
	ISubCategoriesRepository,
	SubCategoryName,
} from "contexts/Subcategories/domain";
import { LocalDB } from "contexts/Shared/infrastructure/persistence/local/local.db";
import { LocalRepository } from "contexts/Shared/infrastructure/persistence/local/local.repository";
import { CategoryID } from "contexts/Categories/domain";
import { Config } from "contexts/Shared/infrastructure/config/config";

export class SubcategoriesLocalRepository
	extends LocalRepository<SubCategoryID, SubCategory, SubcategoryPrimitives>
	implements ISubCategoriesRepository
{
	constructor(protected readonly _db: LocalDB) {
		super(_db, Config.subCategoriesTableName);
	}

	async findAllByCategory(categoryID: CategoryID): Promise<SubCategory[]> {
		return await this.where("category", categoryID.toString());
	}

	async findByName(name: SubCategoryName): Promise<SubCategory | null> {
		const records = await this.where("name", name.toString());
		return records.length > 0 ? records[0] : null;
	}

	protected mapToDomain(record: SubcategoryPrimitives): SubCategory {
		return SubCategory.fromPrimitives(record);
	}

	protected mapToPrimitives(entity: SubCategory): SubcategoryPrimitives {
		return entity.toPrimitives();
	}
}
