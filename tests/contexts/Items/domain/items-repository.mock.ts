import { RepositoryMock } from "../../Shared/domain/repository.mock";
import {
	IItemsRepository,
	ItemBrand,
	ItemID,
	ItemPrimitives,
	ItemStore,
	Item,
} from "contexts/Items/domain";

export class ItemsRepositoryMock
	extends RepositoryMock<ItemID, Item, ItemPrimitives>
	implements IItemsRepository
{
	findAllUniqueItemBrands(): Promise<ItemBrand[]> {
		throw new Error("Method not implemented.");
	}
	findAllUniqueItemStores(): Promise<ItemStore[]> {
		throw new Error("Method not implemented.");
	}
}
