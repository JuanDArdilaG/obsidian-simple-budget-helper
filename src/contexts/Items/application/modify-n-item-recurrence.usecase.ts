import { CommandUseCase } from "contexts/Shared/domain";
import { ItemID, ItemRecurrenceModification } from "contexts/Items/domain";
import { NumberValueObject } from "@juandardilag/value-objects";
import { ItemsService } from "./items.service";

export type ModifyNItemRecurrenceUseCaseInput = {
	id: ItemID;
	n: NumberValueObject;
	newRecurrence: ItemRecurrenceModification;
};

export class ModifyNItemRecurrenceUseCase
	implements CommandUseCase<ModifyNItemRecurrenceUseCaseInput>
{
	constructor(private readonly _itemsService: ItemsService) {}

	async execute({
		id,
		n,
		newRecurrence,
	}: ModifyNItemRecurrenceUseCaseInput): Promise<void> {
		await this._itemsService.modifyRecurrence(id, n, newRecurrence);
	}
}
