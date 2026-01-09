import { CategoryID } from "contexts/Categories/domain";
import { Config } from "contexts/Shared/infrastructure/config/config";
import { LocalDB } from "contexts/Shared/infrastructure/persistence/local/local.db";
import { LocalRepository } from "contexts/Shared/infrastructure/persistence/local/local.repository";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { Nanoid } from "../../../../Shared/domain";
import {
	ScheduledItem,
	ScheduledItemPrimitives,
} from "../../../domain/old/scheduled-item.entity";

export class ScheduledItemsLocalRepository extends LocalRepository<
	Nanoid,
	ScheduledItem,
	ScheduledItemPrimitives
> {
	constructor(protected readonly _db: LocalDB) {
		super(_db, Config.scheduledItemsTableOldName);
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
