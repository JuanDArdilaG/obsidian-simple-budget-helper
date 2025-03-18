import { IRepository } from "contexts/Shared/domain/persistence/repository.interface";
import { Account } from "./account.entity";
import { AccountID } from "./account-id.valueobject";
import { AccountName } from "./account-name.valueobject";

export interface IAccountsRepository extends IRepository<Account, AccountID> {
	findAllNames(): Promise<AccountName[]>;
}
