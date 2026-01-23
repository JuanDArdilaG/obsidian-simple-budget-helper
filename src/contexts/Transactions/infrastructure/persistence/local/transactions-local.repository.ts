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
import { Account, IAccountsRepository } from "../../../../Accounts/domain";
import { Category, ICategoriesRepository } from "../../../../Categories/domain";
import {
	ISubCategoriesRepository,
	SubCategory,
} from "../../../../Subcategories/domain";

export type TransactionDependencies = Map<
	string,
	Map<string, Account | Category | SubCategory>
>;

export class TransactionsLocalRepository
	extends LocalRepository<Nanoid, Transaction, TransactionPrimitives>
	implements ITransactionsRepository
{
	constructor(
		protected readonly _db: LocalDB,
		readonly _accountsRepository: IAccountsRepository,
		readonly _categoriesRepository: ICategoriesRepository,
		readonly _subCategoriesRepository: ISubCategoriesRepository,
	) {
		super(_db, Config.transactionsTableName, [
			{
				type: "Account",
				getter: _accountsRepository.findAll.bind(_accountsRepository),
			},
			{
				type: "Category",
				getter: _categoriesRepository.findAll.bind(
					_categoriesRepository,
				),
			},
			{
				type: "SubCategory",
				getter: _subCategoriesRepository.findAll.bind(
					_subCategoriesRepository,
				),
			},
		]);
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

	protected mapToDomain(
		record: TransactionPrimitives,
		dependencies?: TransactionDependencies,
	): Transaction {
		const accounts = dependencies?.get("Account") as Map<string, Account>;
		const categories = dependencies?.get("Category") as Map<
			string,
			Category
		>;
		const subCategories = dependencies?.get("SubCategory") as Map<
			string,
			SubCategory
		>;
		if (!accounts || !categories || !subCategories) {
			throw new Error(
				"Missing dependencies to map Transaction entity from primitives",
			);
		}
		const category = categories.get(record.category);
		if (!category) {
			throw new Error(
				`Category with ID ${record.category} not found for Transaction mapping`,
			);
		}
		const subCategory = subCategories.get(record.subCategory);
		if (!subCategory) {
			throw new Error(
				`SubCategory with ID ${record.subCategory} not found for Transaction mapping`,
			);
		}
		return Transaction.fromPrimitives(
			accounts,
			category,
			subCategory,
			record,
		);
	}

	protected mapToPrimitives(entity: Transaction): TransactionPrimitives {
		return entity.toPrimitives();
	}
}
