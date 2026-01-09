import { CategoryID } from "contexts/Categories/domain";
import { Config } from "contexts/Shared/infrastructure/config/config";
import { LocalDB } from "contexts/Shared/infrastructure/persistence/local/local.db";
import { LocalRepository } from "contexts/Shared/infrastructure/persistence/local/local.repository";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { Nanoid } from "../../../Shared/domain";
import {
	IScheduledTransactionsRepository,
	ScheduledTransaction,
	ScheduledTransactionPrimitives,
} from "../../domain";

export class ScheduledTransactionsLocalRepository
	extends LocalRepository<
		Nanoid,
		ScheduledTransaction,
		ScheduledTransactionPrimitives
	>
	implements IScheduledTransactionsRepository
{
	constructor(protected readonly _db: LocalDB) {
		super(_db, Config.scheduledTransactionsTableName);
	}

	protected mapToDomain(
		record: ScheduledTransactionPrimitives
	): ScheduledTransaction {
		return ScheduledTransaction.fromPrimitives(record);
	}

	protected mapToPrimitives(
		entity: ScheduledTransaction
	): ScheduledTransactionPrimitives {
		return entity.toPrimitives();
	}

	async findByCategory(
		category: CategoryID
	): Promise<ScheduledTransaction[]> {
		return this.where("category", category.value);
	}

	async findBySubCategory(
		subCategory: SubCategoryID
	): Promise<ScheduledTransaction[]> {
		return this.where("subCategory", subCategory.value);
	}
}
