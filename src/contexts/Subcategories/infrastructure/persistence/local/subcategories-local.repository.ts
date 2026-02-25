import { Config } from "contexts/Shared/infrastructure/config/config";
import { LocalDB } from "contexts/Shared/infrastructure/persistence/local/local.db";
import { LocalRepository } from "contexts/Shared/infrastructure/persistence/local/local.repository";
import {
	ISubcategoriesRepository,
	Subcategory,
	SubcategoryName,
	SubcategoryPrimitives,
} from "contexts/Subcategories/domain";
import { Nanoid } from "../../../../Shared/domain";

export class SubcategoriesLocalRepository
	extends LocalRepository<string, Subcategory, SubcategoryPrimitives>
	implements ISubcategoriesRepository
{
	constructor(protected readonly _db: LocalDB) {
		super(_db, Config.subCategoriesTableName);
	}

	async findAllByCategory(categoryID: Nanoid): Promise<Subcategory[]> {
		return await this.where("category", categoryID.toString());
	}

	async findByName(name: SubcategoryName): Promise<Subcategory | null> {
		const records = await this.where("name", name.toString());
		return records.length > 0 ? records[0] : null;
	}

	protected mapToDomain(record: SubcategoryPrimitives): Subcategory {
		return Subcategory.fromPrimitives(record);
	}

	protected mapToPrimitives(entity: Subcategory): SubcategoryPrimitives {
		return entity.toPrimitives();
	}
}
