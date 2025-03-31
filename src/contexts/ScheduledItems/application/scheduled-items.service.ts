import { NumberValueObject } from "@juandardilag/value-objects/NumberValueObject";
import {
	IScheduledItemsRepository,
	RecurrenceModifications,
	ScheduledItem,
	ScheduledItemPrimitives,
} from "contexts/ScheduledItems/domain";
import { Service } from "contexts/Shared/application/service.abstract";
import {
	EntityNotFoundError,
	InvalidArgumentError,
} from "contexts/Shared/domain";
import { ItemID } from "contexts/SimpleItems/domain";

export class ScheduledItemsService extends Service<
	ItemID,
	ScheduledItem,
	ScheduledItemPrimitives
> {
	constructor(private _scheduledItemsRepository: IScheduledItemsRepository) {
		super("Scheduled Item", _scheduledItemsRepository);
	}

	async modifyRecurrence(
		id: ItemID,
		n: NumberValueObject,
		modifications: RecurrenceModifications
	): Promise<void> {
		const item = await this.getByID(id);
		if (!item.recurrence)
			throw new InvalidArgumentError(
				"Scheduled Item",
				id.toString(),
				"item doesn't have recurrence"
			);
		item.recurrence.addModification(n, modifications);
		await this._scheduledItemsRepository.persist(item);
	}
}
