import { Item, ItemType } from "contexts/Items/domain";
import { ItemID } from "contexts/Items/domain/item-id.valueobject";
import { IItemsRepository } from "contexts/Items/domain/item-repository.interface";
import { ItemPrimitives } from "contexts/Items/domain/item.entity";
import {
	ProductItem,
	ProductItemPrimitives,
} from "contexts/Items/domain/product-item.entity";
import {
	ServiceItem,
	ServiceItemPrimitives,
} from "contexts/Items/domain/service-item.entity";
import { Config } from "contexts/Shared/infrastructure/config/config";
import { LocalDB } from "contexts/Shared/infrastructure/persistence/local/local.db";
import { LocalRepository } from "contexts/Shared/infrastructure/persistence/local/local.repository";

export class ItemsLocalRepository
	extends LocalRepository<ItemID, Item, ItemPrimitives>
	implements IItemsRepository
{
	constructor(protected readonly _db: LocalDB) {
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

	protected mapToPrimitives(entity: Item): ItemPrimitives {
		return entity.toPrimitives();
	}
}
