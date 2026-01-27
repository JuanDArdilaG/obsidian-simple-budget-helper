import { Config } from "contexts/Shared/infrastructure/config/config";
import { DexieDB } from "contexts/Shared/infrastructure/persistence/dexie/dexie.db";
import { DexieRepository } from "contexts/Shared/infrastructure/persistence/dexie/dexie.repository";
import {
	ISubcategoriesRepository,
	Subcategory,
	SubcategoryName,
	SubcategoryPrimitives,
} from "contexts/Subcategories/domain";
import { Nanoid } from "../../../../Shared/domain";

export class SubcategoriesDexieRepository
	extends DexieRepository<Subcategory, string, SubcategoryPrimitives>
	implements ISubcategoriesRepository
{
	constructor(protected readonly _db: DexieDB) {
		super(_db, Config.subCategoriesTableName);
	}

	async findAllByCategory(categoryID: Nanoid): Promise<Subcategory[]> {
		return (
			await this._table
				.where("category")
				.equals(categoryID.toString())
				.toArray()
		).map((v) => this.mapToDomain(v));
	}

	async findByName(name: SubcategoryName): Promise<Subcategory | null> {
		const record = await this._table
			.where("name")
			.equals(name.toString())
			.limit(1)
			.first();
		if (!record) return null;
		return this.mapToDomain(record);
	}

	protected mapToDomain(record: SubcategoryPrimitives): Subcategory {
		return Subcategory.fromPrimitives(record);
	}
}
