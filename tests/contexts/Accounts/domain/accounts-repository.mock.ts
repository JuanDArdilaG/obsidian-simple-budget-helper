import {
	Account,
	AccountID,
	AccountName,
	AccountPrimitives,
	IAccountsRepository,
} from "contexts/Accounts/domain";
import { RepositoryMock } from "../../../contexts/Shared/domain/repository.mock";

export class AccountsRepositoryMock
	extends RepositoryMock<AccountID, Account, AccountPrimitives>
	implements IAccountsRepository
{
	async findByName(name: AccountName): Promise<Account | null> {
		return this.items.find((account) => account.name.equalTo(name)) ?? null;
	}
}
