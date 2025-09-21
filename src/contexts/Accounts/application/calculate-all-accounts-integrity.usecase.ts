import {
	IAccountsIntegrityService,
	IntegrityCheckReport,
} from "contexts/Accounts/domain";
import { QueryUseCase } from "contexts/Shared/domain";

export class CalculateAllAccountsIntegrityUseCase
	implements QueryUseCase<void, IntegrityCheckReport>
{
	constructor(
		private readonly _accountsIntegrityService: IAccountsIntegrityService
	) {}

	async execute(): Promise<IntegrityCheckReport> {
		return await this._accountsIntegrityService.calculateAllAccountsIntegrity();
	}
}
