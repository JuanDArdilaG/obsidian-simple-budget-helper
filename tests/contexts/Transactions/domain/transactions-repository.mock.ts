import { StringValueObject } from "@juandardilag/value-objects";
import { Nanoid } from "contexts/Shared/domain";
import {
	ITransactionsRepository,
	Transaction,
	TransactionID,
	TransactionPrimitives,
} from "contexts/Transactions/domain";
import { RepositoryMock } from "../../../../tests/contexts/Shared/domain/repository.mock";

export class TransactionsRepositoryMock
	extends RepositoryMock<TransactionID, Transaction, TransactionPrimitives>
	implements ITransactionsRepository
{
	findByAccountId(accountId: Nanoid): Promise<Transaction[]> {
		throw new Error("Method not implemented.");
	}

	async findAllUniqueItemStores(): Promise<StringValueObject[]> {
		return [];
	}

	async hasTransactionsForAccount(accountId: Nanoid): Promise<boolean> {
		return false; // Default mock behavior - no transactions
	}
}
