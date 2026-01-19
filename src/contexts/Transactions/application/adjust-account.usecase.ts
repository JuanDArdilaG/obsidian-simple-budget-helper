import { AccountBalance } from "contexts/Accounts/domain";
import { CommandUseCase, Nanoid } from "contexts/Shared/domain";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { TransactionsService } from "contexts/Transactions/application/transactions.service";

export type AdjustAccountUseCaseInput = {
	accountID: Nanoid;
	newBalance: AccountBalance;
};

export class AdjustAccountUseCase implements CommandUseCase<AdjustAccountUseCaseInput> {
	readonly #logger = new Logger("AdjustAccountUseCase");
	constructor(private readonly _transactionsService: TransactionsService) {}

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
			newBalance,
		);
	}
}
