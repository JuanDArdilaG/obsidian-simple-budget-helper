import { CommandUseCase } from "contexts/Shared/domain";
import { ItemID, RecurrenceModifications } from "contexts/Items/domain";
import { NumberValueObject } from "@juandardilag/value-objects";
import { ItemsService } from "./items.service";

export type ModifyNItemRecurrenceUseCaseInput = {
	id: ItemID;
	n: NumberValueObject;
	modifications: RecurrenceModifications;
};

export class ModifyNItemRecurrenceUseCase
	implements CommandUseCase<ModifyNItemRecurrenceUseCaseInput>
{
	constructor(private _itemsService: ItemsService) {}

	async execute({
		id,
		n,
		modifications,
	}: ModifyNItemRecurrenceUseCaseInput): Promise<void> {
		await this._itemsService.modifyRecurrence(id, n, modifications);
	}
}
