import { CategoryID } from "contexts/Categories/domain";
import {
	Item,
	ItemID,
	ItemPrimitives,
	ScheduledItem,
	ScheduledItemPrimitives,
} from "contexts/Items/domain";
import { IRepository } from "contexts/Shared/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";

export interface IItemsRepository
	extends IRepository<ItemID, Item, ItemPrimitives> {}

export interface IScheduledItemsRepository
	extends IRepository<ItemID, ScheduledItem, ScheduledItemPrimitives> {
	findByCategory(category: CategoryID): Promise<ScheduledItem[]>;
	findBySubCategory(subCategory: SubCategoryID): Promise<ScheduledItem[]>;
}
