import { StringValueObject } from "@juandardilag/value-objects";
import { Nanoid } from "contexts/Shared/domain";
import { IRepository } from "contexts/Shared/domain/persistence";
import {
	Transaction,
	TransactionID,
	TransactionPrimitives,
} from "contexts/Transactions/domain";

export interface ITransactionsRepository extends IRepository<
	TransactionID,
	Transaction,
	TransactionPrimitives
> {
	findAllUniqueItemStores(): Promise<StringValueObject[]>;
	hasTransactionsForAccount(accountId: Nanoid): Promise<boolean>;
	findByAccountId(accountId: Nanoid): Promise<Transaction[]>;
}
