import { IRepository } from "contexts/Shared/domain";
import { Store, StorePrimitives } from "./store.entity";

export interface IStoreRepository extends IRepository<
	string,
	Store,
	StorePrimitives
> {}
