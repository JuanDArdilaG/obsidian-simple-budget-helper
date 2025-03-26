import { CommandUseCase } from "contexts/Shared/domain";
import { AccountBalance, AccountID } from "contexts/Accounts/domain";
import { TransactionsService } from "contexts/Transactions/application";
import { Logger } from "contexts/Shared";

const logger = new Logger("AdjustAccountUseCase");

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
		logger
			.debugB("accountAdjustment", {
				accountID: accountID.value,
				newBalance: newBalance.toString(),
			})
			.log();
		await this._transactionsService.accountAdjustment(
			accountID,
			newBalance
		);
	}
}
