import {
	Item,
	ItemID,
	ItemPrimitives,
	ScheduledItem,
	ScheduledItemPrimitives,
} from "contexts/Items/domain";
import { IRepository } from "contexts/Shared/domain";

export interface IItemsRepository
	extends IRepository<ItemID, Item, ItemPrimitives> {}

export interface IScheduledItemsRepository
	extends IRepository<ItemID, ScheduledItem, ScheduledItemPrimitives> {}
