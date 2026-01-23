import { NumberValueObject } from "@juandardilag/value-objects";
import { AccountBalance, IAccountsService } from "contexts/Accounts/domain";
import {
	Category,
	CategoryID,
	CategoryName,
	ICategoriesService,
} from "contexts/Categories/domain";
import { EntityNotFoundError, Nanoid } from "contexts/Shared/domain";
import { Logger } from "contexts/Shared/infrastructure/logger";
import {
	ISubCategoriesService,
	SubCategoryID,
	SubCategoryName,
} from "contexts/Subcategories/domain";
import {
	ITransactionsRepository,
	ITransactionsService,
	Transaction,
	TransactionCriteria,
	TransactionDate,
	TransactionName,
	TransactionOperation,
} from "contexts/Transactions/domain";
import { AccountSplit } from "../domain/account-split.valueobject";

export class TransactionsService implements ITransactionsService {
	readonly #logger = new Logger("TransactionsService");
	constructor(
		private readonly _accountsService: IAccountsService,
		private readonly _transactionsRepository: ITransactionsRepository,
		private readonly categoriesService: ICategoriesService,
		private readonly subCategoriesService: ISubCategoriesService,
	) {}

	async getAll(): Promise<Transaction[]> {
		return this._transactionsRepository.findAll();
	}

	async getByID(id: Nanoid): Promise<Transaction> {
		const transaction = await this._transactionsRepository.findById(id);
		if (!transaction) throw new EntityNotFoundError("Transaction", id);
		return transaction;
	}

	async getByCategory(category: CategoryID): Promise<Transaction[]> {
		return this._transactionsRepository.findByCriteria(
			new TransactionCriteria().where("category", category.value),
		);
	}

	async getBySubCategory(subCategory: SubCategoryID): Promise<Transaction[]> {
		return this._transactionsRepository.findByCriteria(
			new TransactionCriteria().where("subCategory", subCategory.value),
		);
	}

	async hasTransactionsByCategory(category: CategoryID): Promise<boolean> {
		const transactions = await this.getByCategory(category);
		return transactions.length > 0;
	}

	async hasTransactionsBySubCategory(
		subCategory: SubCategoryID,
	): Promise<boolean> {
		const transactions = await this.getBySubCategory(subCategory);
		return transactions.length > 0;
	}

	async reassignTransactionsCategory(
		oldCategory: Category,
		newCategory: Category,
	): Promise<void> {
		const transactions = await this.getByCategory(oldCategory.id);

		for (const transaction of transactions) {
			transaction.updateCategory(newCategory);
			await this._transactionsRepository.persist(transaction);
		}
	}

	async reassignTransactionsSubCategory(
		oldSubCategory: SubCategoryID,
		newSubCategory: SubCategoryID,
	): Promise<void> {
		const transactions = await this.getBySubCategory(oldSubCategory);

		// Get the new subcategory to find its parent category
		const newSubCategoryEntity =
			await this.subCategoriesService.getByID(newSubCategory);
		const newCategory = newSubCategoryEntity.category;
		const newCategoryEntity =
			await this.categoriesService.getByID(newCategory);

		for (const transaction of transactions) {
			transaction.updateSubCategory(newSubCategoryEntity);
			transaction.updateCategory(newCategoryEntity);
			await this._transactionsRepository.persist(transaction);
		}
	}

	async reassignTransactionsCategoryAndSubcategory(
		oldCategory: CategoryID,
		newCategory: CategoryID,
		newSubCategory: SubCategoryID,
	): Promise<void> {
		const transactions = await this.getByCategory(oldCategory);

		const newCategoryEntity =
			await this.categoriesService.getByID(newCategory);
		const newSubCategoryEntity =
			await this.subCategoriesService.getByID(newSubCategory);

		for (const transaction of transactions) {
			transaction.updateCategory(newCategoryEntity);
			transaction.updateSubCategory(newSubCategoryEntity);
			await this._transactionsRepository.persist(transaction);
		}
	}

	async record(transaction: Transaction): Promise<void> {
		this.#logger.debug("recording transaction", {
			transaction,
		});

		await this._accountsService.adjustOnTransaction(transaction);
		await this._transactionsRepository.persist(transaction);

		this.#logger.debug("transaction recorded");
	}

	async accountAdjustment(
		accountID: Nanoid,
		newBalance: AccountBalance,
	): Promise<void> {
		const account = await this._accountsService.getByID(accountID);
		let amountDifference = account.balance.adjust(newBalance.value);

		this.#logger
			.debugB("accountAdjustment", {
				account: account.toPrimitives(),
				newBalance: newBalance.value.toString(),
				amountDifference: amountDifference.toString(),
			})
			.log();
		if (amountDifference.isZero()) return;

		const category = await this.categoriesService.getByNameWithCreation(
			new CategoryName("Adjustment"),
		);
		const subCategory =
			await this.subCategoriesService.getByNameWithCreation(
				category.id,
				new SubCategoryName("Adjustment"),
			);

		if (account.type.isLiability())
			amountDifference = amountDifference.times(
				new NumberValueObject(-1),
			);

		const fromSplits = [new AccountSplit(account, amountDifference.abs())];

		const transaction = Transaction.create(
			TransactionDate.createNowDate(),
			fromSplits,
			[],
			new TransactionName(`Adjustment for ${account.name}`),
			new TransactionOperation(
				amountDifference.isPositive() ? "income" : "expense",
			),
			category,
			subCategory,
		);

		await this.record(transaction);
	}

	async update(transaction: Transaction): Promise<void> {
		const prevTransaction = await this.getByID(transaction.id);
		const allAccountIDs = [
			...transaction.originAccounts.map((s) => s.account.id.value),
			...transaction.destinationAccounts.map((s) => s.account.id.value),
			...prevTransaction.originAccounts.map((s) => s.account.id.value),
			...prevTransaction.destinationAccounts.map(
				(s) => s.account.id.value,
			),
		];
		const uniqueAccountIDs = Array.from(new Set(allAccountIDs)).map(
			(id) => new Nanoid(id),
		);

		for (const accountID of uniqueAccountIDs) {
			const account = await this._accountsService.getByID(accountID);
			account.adjustOnTransactionUpdate(prevTransaction, transaction);
			await this._accountsService.update(account);
		}

		await this._transactionsRepository.persist(transaction);
	}

	async delete(id: Nanoid): Promise<void> {
		const transaction = await this.getByID(id);

		await this._transactionsRepository.deleteById(id);

		await this.#adjustAccountsOnDeletion(transaction);
	}

	async #adjustAccountsOnDeletion(transaction: Transaction) {
		const allAccountIDs = [
			...transaction.originAccounts.map((s) => s.account.id.value),
			...transaction.destinationAccounts.map((s) => s.account.id.value),
		];
		const uniqueAccountIDs = Array.from(new Set(allAccountIDs)).map(
			(id) => new Nanoid(id),
		);

		for (const accountID of uniqueAccountIDs) {
			const account = await this._accountsService.getByID(accountID);
			account.adjustOnTransactionDeletion(transaction);
			await this._accountsService.update(account);
		}
	}

	async getTransactionsByCategory(
		category: CategoryID,
	): Promise<Array<Transaction>> {
		return await this.getByCategory(category);
	}

	async getTransactionsBySubCategory(
		subCategory: SubCategoryID,
	): Promise<Array<Transaction>> {
		return await this.getBySubCategory(subCategory);
	}
}
