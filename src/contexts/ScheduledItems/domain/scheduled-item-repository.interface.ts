import { IRepository } from "contexts/Shared/domain";
import { ItemID, ItemBrand, ItemStore } from "contexts/SimpleItems/domain";
import {
	ScheduledItem,
	ScheduledItemPrimitives,
} from "./scheduled-item.entity";

export interface IScheduledItemsRepository
	extends IRepository<ItemID, ScheduledItem, ScheduledItemPrimitives> {}
