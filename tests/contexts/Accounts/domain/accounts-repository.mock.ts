import {
	Account,
	AccountName,
	AccountPrimitives,
	IAccountsRepository,
} from "contexts/Accounts/domain";
import { Nanoid } from "../../../../src/contexts/Shared/domain";
import { RepositoryMock } from "../../../contexts/Shared/domain/repository.mock";

export class AccountsRepositoryMock
	extends RepositoryMock<Nanoid, Account, AccountPrimitives>
	implements IAccountsRepository
{
	async findByName(name: AccountName): Promise<Account | null> {
		return this.items.find((account) => account.name.equalTo(name)) ?? null;
	}
}
