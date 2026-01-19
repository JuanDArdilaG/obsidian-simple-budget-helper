import { IAccountsService } from "contexts/Accounts/domain/accounts-service.interface";
import { Nanoid } from "contexts/Shared/domain";

export class DeleteAccountUseCase {
	constructor(private readonly _accountsService: IAccountsService) {}

	async execute(accountId: Nanoid): Promise<void> {
		await this._accountsService.delete(accountId);
	}
}
