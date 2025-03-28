import { Logger } from "contexts/Shared/infrastructure";
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
import { EntityNotFoundError } from "contexts/Shared";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";

export class TransactionsService implements ITransactionsService {
	#logger = new Logger("TransactionsService");
	constructor(
		private _accountsService: IAccountsService,
		private _transactionsRepository: ITransactionsRepository,
		private _categoriesService: ICategoriesService,
		private _subCategoriesService: ISubCategoriesService
	) {}

	async getAll(): Promise<Transaction[]> {
		return this._transactionsRepository.findAll();
	}

	async getByID(id: TransactionID): Promise<Transaction> {
		const transaction = await this._transactionsRepository.findById(id);
		if (!transaction)
			throw new EntityNotFoundError("Transaction", id.toString());
		return transaction;
	}

	async getByCategory(category: CategoryID): Promise<Transaction[]> {
		return this._transactionsRepository.findByCriteria(
			new TransactionCriteria().where("category", category.value)
		);
	}

	async record(transaction: Transaction): Promise<void> {
		this.#logger.debug("recording transaction", {
			...transaction.toPrimitives(),
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
		const amountDifference = account.balance.adjust(newBalance);

		this.#logger
			.debugB("accountAdjustment", {
				account: account.toPrimitives(),
				newBalance: newBalance.toString(),
				amountDifference: amountDifference.toString(),
			})
			.log();
		if (amountDifference.isZero()) return;

		const category = await this._categoriesService.getByNameWithCreation(
			new CategoryName("Adjustment")
		);
		const subCategory =
			await this._subCategoriesService.getByNameWithCreation(
				category.id,
				new SubCategoryName("Adjustment")
			);

		const transaction = Transaction.createWithoutItem(
			accountID,
			new TransactionName(`Adjustment for ${account.name}`),
			new TransactionOperation(
				amountDifference
					.times(
						new PriceValueObject(account.type.isAsset() ? 1 : -1)
					)
					.isPositive()
					? "income"
					: "expense"
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
		const account = await this._accountsService.getByID(
			transaction.account
		);

		await this._transactionsRepository.deleteById(id);
		account.adjustOnTransactionDeletion(transaction);

		await this._accountsService.update(account);
	}
}
