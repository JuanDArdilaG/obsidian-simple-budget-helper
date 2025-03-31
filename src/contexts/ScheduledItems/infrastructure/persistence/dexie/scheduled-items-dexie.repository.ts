import { ItemID } from "contexts/SimpleItems/domain/item-id.valueobject";
import { DexieRepository } from "contexts/Shared/infrastructure/persistence/dexie/dexie.repository";
import { Config } from "contexts/Shared/infrastructure/config/config";
import { DexieDB } from "contexts/Shared/infrastructure/persistence/dexie/dexie.db";
import {
	IScheduledItemsRepository,
	ScheduledItem,
	ScheduledItemPrimitives,
} from "contexts/ScheduledItems/domain";

export class ScheduledItemsDexieRepository
	extends DexieRepository<ScheduledItem, ItemID, ScheduledItemPrimitives>
	implements IScheduledItemsRepository
{
	constructor(config: typeof Config, protected readonly _db: DexieDB) {
		super(_db, config.scheduledItemsTableName);
	}

	protected mapToDomain(record: ScheduledItemPrimitives): ScheduledItem {
		return ScheduledItem.fromPrimitives(record);
	}
}
