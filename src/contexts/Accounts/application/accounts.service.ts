import {
	Account,
	AccountID,
	AccountName,
	AccountPrimitives,
	IAccountsRepository,
	IAccountsService,
} from "contexts/Accounts/domain";
import { Service } from "contexts/Shared/application/service.abstract";
import { InvalidArgumentError } from "contexts/Shared/domain/errors";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { Transaction } from "contexts/Transactions/domain/transaction.entity";
import { ITransactionsRepository } from "contexts/Transactions/domain/transactions-repository.interface";

export class AccountsService
	extends Service<AccountID, Account, AccountPrimitives>
	implements IAccountsService
{
	private readonly _logger = new Logger("AccountsService");
	constructor(
		private readonly _accountsRepository: IAccountsRepository,
		private readonly _transactionsRepository: ITransactionsRepository
	) {
		super("Accounts", _accountsRepository);
	}

	async create(account: Account): Promise<void> {
		const existingAccount = await this._accountsRepository.findByName(
			account.name
		);
		if (existingAccount)
			throw new InvalidArgumentError(
				"Account",
				account.name.value,
				`account with name ${account.name} already exists`
			);
		await this._accountsRepository.persist(account);
	}

	async delete(id: AccountID): Promise<void> {
		// Check if the account has any transactions
		const hasTransactions =
			await this._transactionsRepository.hasTransactionsForAccount(id);
		if (hasTransactions) {
			throw new Error(
				`Cannot delete account with ID ${id.value} because it has associated transactions. Please delete or update the accounts in all transactions first.`
			);
		}

		await this._accountsRepository.deleteById(id);
	}

	async getAllNames(): Promise<AccountName[]> {
		return (await this._accountsRepository.findAll()).map(
			(acc) => acc.name
		);
	}

	async adjustOnTransaction(transaction: Transaction): Promise<void> {
		// Adjust all fromSplits
		for (const split of transaction.fromSplits) {
			const account = await this.getByID(split.accountId);
			this._logger.debug("adjusting account (fromSplit)", {
				account: account.toPrimitives(),
				transaction: transaction.toPrimitives(),
			});
			account.adjustFromTransaction(transaction);
			this._logger.debug("adjusting account adjusted (fromSplit)", {
				...account.toPrimitives(),
			});
			await this.update(account);
		}
		// Adjust all toSplits
		for (const split of transaction.toSplits) {
			const account = await this.getByID(split.accountId);
			this._logger.debug("adjusting account (toSplit)", {
				account: account.toPrimitives(),
				transaction: transaction.toPrimitives(),
			});
			account.adjustFromTransaction(transaction);
			this._logger.debug("adjusting account adjusted (toSplit)", {
				...account.toPrimitives(),
			});
			await this.update(account);
		}
	}
}
