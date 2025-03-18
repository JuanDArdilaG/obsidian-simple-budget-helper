import { IRepository } from "contexts/Shared/domain/persistence/repository.interface";
import { Item } from "./item.entity";
import { ItemID } from "./item-id.valueobject";
import { ItemName } from "./item-name.valueobject";

export interface IItemsRepository extends IRepository<Item, ItemID> {
	getAllUniqueItemNames(): Promise<ItemName[]>;
}
