import { Item, ItemPrimitivesOld } from "contexts/Items/domain";
import { ItemID } from "contexts/Items/domain/item-id.valueobject";
import { IItemsRepository } from "contexts/Items/domain/item-repository.interface";
import { ItemPrimitives } from "contexts/Items/domain/item.entity";
import { DexieRepository } from "contexts/Shared/infrastructure/persistence/dexie/dexie.repository";
import { Config } from "contexts/Shared/infrastructure/config/config";
import { DexieDB } from "contexts/Shared/infrastructure/persistence/dexie/dexie.db";

export class ItemsDexieRepository
	extends DexieRepository<Item, ItemID, ItemPrimitives>
	implements IItemsRepository
{
	constructor(config: typeof Config, protected readonly _db: DexieDB) {
		super(_db, config.itemsTableName);
	}

	protected mapToDomain(record: ItemPrimitives): Item {
		return Item.fromPrimitives(record);
	}
}
