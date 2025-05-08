import { Logger } from "contexts/Shared/infrastructure/logger";
import {
	ITransactionsRepository,
	ITransactionsService,
	Transaction,
	TransactionCriteria,
	TransactionID,
	TransactionName,
	TransactionOperation,
} from "contexts/Transactions/domain";
import {
	CategoryID,
	CategoryName,
	ICategoriesService,
} from "contexts/Categories/domain";
import {
	ISubCategoriesService,
	SubCategoryName,
} from "contexts/Subcategories/domain";
import {
	AccountBalance,
	AccountID,
	IAccountsService,
} from "contexts/Accounts/domain";
import { EntityNotFoundError } from "contexts/Shared/domain";
import { NumberValueObject } from "@juandardilag/value-objects";

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

		const transaction = Transaction.createWithoutItem(
			accountID,
			new TransactionName(`Adjustment for ${account.name}`),
			new TransactionOperation(
				amountDifference.isPositive() ? "income" : "expense"
			),
			category.id,
			subCategory.id,
			amountDifference.abs()
		);

		await this.record(transaction);
	}

	async update(transaction: Transaction): Promise<void> {
		const prevTransaction = await this.getByID(transaction.id);
		const account = await this._accountsService.getByID(
			transaction.account
		);
		if (prevTransaction.account.equalTo(transaction.account)) {
			account.adjustOnTransactionUpdate(prevTransaction, transaction);
		} else {
			const prevAccount = await this._accountsService.getByID(
				prevTransaction.account
			);
			prevAccount.adjustOnTransactionDeletion(prevTransaction);
			account.adjustFromTransaction(transaction);

			await this._accountsService.update(prevAccount);
		}

		await this._accountsService.update(account);

		const toAccount = transaction.toAccount
			? await this._accountsService.getByID(transaction.toAccount)
			: undefined;
		if (toAccount && transaction.toAccount)
			if (
				prevTransaction.toAccount?.value === transaction.toAccount.value
			) {
				toAccount.adjustOnTransactionUpdate(
					prevTransaction,
					transaction
				);
			} else {
				const prevToAccount = prevTransaction.toAccount
					? await this._accountsService.getByID(
							prevTransaction.toAccount
					  )
					: undefined;
				prevToAccount?.adjustOnTransactionDeletion(transaction);
				toAccount.adjustFromTransaction(transaction);

				if (prevToAccount)
					await this._accountsService.update(prevToAccount);
			}

		await this._transactionsRepository.persist(transaction);
	}

	async delete(id: TransactionID): Promise<void> {
		const transaction = await this.getByID(id);

		await this._transactionsRepository.deleteById(id);

		await this.#adjustAccountsOnDeletion(transaction);
	}

	async #adjustAccountsOnDeletion(transaction: Transaction) {
		const account = await this._accountsService.getByID(
			transaction.account
		);
		account.adjustOnTransactionDeletion(transaction);
		await this._accountsService.update(account);

		const toAccount =
			transaction.toAccount &&
			(await this._accountsService.getByID(transaction.toAccount));
		if (toAccount) {
			toAccount.adjustOnTransactionDeletion(transaction);
			await this._accountsService.update(toAccount);
		}
	}
}
