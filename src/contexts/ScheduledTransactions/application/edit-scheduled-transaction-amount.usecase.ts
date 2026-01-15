import { PriceValueObject } from "@juandardilag/value-objects";
import {
	CommandUseCase,
	EntityNotFoundError,
	Nanoid,
} from "../../Shared/domain";
import { PaymentSplit } from "../../Transactions/domain";
import { IScheduledTransactionsRepository } from "../domain";

export class EditScheduledTransactionAmountUseCase
	implements CommandUseCase<{ id: Nanoid; amount: PriceValueObject }>
{
	constructor(
		private readonly _scheduledTransactionsRepository: IScheduledTransactionsRepository
	) {}

	async execute({
		id,
		amount,
	}: {
		id: Nanoid;
		amount: PriceValueObject;
	}): Promise<void> {
		const scheduledTransaction =
			await this._scheduledTransactionsRepository.findById(id);
		if (!scheduledTransaction) {
			throw new EntityNotFoundError("Scheduled transaction", id);
		}

		scheduledTransaction.updateOriginAccounts([
			new PaymentSplit(
				scheduledTransaction.originAccounts[0].accountId,
				amount
			),
		]);

		await this._scheduledTransactionsRepository.persist(
			scheduledTransaction
		);
	}
}
