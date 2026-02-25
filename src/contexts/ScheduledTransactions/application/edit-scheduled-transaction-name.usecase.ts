import { StringValueObject } from "@juandardilag/value-objects";
import {
	CommandUseCase,
	EntityNotFoundError,
	Nanoid,
} from "../../Shared/domain";
import { IScheduledTransactionsRepository } from "../domain";

export class EditScheduledTransactionNameUseCase implements CommandUseCase<{
	id: Nanoid;
	name: StringValueObject;
}> {
	constructor(
		private readonly _scheduledTransactionsRepository: IScheduledTransactionsRepository,
	) {}

	async execute({
		id,
		name,
	}: {
		id: Nanoid;
		name: StringValueObject;
	}): Promise<void> {
		const scheduledTransaction =
			await this._scheduledTransactionsRepository.findById(id.value);
		if (!scheduledTransaction) {
			throw new EntityNotFoundError("Scheduled transaction", id);
		}

		scheduledTransaction.updateName(name);

		await this._scheduledTransactionsRepository.persist(
			scheduledTransaction,
		);
	}
}
