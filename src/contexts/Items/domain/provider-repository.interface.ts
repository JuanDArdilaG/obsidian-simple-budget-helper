import { IRepository } from "contexts/Shared/domain";
import { ItemID } from "./item-id.valueobject";
import { Provider, ProviderPrimitives } from "./provider.entity";

export interface IProviderRepository
	extends IRepository<ItemID, Provider, ProviderPrimitives> {}
