import { AccountID } from "contexts/Accounts/domain";
import { ItemBrand, ItemStore } from "contexts/Items/domain";
import { IRepository } from "contexts/Shared/domain/persistence";
import {
	Transaction,
	TransactionID,
	TransactionPrimitives,
} from "contexts/Transactions/domain";

export interface ITransactionsRepository
	extends IRepository<TransactionID, Transaction, TransactionPrimitives> {
	findAllUniqueItemBrands(): Promise<ItemBrand[]>;
	findAllUniqueItemStores(): Promise<ItemStore[]>;
	hasTransactionsForAccount(accountId: AccountID): Promise<boolean>;
}
