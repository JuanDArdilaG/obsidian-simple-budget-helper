import { ItemBrand, ItemStore } from "contexts/Items/domain";
import { ItemID } from "contexts/Items/domain/item-id.valueobject";
import { ItemName } from "contexts/Items/domain/item-name.valueobject";
import { IItemsRepository } from "contexts/Items/domain/item-repository.interface";
import { Item, ItemPrimitives } from "contexts/Items/domain/item.entity";
import {
	RecurrentItem,
	RecurrentItemPrimitives,
} from "contexts/Items/domain/RecurrentItem/recurrent-item.entity";
import { SimpleItem } from "contexts/Items/domain/simple-item.entity";
import { Config, DexieDB } from "contexts/Shared/infrastructure";
import { DexieRepository } from "contexts/Shared/infrastructure/persistence/dexie/dexie.repository";

export class ItemsDexieRepository
	extends DexieRepository<Item, ItemID, ItemPrimitives>
	implements IItemsRepository
{
	constructor(config: typeof Config, protected readonly _db: DexieDB) {
		super(_db, config.itemsTableName);
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

	protected mapToDomain(record: ItemPrimitives): Item {
		return record.nextDate
			? RecurrentItem.fromPrimitives({
					nextDate: new Date(),
					frequency: "",
					...record,
			  })
			: SimpleItem.fromPrimitives(record);
	}
}
