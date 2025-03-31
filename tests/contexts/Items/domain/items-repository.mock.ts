import { RepositoryMock } from "../../Shared/domain/repository.mock";
import {
	IItemsRepository,
	Item,
	ItemBrand,
	ItemID,
	ItemPrimitives,
	ItemStore,
	SimpleItem,
} from "contexts/SimpleItems/domain";

export class ItemsRepositoryMock
	extends RepositoryMock<ItemID, SimpleItem, ItemPrimitives>
	implements IItemsRepository
{
	findAllUniqueItemBrands(): Promise<ItemBrand[]> {
		throw new Error("Method not implemented.");
	}
	findAllUniqueItemStores(): Promise<ItemStore[]> {
		throw new Error("Method not implemented.");
	}
}
