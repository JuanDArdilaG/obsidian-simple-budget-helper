import { ItemBrand, ItemStore } from "contexts/SimpleItems/domain";
import { ItemID } from "contexts/SimpleItems/domain/item-id.valueobject";
import { IItemsRepository } from "contexts/SimpleItems/domain/item-repository.interface";
import {
	ItemPrimitives,
	OldItemPrimitives,
} from "contexts/SimpleItems/domain/item.entity";
import { SimpleItem } from "contexts/SimpleItems/domain/simple-item.entity";
import { DexieRepository } from "contexts/Shared/infrastructure/persistence/dexie/dexie.repository";
import { Config } from "contexts/Shared/infrastructure/config/config";
import { DexieDB } from "contexts/Shared/infrastructure/persistence/dexie/dexie.db";

export class SimpleItemsDexieRepository
	extends DexieRepository<SimpleItem, ItemID, ItemPrimitives>
	implements IItemsRepository
{
	constructor(config: typeof Config, protected readonly _db: DexieDB) {
		super(_db, config.simpleItemsTableName);
	}

	async findAllUniqueItemBrands(): Promise<ItemBrand[]> {
		return (await this._table.orderBy("brand").uniqueKeys()).map(
			(brand) => new ItemBrand(brand.toString())
		);
	}

	async findAllUniqueItemStores(): Promise<ItemStore[]> {
		return (await this._table.orderBy("store").uniqueKeys()).map(
			(store) => new ItemStore(store.toString())
		);
	}

	protected mapToDomain(record: OldItemPrimitives): SimpleItem {
		return SimpleItem.fromPrimitives(record);
	}
}
