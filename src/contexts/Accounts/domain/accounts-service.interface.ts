import { Transaction } from "contexts/Transactions/domain";
import { AccountID } from "./account-id.valueobject";
import { AccountName } from "./account-name.valueobject";
import { Account, AccountPrimitives } from "./account.entity";
import { IService } from "contexts/Shared/domain/service.interface";

export interface IAccountsService
	extends IService<AccountID, Account, AccountPrimitives> {
	create(account: Account): Promise<void>;
	getAllNames(): Promise<AccountName[]>;
	adjustOnTransaction(transaction: Transaction): Promise<void>;
}
