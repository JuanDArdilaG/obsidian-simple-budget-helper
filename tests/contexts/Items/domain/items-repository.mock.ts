import {
	IScheduledTransactionsRepository,
	ScheduledTransaction,
	ScheduledTransactionPrimitives,
} from "../../../../src/contexts/ScheduledTransactions/domain";
import { Nanoid } from "../../../../src/contexts/Shared/domain";
import { Store } from "../../../../src/contexts/Stores/domain";
import { RepositoryMock } from "../../Shared/domain/repository.mock";

export class ItemsRepositoryMock
	extends RepositoryMock<
		string,
		ScheduledTransaction,
		ScheduledTransactionPrimitives
	>
	implements IScheduledTransactionsRepository
{
	findAllUniqueItemStores(): Promise<Store[]> {
		throw new Error("Method not implemented.");
	}
	findByCategory(category: Nanoid): Promise<ScheduledTransaction[]> {
		throw new Error("Method not implemented.");
	}
	findBySubCategory(subCategory: Nanoid): Promise<ScheduledTransaction[]> {
		throw new Error("Method not implemented.");
	}
}
