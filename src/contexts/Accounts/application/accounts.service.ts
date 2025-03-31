import { Logger } from "contexts/Shared/infrastructure/logger";
import {
	Account,
	AccountID,
	AccountName,
	IAccountsRepository,
	IAccountsService,
} from "contexts/Accounts/domain";
import {
	EntityNotFoundError,
	InvalidArgumentError,
} from "contexts/Shared/domain/errors";
import { Transaction } from "contexts/Transactions/domain/transaction.entity";

export class AccountsService implements IAccountsService {
	#logger = new Logger("AccountsService");
	constructor(private _accountsRepository: IAccountsRepository) {}

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

	async getByID(id: AccountID): Promise<Account> {
		const account = await this._accountsRepository.findById(id);
		if (!account) throw new EntityNotFoundError("Account", id);
		return account;
	}

	async getAllNames(): Promise<AccountName[]> {
		return (await this._accountsRepository.findAll()).map(
			(acc) => acc.name
		);
	}

	async update(account: Account): Promise<void> {
		await this.getByID(account.id);
		await this._accountsRepository.persist(account);
	}

	async adjustOnTransaction(transaction: Transaction): Promise<void> {
		const account = await this.getByID(transaction.account);
		const toAccount = transaction.toAccount
			? await this.getByID(transaction.toAccount)
			: undefined;

		this.#logger.debug("adjusting account", {
			account: account.toPrimitives(),
			transaction: transaction.toPrimitives(),
		});
		account.adjustFromTransaction(transaction);
		this.#logger.debug("adjusting account adjusted", {
			...account.toPrimitives(),
		});

		await this.update(account);

		if (toAccount) {
			this.#logger.debug("adjusting toAccount", {
				toAccount: toAccount.toPrimitives(),
				transaction: transaction.toPrimitives(),
			});
			toAccount.adjustFromTransaction(transaction);
			this.#logger.debug("adjusting toAccount adjusted", {
				...toAccount.toPrimitives(),
			});
			await this.update(toAccount);
		}
	}
}
