import { NumberValueObject } from "@juandardilag/value-objects";
import { ItemID } from "contexts/Items/domain";
import { CommandUseCase } from "contexts/Shared/domain";
import { ItemsService } from "./items.service";

export type CompleteItemRecurrenceUseCaseInput = {
	id: ItemID;
	n: NumberValueObject;
};

export class CompleteItemRecurrenceUseCase
	implements CommandUseCase<CompleteItemRecurrenceUseCaseInput>
{
	constructor(private readonly _itemsService: ItemsService) {}

	async execute({
		id,
		n,
	}: CompleteItemRecurrenceUseCaseInput): Promise<void> {
		await this._itemsService.completeRecurrence(id, n);
	}
}
