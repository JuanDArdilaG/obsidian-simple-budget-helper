import { StringValueObject } from "@juandardilag/value-objects";
import { Nanoid } from "contexts/Shared/domain";
import { Config } from "contexts/Shared/infrastructure/config/config";
import { LocalDB } from "contexts/Shared/infrastructure/persistence/local/local.db";
import { LocalRepository } from "contexts/Shared/infrastructure/persistence/local/local.repository";
import {
	ITransactionsRepository,
	Transaction,
	TransactionPrimitives,
} from "contexts/Transactions/domain";
import { IAccountsRepository } from "../../../../Accounts/domain";
import { ICategoriesRepository } from "../../../../Categories/domain";
import { ISubcategoriesRepository } from "../../../../Subcategories/domain";

export class TransactionsLocalRepository
	extends LocalRepository<string, Transaction, TransactionPrimitives>
	implements ITransactionsRepository
{
	constructor(
		protected readonly _db: LocalDB,
		readonly _accountsRepository: IAccountsRepository,
		readonly _categoriesRepository: ICategoriesRepository,
		readonly _subCategoriesRepository: ISubcategoriesRepository,
	) {
		super(_db, Config.transactionsTableName);
	}

	async findAllUniqueItemStores(): Promise<StringValueObject[]> {
		const allRecords = await this.findAll();
		const uniqueStores = new Set<string>();

		allRecords.forEach((transaction) => {
			const primitives = transaction.toPrimitives();
			if (primitives.store) {
				uniqueStores.add(primitives.store);
			}
		});

		return Array.from(uniqueStores).map(
			(store) => new StringValueObject(store),
		);
	}

	async hasTransactionsForAccount(accountId: Nanoid): Promise<boolean> {
		const allRecords = await this.findAll();

		return allRecords.some((transaction) => {
			const primitives = transaction.toPrimitives();
			// Check if the account is involved in any splits
			return (
				(primitives.fromSplits?.some(
					(split) => split.accountId === accountId.value,
				) ??
					false) ||
				(primitives.toSplits?.some(
					(split) => split.accountId === accountId.value,
				) ??
					false)
			);
		});
	}

	async findByAccountId(accountId: Nanoid): Promise<Transaction[]> {
		const allRecords = await this.findAll();

		return allRecords.filter((transaction) => {
			const primitives = transaction.toPrimitives();
			// Check if the account is involved in any splits
			return (
				(primitives.fromSplits?.some(
					(split) => split.accountId === accountId.value,
				) ??
					false) ||
				(primitives.toSplits?.some(
					(split) => split.accountId === accountId.value,
				) ??
					false)
			);
		});
	}

	protected mapToDomain(record: TransactionPrimitives): Transaction {
		return Transaction.fromPrimitives(record);
	}

	protected mapToPrimitives(entity: Transaction): TransactionPrimitives {
		return entity.toPrimitives();
	}
}
