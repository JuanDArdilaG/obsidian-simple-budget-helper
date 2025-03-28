import {
	Account,
	AccountID,
	AccountName,
	IAccountsService,
	Transaction,
} from "contexts";

export class AccountsServiceMock implements IAccountsService {
	constructor(private _accounts: Account[]) {}

	create(account: Account): Promise<void> {
		throw new Error("Method not implemented.");
	}

	async getByID(id: AccountID): Promise<Account> {
		const account = this._accounts.find((a) => a.id.equalTo(id));
		if (!account) throw new Error("account not found on get");
		return account;
	}

	getAllNames(): Promise<AccountName[]> {
		throw new Error("Method not implemented.");
	}

	async update(account: Account): Promise<void> {
		const existingAccount = this._accounts.findIndex((a) =>
			a.id.equalTo(account.id)
		);
		if (existingAccount === -1)
			throw new Error("account not found on update");
		this._accounts[existingAccount] = account;
	}

	adjustOnTransaction(transaction: Transaction): Promise<void> {
		throw new Error("Method not implemented.");
	}
}
