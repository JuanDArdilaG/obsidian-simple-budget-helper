import { CommandUseCase } from "contexts/Shared/domain";
import { AccountBalance, AccountID } from "contexts/Accounts/domain";
import { TransactionsService } from "contexts/Transactions/application";

export type AdjustAccountUseCaseInput = {
	accountID: AccountID;
	newBalance: AccountBalance;
};

export class AdjustAccountUseCase
	implements CommandUseCase<AdjustAccountUseCaseInput>
{
	constructor(private _transactionsService: TransactionsService) {}

	async execute({
		accountID,
		newBalance,
	}: AdjustAccountUseCaseInput): Promise<void> {
		await this._transactionsService.accountAdjustment(
			accountID,
			newBalance
		);
	}
}
