import {
	Item,
	ItemType,
	ProductItem,
	ProductItemPrimitives,
	ServiceItem,
	ServiceItemPrimitives,
} from "contexts/Items/domain";
import { ItemID } from "contexts/Items/domain/item-id.valueobject";
import { IItemsRepository } from "contexts/Items/domain/item-repository.interface";
import { ItemPrimitives } from "contexts/Items/domain/item.entity";
import { Config } from "contexts/Shared/infrastructure/config/config";
import { DexieDB } from "contexts/Shared/infrastructure/persistence/dexie/dexie.db";
import { DexieRepository } from "contexts/Shared/infrastructure/persistence/dexie/dexie.repository";

export class ItemsDexieRepository
	extends DexieRepository<Item, ItemID, ItemPrimitives>
	implements IItemsRepository
{
	constructor(protected readonly _db: DexieDB) {
		super(_db, Config.itemsTableName);
	}

	protected mapToDomain(record: ItemPrimitives): Item {
		if (record.type === ItemType.PRODUCT) {
			return ProductItem.fromPrimitives(record as ProductItemPrimitives);
		} else if (record.type === ItemType.SERVICE) {
			return ServiceItem.fromPrimitives(record as ServiceItemPrimitives);
		}
		throw new Error(`Unknown item type: ${record.type}`);
	}
}
