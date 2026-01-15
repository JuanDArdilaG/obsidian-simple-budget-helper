import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import { EntityNotFoundError } from "contexts/Shared/domain/errors/not-found.error";
import { IScheduledTransactionsService } from "../../ScheduledTransactions/domain";
import { Nanoid } from "../../Shared/domain";
import { CommandUseCase } from "../../Shared/domain/command-use-case.interface";
import { Logger } from "../../Shared/infrastructure/logger";
import { ITransactionsService } from "../domain";
import { PaymentSplit } from "../domain/payment-split.valueobject";
import { TransactionAmount } from "../domain/transaction-amount.valueobject";
import { TransactionDate } from "../domain/transaction-date.valueobject";
import { Transaction } from "../domain/transaction.entity";

export type RecordScheduledItemUseCaseInput = {
	id: Nanoid;
	date?: TransactionDate;
	amount?: TransactionAmount;
	account?: AccountID;
	toAccount?: AccountID;
	permanentChanges?: boolean;
};

export class RecordItemUseCase
	implements CommandUseCase<RecordScheduledItemUseCaseInput>
{
	readonly #logger = new Logger("RecordItemUseCase");
	constructor(
		private readonly _transactionsService: ITransactionsService,
		private readonly _scheduledTransactionsService: IScheduledTransactionsService
	) {}

	async execute({
		id,
		date,
		amount,
		account,
		toAccount,
	}: RecordScheduledItemUseCaseInput): Promise<void> {
		this.#logger.debug("attributes", {
			id,
			date,
			amount,
			account,
			toAccount,
		});
		const item = await this._scheduledTransactionsService.getByID(id);
		if (!item) throw new EntityNotFoundError("ScheduledTransaction", id);

		const transaction = Transaction.fromScheduledTransaction(
			item,
			date ?? TransactionDate.createNowDate()
		);

		this.#logger.debug("transaction from item", {
			transaction: transaction.toPrimitives(),
			item,
		});

		// Update splits if amount/account/toAccount are provided
		if (amount || account || toAccount) {
			let fromSplits = transaction.originAccounts;
			let toSplits = transaction.destinationAccounts;
			if (account && amount) {
				fromSplits = [new PaymentSplit(account, amount)];
			}
			if (toAccount && amount) {
				toSplits = [new PaymentSplit(toAccount, amount)];
			}
			transaction.setOriginAccounts(fromSplits);
			transaction.setDestinationAccounts(toSplits);
		}

		this.#logger.debug("transaction after update", { transaction });

		await this._scheduledTransactionsService.update(item);
		await this._transactionsService.record(transaction);
	}
}
