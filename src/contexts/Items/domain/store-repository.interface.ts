import { IRepository } from "contexts/Shared/domain";
import { ItemID } from "./item-id.valueobject";
import { Store, StorePrimitives } from "./store.entity";

export interface IStoreRepository
	extends IRepository<ItemID, Store, StorePrimitives> {}
