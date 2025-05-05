import { Logger } from "contexts/Shared/infrastructure/logger";
import {
	Account,
	AccountID,
	AccountName,
	AccountPrimitives,
	IAccountsRepository,
	IAccountsService,
} from "contexts/Accounts/domain";
import { InvalidArgumentError } from "contexts/Shared/domain/errors";
import { Transaction } from "contexts/Transactions/domain/transaction.entity";
import { Service } from "contexts/Shared/application/service.abstract";

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
		const account = await this.getByID(transaction.account);
		const toAccount = transaction.toAccount
			? await this.getByID(transaction.toAccount)
			: undefined;

		this._logger.debug("adjusting account", {
			account: account.toPrimitives(),
			transaction: transaction.toPrimitives(),
		});
		account.adjustFromTransaction(transaction);
		this._logger.debug("adjusting account adjusted", {
			...account.toPrimitives(),
		});

		await this.update(account);

		if (toAccount) {
			this._logger.debug("adjusting toAccount", {
				toAccount: toAccount.toPrimitives(),
				transaction: transaction.toPrimitives(),
			});
			toAccount.adjustFromTransaction(transaction);
			this._logger.debug("adjusting toAccount adjusted", {
				...toAccount.toPrimitives(),
			});
			await this.update(toAccount);
		}
	}
}
