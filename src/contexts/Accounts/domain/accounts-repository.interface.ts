import { Account, AccountID, AccountName } from "contexts/Accounts/domain";
import { IRepository } from "contexts/Shared/domain";

export interface IAccountsRepository extends IRepository<AccountID, Account> {
	findAllNames(): Promise<AccountName[]>;
}
