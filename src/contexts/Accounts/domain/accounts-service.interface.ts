import { IService } from "contexts/Shared/domain/service.interface";
import { Transaction } from "contexts/Transactions/domain";
import { AccountName } from "./account-name.valueobject";
import { Account, AccountPrimitives } from "./account.entity";

export interface IAccountsService extends IService<
	string,
	Account,
	AccountPrimitives
> {
	create(account: Account): Promise<void>;
	getAllNames(): Promise<AccountName[]>;
	adjustOnTransaction(transaction: Transaction): Promise<void>;
}
