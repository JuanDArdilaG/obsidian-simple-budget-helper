import {
	Account,
	AccountName,
	AccountPrimitives,
	IAccountsService,
} from "contexts/Accounts/domain";
import { Criteria, Nanoid } from "contexts/Shared/domain";
import { Transaction } from "contexts/Transactions/domain";

export class AccountsServiceMock implements IAccountsService {
	constructor(private _accounts: Account[]) {}

	delete(id: Nanoid): Promise<void> {
		throw new Error("Method not implemented.");
	}

	exists(id: Nanoid): Promise<boolean> {
		throw new Error("Method not implemented.");
	}

	getAll(): Promise<Account[]> {
		return Promise.resolve(this._accounts);
	}

	getByCriteria(criteria: Criteria<AccountPrimitives>): Promise<Account[]> {
		throw new Error("Method not implemented.");
	}

	create(account: Account): Promise<void> {
		throw new Error("Method not implemented.");
	}

	async getByID(id: Nanoid): Promise<Account> {
		const account = this._accounts.find((a) => a.id.equalTo(id));
		if (!account) throw new Error("account not found on get");
		return account;
	}

	getAllNames(): Promise<AccountName[]> {
		throw new Error("Method not implemented.");
	}

	async update(account: Account): Promise<void> {
		const existingAccount = this._accounts.findIndex((a) =>
			a.id.equalTo(account.id),
		);
		if (existingAccount === -1)
			throw new Error("account not found on update");
		this._accounts[existingAccount] = account;
	}

	async adjustOnTransaction(transaction: Transaction): Promise<void> {
		// Adjust all fromSplits
		for (const split of transaction.originAccounts) {
			split.account.adjustFromTransaction(transaction);
		}
		// Adjust all toSplits
		for (const split of transaction.destinationAccounts) {
			split.account.adjustFromTransaction(transaction);
		}
	}
}
