import { CategoryID } from "contexts/Categories/domain";
import { ItemID } from "contexts/Items/domain/item-id.valueobject";
import { IScheduledItemsRepository } from "contexts/Items/domain/item-repository.interface";
import {
	ScheduledItem,
	ScheduledItemPrimitives,
} from "contexts/Items/domain/scheduled-item.entity";
import { Config } from "contexts/Shared/infrastructure/config/config";
import { LocalDB } from "contexts/Shared/infrastructure/persistence/local/local.db";
import { LocalRepository } from "contexts/Shared/infrastructure/persistence/local/local.repository";
import { SubCategoryID } from "contexts/Subcategories/domain";

export class ScheduledItemsLocalRepository
	extends LocalRepository<ItemID, ScheduledItem, ScheduledItemPrimitives>
	implements IScheduledItemsRepository
{
	constructor(protected readonly _db: LocalDB) {
		super(_db, Config.scheduledItemsTableName);
	}

	protected mapToDomain(record: ScheduledItemPrimitives): ScheduledItem {
		return ScheduledItem.fromPrimitives(record);
	}

	protected mapToPrimitives(entity: ScheduledItem): ScheduledItemPrimitives {
		return entity.toPrimitives();
	}

	async findByCategory(category: CategoryID): Promise<ScheduledItem[]> {
		return this.where("category", category.value);
	}

	async findBySubCategory(
		subCategory: SubCategoryID
	): Promise<ScheduledItem[]> {
		return this.where("subCategory", subCategory.value);
	}
}
