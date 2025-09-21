import {
	AccountID,
	AccountIntegrityResult,
	IAccountsIntegrityService,
} from "contexts/Accounts/domain";
import { QueryUseCase } from "contexts/Shared/domain";

export class CalculateAccountIntegrityUseCase
	implements QueryUseCase<string, AccountIntegrityResult>
{
	constructor(
		private readonly _accountsIntegrityService: IAccountsIntegrityService
	) {}

	async execute(accountId: string): Promise<AccountIntegrityResult> {
		return await this._accountsIntegrityService.calculateAccountIntegrity(
			new AccountID(accountId)
		);
	}
}
