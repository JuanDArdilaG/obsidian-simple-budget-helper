import { CategoryID } from "contexts/Categories/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
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
		Nanoid,
		ScheduledTransaction,
		ScheduledTransactionPrimitives
	>
	implements IScheduledTransactionsRepository
{
	findAllUniqueItemStores(): Promise<Store[]> {
		throw new Error("Method not implemented.");
	}
	findByCategory(category: CategoryID): Promise<ScheduledTransaction[]> {
		throw new Error("Method not implemented.");
	}
	findBySubCategory(
		subCategory: SubCategoryID
	): Promise<ScheduledTransaction[]> {
		throw new Error("Method not implemented.");
	}
}
