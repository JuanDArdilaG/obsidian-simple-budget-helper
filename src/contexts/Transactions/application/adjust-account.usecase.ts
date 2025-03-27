import { CommandUseCase } from "contexts/Shared/domain";
import { AccountBalance, AccountID } from "contexts/Accounts/domain";
import { TransactionsService } from "contexts/Transactions/application";
import { Logger } from "contexts/Shared";

export type AdjustAccountUseCaseInput = {
	accountID: AccountID;
	newBalance: AccountBalance;
};

export class AdjustAccountUseCase
	implements CommandUseCase<AdjustAccountUseCaseInput>
{
	#logger = new Logger("AdjustAccountUseCase");
	constructor(private _transactionsService: TransactionsService) {}

	async execute({
		accountID,
		newBalance,
	}: AdjustAccountUseCaseInput): Promise<void> {
		this.#logger
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
