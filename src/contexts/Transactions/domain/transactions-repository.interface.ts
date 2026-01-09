import { StringValueObject } from "@juandardilag/value-objects";
import { AccountID } from "contexts/Accounts/domain";
import { IRepository } from "contexts/Shared/domain/persistence";
import {
	Transaction,
	TransactionID,
	TransactionPrimitives,
} from "contexts/Transactions/domain";

export interface ITransactionsRepository
	extends IRepository<TransactionID, Transaction, TransactionPrimitives> {
	findAllUniqueItemStores(): Promise<StringValueObject[]>;
	hasTransactionsForAccount(accountId: AccountID): Promise<boolean>;
	findByAccountId(accountId: AccountID): Promise<Transaction[]>;
}
