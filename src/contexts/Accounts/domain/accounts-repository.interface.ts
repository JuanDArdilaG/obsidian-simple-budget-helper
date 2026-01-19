import {
	Account,
	AccountName,
	AccountPrimitives,
} from "contexts/Accounts/domain";
import { IRepository, Nanoid } from "contexts/Shared/domain";

export interface IAccountsRepository extends IRepository<
	Nanoid,
	Account,
	AccountPrimitives
> {
	findByName(name: AccountName): Promise<Account | null>;
}
