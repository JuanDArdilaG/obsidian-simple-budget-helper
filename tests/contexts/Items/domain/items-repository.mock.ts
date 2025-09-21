import { CategoryID } from "contexts/Categories/domain";
import {
	IScheduledItemsRepository,
	ItemBrand,
	ItemID,
	ItemStore,
	ScheduledItem,
	ScheduledItemPrimitives,
} from "contexts/Items/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { RepositoryMock } from "../../Shared/domain/repository.mock";

export class ItemsRepositoryMock
	extends RepositoryMock<ItemID, ScheduledItem, ScheduledItemPrimitives>
	implements IScheduledItemsRepository
{
	findAllUniqueItemBrands(): Promise<ItemBrand[]> {
		throw new Error("Method not implemented.");
	}
	findAllUniqueItemStores(): Promise<ItemStore[]> {
		throw new Error("Method not implemented.");
	}
	findByCategory(category: CategoryID): Promise<ScheduledItem[]> {
		throw new Error("Method not implemented.");
	}
	findBySubCategory(subCategory: SubCategoryID): Promise<ScheduledItem[]> {
		throw new Error("Method not implemented.");
	}
}
