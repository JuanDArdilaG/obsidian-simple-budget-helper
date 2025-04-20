import {
	TransactionID,
	Transaction,
	TransactionPrimitives,
	ITransactionsRepository,
} from "contexts/Transactions/domain";
import { RepositoryMock } from "../../../../tests/contexts/Shared/domain/repository.mock";
import { ItemBrand } from "contexts/Items/domain";

export class TransactionsRepositoryMock
	extends RepositoryMock<TransactionID, Transaction, TransactionPrimitives>
	implements ITransactionsRepository
{
	async findAllUniqueItemBrands(): Promise<ItemBrand[]> {
		return [];
	}

	async findAllUniqueItemStores(): Promise<ItemBrand[]> {
		return [];
	}
}
