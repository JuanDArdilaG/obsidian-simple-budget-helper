import { IRepository } from "contexts/Shared/domain";
import { Item, ItemID, ItemPrimitives } from "contexts/Items/domain";

export interface IItemsRepository
	extends IRepository<ItemID, Item, ItemPrimitives> {}
