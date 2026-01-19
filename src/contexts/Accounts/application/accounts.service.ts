import {
	Account,
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
import { Nanoid } from "../../Shared/domain";

export class AccountsService
	extends Service<Nanoid, Account, AccountPrimitives>
	implements IAccountsService
{
	private readonly _logger = new Logger("AccountsService");
	constructor(
		private readonly _accountsRepository: IAccountsRepository,
		private readonly _transactionsRepository: ITransactionsRepository,
	) {
		super("Accounts", _accountsRepository);
	}

	async create(account: Account): Promise<void> {
		const existingAccount = await this._accountsRepository.findByName(
			account.name,
		);
		if (existingAccount)
			throw new InvalidArgumentError(
				"Account",
				account.name.value,
				`account with name ${account.name} already exists`,
			);
		await this._accountsRepository.persist(account);
	}

	async delete(id: Nanoid): Promise<void> {
		// Check if the account has any transactions
		const hasTransactions =
			await this._transactionsRepository.hasTransactionsForAccount(id);
		if (hasTransactions) {
			throw new Error(
				`Cannot delete account with ID ${id.value} because it has associated transactions. Please delete or update the accounts in all transactions first.`,
			);
		}

		await this._accountsRepository.deleteById(id);
	}

	async getAllNames(): Promise<AccountName[]> {
		return (await this._accountsRepository.findAll()).map(
			(acc) => acc.name,
		);
	}

	async adjustOnTransaction(transaction: Transaction): Promise<void> {
		for (const account of transaction.originAccounts) {
			const originAccount = await this.getByID(account.accountId);
			this._logger.debug("adjusting account (fromSplit)", {
				account: originAccount.toPrimitives(),
				transaction: transaction.toPrimitives(),
			});
			originAccount.adjustFromTransaction(transaction);
			this._logger.debug("adjusting account adjusted (fromSplit)", {
				...originAccount.toPrimitives(),
			});
			await this.update(originAccount);
		}
		// Adjust all toSplits
		for (const account of transaction.destinationAccounts) {
			const destinationAccount = await this.getByID(account.accountId);
			this._logger.debug("adjusting account (toSplit)", {
				account: destinationAccount.toPrimitives(),
				transaction: transaction.toPrimitives(),
			});
			destinationAccount.adjustFromTransaction(transaction);
			this._logger.debug("adjusting account adjusted (toSplit)", {
				...destinationAccount.toPrimitives(),
			});
			await this.update(destinationAccount);
		}
	}
}
