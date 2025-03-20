import { IRepository } from "contexts/Shared/domain";
import {
	Item,
	ItemID,
	ItemName,
	ItemBrand,
	ItemStore,
} from "contexts/Items/domain";

export interface IItemsRepository extends IRepository<ItemID, Item> {
	findAllUniqueItemNames(): Promise<ItemName[]>;
	findAllUniqueItemBrands(): Promise<ItemBrand[]>;
	findAllUniqueItemStores(): Promise<ItemStore[]>;
}
