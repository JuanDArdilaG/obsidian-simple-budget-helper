import { Config } from "contexts/Shared/infrastructure/config/config";
import { LocalDB } from "contexts/Shared/infrastructure/persistence/local/local.db";
import { LocalRepository } from "contexts/Shared/infrastructure/persistence/local/local.repository";
import { IAccountsRepository } from "../../../Accounts/domain";
import { Nanoid } from "../../../Shared/domain";
import {
	IScheduledTransactionsRepository,
	ScheduledTransaction,
	ScheduledTransactionPrimitives,
} from "../../domain";

export class ScheduledTransactionsLocalRepository
	extends LocalRepository<
		string,
		ScheduledTransaction,
		ScheduledTransactionPrimitives
	>
	implements IScheduledTransactionsRepository
{
	constructor(
		protected readonly _db: LocalDB,
		private readonly _accountsRepository: IAccountsRepository,
	) {
		super(_db, Config.scheduledTransactionsTableName);
	}

	protected mapToDomain(
		record: ScheduledTransactionPrimitives,
	): ScheduledTransaction {
		return ScheduledTransaction.fromPrimitives(record);
	}

	protected mapToPrimitives(
		entity: ScheduledTransaction,
	): ScheduledTransactionPrimitives {
		return entity.toPrimitives();
	}

	async findByCategory(category: Nanoid): Promise<ScheduledTransaction[]> {
		return this.filter((record) => record.category === category.value);
	}

	async findBySubCategory(
		subCategory: Nanoid,
	): Promise<ScheduledTransaction[]> {
		return this.filter(
			(record) => record.subcategory === subCategory.value,
		);
	}
}
