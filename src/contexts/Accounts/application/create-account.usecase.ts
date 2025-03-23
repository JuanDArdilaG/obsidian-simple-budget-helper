import { CommandUseCase } from "contexts/Shared";
import { Account, IAccountsRepository } from "contexts/Accounts/domain";

export type CreateAccountUseCaseInput = Account;

export class CreateAccountUseCase
	implements CommandUseCase<CreateAccountUseCaseInput>
{
	constructor(private _accountsRepository: IAccountsRepository) {}
	async execute(account: Account): Promise<void> {
		return this._accountsRepository.persist(account);
	}
}
