import { IRepository } from "contexts/Shared/domain";
import {
	Item,
	ItemID,
	ItemBrand,
	ItemStore,
	ItemPrimitives,
} from "contexts/Items/domain";

export interface IItemsRepository
	extends IRepository<ItemID, Item, ItemPrimitives> {}
