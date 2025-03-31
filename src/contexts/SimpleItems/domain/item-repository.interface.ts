import { IRepository } from "contexts/Shared/domain";
import {
	Item,
	ItemID,
	ItemBrand,
	ItemStore,
	ItemPrimitives,
	SimpleItem,
} from "contexts/SimpleItems/domain";

export interface IItemsRepository
	extends IRepository<ItemID, SimpleItem, ItemPrimitives> {
	findAllUniqueItemBrands(): Promise<ItemBrand[]>;
	findAllUniqueItemStores(): Promise<ItemStore[]>;
}
