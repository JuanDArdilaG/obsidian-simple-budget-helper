import {
	Account,
	AccountName,
	AccountPrimitives,
} from "contexts/Accounts/domain";
import { IRepository } from "contexts/Shared/domain";

export interface IAccountsRepository extends IRepository<
	string,
	Account,
	AccountPrimitives
> {
	findByName(name: AccountName): Promise<Account | null>;
}
