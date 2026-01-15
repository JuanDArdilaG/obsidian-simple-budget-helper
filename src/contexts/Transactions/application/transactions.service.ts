import { NumberValueObject } from "@juandardilag/value-objects";
import {
	AccountBalance,
	AccountID,
	IAccountsService,
} from "contexts/Accounts/domain";
import {
	CategoryID,
	CategoryName,
	ICategoriesService,
} from "contexts/Categories/domain";
import { EntityNotFoundError } from "contexts/Shared/domain";
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
	TransactionID,
	TransactionName,
	TransactionOperation,
} from "contexts/Transactions/domain";
import { PaymentSplit } from "../domain/payment-split.valueobject";

export class TransactionsService implements ITransactionsService {
	readonly #logger = new Logger("TransactionsService");
	constructor(
		private readonly _accountsService: IAccountsService,
		private readonly _transactionsRepository: ITransactionsRepository,
		private readonly categoriesService: ICategoriesService,
		private readonly subCategoriesService: ISubCategoriesService
	) {}

	async getAll(): Promise<Transaction[]> {
		return this._transactionsRepository.findAll();
	}

	async getByID(id: TransactionID): Promise<Transaction> {
		const transaction = await this._transactionsRepository.findById(id);
		if (!transaction) throw new EntityNotFoundError("Transaction", id);
		return transaction;
	}

	async getByCategory(category: CategoryID): Promise<Transaction[]> {
		return this._transactionsRepository.findByCriteria(
			new TransactionCriteria().where("category", category.value)
		);
	}

	async getBySubCategory(subCategory: SubCategoryID): Promise<Transaction[]> {
		return this._transactionsRepository.findByCriteria(
			new TransactionCriteria().where("subCategory", subCategory.value)
		);
	}

	async hasTransactionsByCategory(category: CategoryID): Promise<boolean> {
		const transactions = await this.getByCategory(category);
		return transactions.length > 0;
	}

	async hasTransactionsBySubCategory(
		subCategory: SubCategoryID
	): Promise<boolean> {
		const transactions = await this.getBySubCategory(subCategory);
		return transactions.length > 0;
	}

	async reassignTransactionsCategory(
		oldCategory: CategoryID,
		newCategory: CategoryID
	): Promise<void> {
		const transactions = await this.getByCategory(oldCategory);

		for (const transaction of transactions) {
			transaction.updateCategory(newCategory);
			await this._transactionsRepository.persist(transaction);
		}
	}

	async reassignTransactionsSubCategory(
		oldSubCategory: SubCategoryID,
		newSubCategory: SubCategoryID
	): Promise<void> {
		const transactions = await this.getBySubCategory(oldSubCategory);

		// Get the new subcategory to find its parent category
		const newSubCategoryEntity = await this.subCategoriesService.getByID(
			newSubCategory
		);
		const newCategory = newSubCategoryEntity.category;

		for (const transaction of transactions) {
			transaction.updateSubCategory(newSubCategory);
			transaction.updateCategory(newCategory);
			await this._transactionsRepository.persist(transaction);
		}
	}

	async reassignTransactionsCategoryAndSubcategory(
		oldCategory: CategoryID,
		newCategory: CategoryID,
		newSubCategory: SubCategoryID
	): Promise<void> {
		const transactions = await this.getByCategory(oldCategory);

		for (const transaction of transactions) {
			transaction.updateCategory(newCategory);
			transaction.updateSubCategory(newSubCategory);
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
		accountID: AccountID,
		newBalance: AccountBalance
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
			new CategoryName("Adjustment")
		);
		const subCategory =
			await this.subCategoriesService.getByNameWithCreation(
				category.id,
				new SubCategoryName("Adjustment")
			);

		if (account.type.isLiability())
			amountDifference = amountDifference.times(
				new NumberValueObject(-1)
			);

		const fromSplits = [
			new PaymentSplit(accountID, amountDifference.abs()),
		];

		const transaction = Transaction.create(
			fromSplits,
			[],
			new TransactionName(`Adjustment for ${account.name}`),
			new TransactionOperation(
				amountDifference.isPositive() ? "income" : "expense"
			),
			category.id,
			subCategory.id
		);

		await this.record(transaction);
	}

	async update(transaction: Transaction): Promise<void> {
		const prevTransaction = await this.getByID(transaction.id);
		const allAccountIDs = [
			...transaction.originAccounts.map((s) => s.accountId.value),
			...transaction.destinationAccounts.map((s) => s.accountId.value),
			...prevTransaction.originAccounts.map((s) => s.accountId.value),
			...prevTransaction.destinationAccounts.map(
				(s) => s.accountId.value
			),
		];
		const uniqueAccountIDs = Array.from(new Set(allAccountIDs)).map(
			(id) => new AccountID(id)
		);

		for (const accountID of uniqueAccountIDs) {
			const account = await this._accountsService.getByID(accountID);
			account.adjustOnTransactionUpdate(prevTransaction, transaction);
			await this._accountsService.update(account);
		}

		await this._transactionsRepository.persist(transaction);
	}

	async delete(id: TransactionID): Promise<void> {
		const transaction = await this.getByID(id);

		await this._transactionsRepository.deleteById(id);

		await this.#adjustAccountsOnDeletion(transaction);
	}

	async #adjustAccountsOnDeletion(transaction: Transaction) {
		const allAccountIDs = [
			...transaction.originAccounts.map((s) => s.accountId.value),
			...transaction.destinationAccounts.map((s) => s.accountId.value),
		];
		const uniqueAccountIDs = Array.from(new Set(allAccountIDs)).map(
			(id) => new AccountID(id)
		);

		for (const accountID of uniqueAccountIDs) {
			const account = await this._accountsService.getByID(accountID);
			account.adjustOnTransactionDeletion(transaction);
			await this._accountsService.update(account);
		}
	}

	async getTransactionSummariesByCategory(category: CategoryID): Promise<
		Array<{
			id: string;
			name: string;
			amount: number;
			date: string;
			operation: "income" | "expense" | "transfer";
			account?: string;
		}>
	> {
		const transactions = await this.getByCategory(category);
		return transactions.map((transaction) => ({
			id: transaction.id.value,
			name: transaction.name.toString(),
			amount: transaction.operation.isIncome()
				? transaction.originAmount.value
				: -transaction.originAmount.value,
			date: transaction.date.value.toISOString().split("T")[0],
			operation: transaction.operation.value as
				| "income"
				| "expense"
				| "transfer",
			account:
				transaction.originAccounts[0]?.accountId.value ||
				transaction.destinationAccounts[0]?.accountId.value,
		}));
	}

	async getTransactionSummariesBySubCategory(
		subCategory: SubCategoryID
	): Promise<
		Array<{
			id: string;
			name: string;
			amount: number;
			date: string;
			operation: "income" | "expense" | "transfer";
			account?: string;
		}>
	> {
		const transactions = await this.getBySubCategory(subCategory);
		return transactions.map((transaction) => ({
			id: transaction.id.value,
			name: transaction.name.toString(),
			amount: transaction.operation.isIncome()
				? transaction.originAmount.value
				: -transaction.originAmount.value,
			date: transaction.date.value.toISOString().split("T")[0],
			operation: transaction.operation.value as
				| "income"
				| "expense"
				| "transfer",
			account:
				transaction.originAccounts[0]?.accountId.value ||
				transaction.destinationAccounts[0]?.accountId.value,
		}));
	}
}
