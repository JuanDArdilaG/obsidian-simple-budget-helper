import { Transaction } from "contexts/Transactions/domain";
import { AccountID } from "./account-id.valueobject";
import { AccountName } from "./account-name.valueobject";
import { Account } from "./account.entity";

export interface IAccountsService {
	create(account: Account): Promise<void>;
	getByID(id: AccountID): Promise<Account>;
	getAllNames(): Promise<AccountName[]>;
	update(account: Account): Promise<void>;
	adjustOnTransaction(transaction: Transaction): Promise<void>;
}
