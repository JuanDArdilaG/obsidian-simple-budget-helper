import { CommandUseCase } from "contexts/Shared/domain";
import { ScheduledItemsService } from "./scheduled-items.service";
import { ItemID } from "contexts/SimpleItems/domain";
import { NumberValueObject } from "@juandardilag/value-objects/NumberValueObject";
import { RecurrenceModifications } from "contexts/ScheduledItems/domain";

export type ModifyNScheduledItemRecurrenceUseCaseInput = {
	id: ItemID;
	n: NumberValueObject;
	modifications: RecurrenceModifications;
};

export class ModifyNScheduledItemRecurrenceUseCase
	implements CommandUseCase<ModifyNScheduledItemRecurrenceUseCaseInput>
{
	constructor(private _scheduledItemsService: ScheduledItemsService) {}

	async execute({
		id,
		n,
		modifications,
	}: ModifyNScheduledItemRecurrenceUseCaseInput): Promise<void> {
		await this._scheduledItemsService.modifyRecurrence(
			id,
			n,
			modifications
		);
	}
}
