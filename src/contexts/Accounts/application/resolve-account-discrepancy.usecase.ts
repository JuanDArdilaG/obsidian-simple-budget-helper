import { IAccountsIntegrityService } from "contexts/Accounts/domain";
import { CommandUseCase, Nanoid } from "contexts/Shared/domain";

export class ResolveAccountDiscrepancyUseCase implements CommandUseCase<string> {
	constructor(
		private readonly _accountsIntegrityService: IAccountsIntegrityService,
	) {}

	async execute(accountId: string): Promise<void> {
		const success = await this._accountsIntegrityService.resolveDiscrepancy(
			new Nanoid(accountId),
		);
		if (!success) {
			throw new Error(
				`Failed to resolve discrepancy for account ${accountId}`,
			);
		}
	}
}
