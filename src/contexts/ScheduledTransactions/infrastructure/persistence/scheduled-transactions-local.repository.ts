import { CategoryID } from "contexts/Categories/domain";
import { Config } from "contexts/Shared/infrastructure/config/config";
import { LocalDB } from "contexts/Shared/infrastructure/persistence/local/local.db";
import {
	LocalRepository,
	RepositoryDependencies,
} from "contexts/Shared/infrastructure/persistence/local/local.repository";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { Account, IAccountsRepository } from "../../../Accounts/domain";
import { Nanoid } from "../../../Shared/domain";
import {
	IScheduledTransactionsRepository,
	ScheduledTransaction,
	ScheduledTransactionPrimitives,
} from "../../domain";

export type ScheduledTransactionsDependencies = RepositoryDependencies<Account>;

export class ScheduledTransactionsLocalRepository
	extends LocalRepository<
		Nanoid,
		ScheduledTransaction,
		ScheduledTransactionPrimitives
	>
	implements IScheduledTransactionsRepository
{
	constructor(
		protected readonly _db: LocalDB,
		private readonly _accountsRepository: IAccountsRepository,
	) {
		super(_db, Config.scheduledTransactionsTableName, [
			{ type: "Account", getter: _accountsRepository.findAll },
		]);
	}

	protected mapToDomain(
		record: ScheduledTransactionPrimitives,
		dependencies?: ScheduledTransactionsDependencies,
	): ScheduledTransaction {
		const accounts = dependencies
			? dependencies.get("Account")!
			: new Map<string, Account>();
		return ScheduledTransaction.fromPrimitives(accounts, record);
	}

	protected mapToPrimitives(
		entity: ScheduledTransaction,
	): ScheduledTransactionPrimitives {
		return entity.toPrimitives();
	}

	async findByCategory(
		category: CategoryID,
	): Promise<ScheduledTransaction[]> {
		return this.filter(
			(record) => record.category.category.id === category.value,
		);
	}

	async findBySubCategory(
		subCategory: SubCategoryID,
	): Promise<ScheduledTransaction[]> {
		return this.filter(
			(record) => record.category.subCategory.id === subCategory.value,
		);
	}
}
