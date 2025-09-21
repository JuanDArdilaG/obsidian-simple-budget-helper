import {
	Account,
	AccountID,
	AccountName,
	AccountPrimitives,
} from "contexts/Accounts/domain";
import { IRepository } from "contexts/Shared/domain";

export interface IAccountsRepository
	extends IRepository<AccountID, Account, AccountPrimitives> {
	findByName(name: AccountName): Promise<Account | null>;
}
