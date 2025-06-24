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

export class AccountsService
	extends Service<AccountID, Account, AccountPrimitives>
	implements IAccountsService
{
	private readonly _logger = new Logger("AccountsService");
	constructor(private readonly _accountsRepository: IAccountsRepository) {
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
