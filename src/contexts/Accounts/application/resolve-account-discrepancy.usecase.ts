import { AccountID, IAccountsIntegrityService } from "contexts/Accounts/domain";
import { CommandUseCase } from "contexts/Shared/domain";

export class ResolveAccountDiscrepancyUseCase
	implements CommandUseCase<string>
{
	constructor(
		private readonly _accountsIntegrityService: IAccountsIntegrityService
	) {}

	async execute(accountId: string): Promise<void> {
		const success = await this._accountsIntegrityService.resolveDiscrepancy(
			new AccountID(accountId)
		);
		if (!success) {
			throw new Error(
				`Failed to resolve discrepancy for account ${accountId}`
			);
		}
	}
}
