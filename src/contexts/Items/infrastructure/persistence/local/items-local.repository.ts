import { Item } from "contexts/Items/domain";
import { ItemID } from "contexts/Items/domain/item-id.valueobject";
import { IItemsRepository } from "contexts/Items/domain/item-repository.interface";
import { ItemPrimitives } from "contexts/Items/domain/item.entity";
import { LocalRepository } from "contexts/Shared/infrastructure/persistence/local/local.repository";
import { Config } from "contexts/Shared/infrastructure/config/config";
import { LocalDB } from "contexts/Shared/infrastructure/persistence/local/local.db";

export class ItemsLocalRepository
	extends LocalRepository<ItemID, Item, ItemPrimitives>
	implements IItemsRepository
{
	constructor(protected readonly _db: LocalDB) {
		super(_db, Config.itemsTableName);
	}

	protected mapToDomain(record: ItemPrimitives): Item {
		return Item.fromPrimitives(record);
	}

	protected mapToPrimitives(entity: Item): ItemPrimitives {
		return entity.toPrimitives();
	}
}
