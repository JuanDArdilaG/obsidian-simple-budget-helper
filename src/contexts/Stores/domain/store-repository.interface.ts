import { IRepository, Nanoid } from "contexts/Shared/domain";
import { Store, StorePrimitives } from "./store.entity";

export interface IStoreRepository
	extends IRepository<Nanoid, Store, StorePrimitives> {}
