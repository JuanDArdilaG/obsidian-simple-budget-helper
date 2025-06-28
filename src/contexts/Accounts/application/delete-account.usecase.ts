import { AccountID } from "contexts/Accounts/domain";
import { IAccountsService } from "contexts/Accounts/domain/accounts-service.interface";

export class DeleteAccountUseCase {
	constructor(private readonly _accountsService: IAccountsService) {}

	async execute(accountId: AccountID): Promise<void> {
		await this._accountsService.delete(accountId);
	}
}
