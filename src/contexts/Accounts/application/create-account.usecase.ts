import { CommandUseCase } from "contexts/Shared/domain";
import { Account, IAccountsService } from "contexts/Accounts/domain";

export type CreateAccountUseCaseInput = Account;

export class CreateAccountUseCase
	implements CommandUseCase<CreateAccountUseCaseInput>
{
	constructor(private _accountsService: IAccountsService) {}

	async execute(account: Account): Promise<void> {
		await this._accountsService.create(account);
	}
}
