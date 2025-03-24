import { CommandUseCase } from "contexts/Shared";
import { Account } from "contexts/Accounts/domain";
import { AccountsService } from "./accounts.service";

export type CreateAccountUseCaseInput = Account;

export class CreateAccountUseCase
	implements CommandUseCase<CreateAccountUseCaseInput>
{
	constructor(private _accountsService: AccountsService) {}

	async execute(account: Account): Promise<void> {
		await this._accountsService.create(account);
	}
}
