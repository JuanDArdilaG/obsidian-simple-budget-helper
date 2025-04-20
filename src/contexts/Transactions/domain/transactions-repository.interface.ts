import { ItemBrand, ItemStore } from "contexts/Items/domain";
import { IRepository } from "contexts/Shared/domain/persistence";
import {
	TransactionID,
	Transaction,
	TransactionPrimitives,
} from "contexts/Transactions/domain";

export interface ITransactionsRepository
	extends IRepository<TransactionID, Transaction, TransactionPrimitives> {
	findAllUniqueItemBrands(): Promise<ItemBrand[]>;
	findAllUniqueItemStores(): Promise<ItemStore[]>;
}
