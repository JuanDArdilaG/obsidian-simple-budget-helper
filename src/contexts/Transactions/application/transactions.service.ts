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
		private readonly _categoriesService: ICategoriesService,
		private readonly _subcategoriesService: ISubCategoriesService
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

		const category = await this._categoriesService.getByNameWithCreation(
			new CategoryName("Adjustment")
		);
		const subCategory =
			await this._subcategoriesService.getByNameWithCreation(
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

		const transaction = Transaction.createWithoutItem(
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
			...transaction.fromSplits.map((s) => s.accountId.value),
			...transaction.toSplits.map((s) => s.accountId.value),
			...prevTransaction.fromSplits.map((s) => s.accountId.value),
			...prevTransaction.toSplits.map((s) => s.accountId.value),
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
			...transaction.fromSplits.map((s) => s.accountId.value),
			...transaction.toSplits.map((s) => s.accountId.value),
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
}
