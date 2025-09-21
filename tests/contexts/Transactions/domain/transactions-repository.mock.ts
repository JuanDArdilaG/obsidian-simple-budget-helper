import { AccountID } from "contexts/Accounts/domain";
import { ItemBrand } from "contexts/Items/domain";
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
	findByAccountId(accountId: AccountID): Promise<Transaction[]> {
		throw new Error("Method not implemented.");
	}

	async findAllUniqueItemBrands(): Promise<ItemBrand[]> {
		return [];
	}

	async findAllUniqueItemStores(): Promise<ItemBrand[]> {
		return [];
	}

	async hasTransactionsForAccount(accountId: AccountID): Promise<boolean> {
		return false; // Default mock behavior - no transactions
	}
}
