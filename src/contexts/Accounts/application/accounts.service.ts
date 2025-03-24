import {
	Account,
	AccountID,
	IAccountsRepository,
} from "contexts/Accounts/domain";
import { EntityNotFoundError } from "contexts/Shared/domain";
import { Logger } from "contexts/Shared/infrastructure";
import { Transaction } from "contexts/Transactions/domain";

export class AccountsService {
	constructor(private _accountsRepository: IAccountsRepository) {}

	async getByID(id: AccountID): Promise<Account> {
		const account = await this._accountsRepository.findById(id);
		if (!account) throw new EntityNotFoundError("Account", id);
		return account;
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

		Logger.debug("adjusting account", { ...account.toPrimitives() });
		account.adjustFromTransaction(transaction);
		Logger.debug("adjusting account adjusted", {
			...account.toPrimitives(),
		});

		await this.update(account);

		if (toAccount) {
			Logger.debug("adjusting toAccount", {
				...toAccount.toPrimitives(),
			});
			toAccount.adjustFromTransaction(transaction);
			Logger.debug("adjusting toAccount adjusted", {
				...toAccount.toPrimitives(),
			});
			await this.update(toAccount);
		}
	}
}
