import { NumberValueObject } from "@juandardilag/value-objects";
import { ItemID } from "contexts/Items/domain";
import { CommandUseCase } from "contexts/Shared/domain";
import { ItemsService } from "./items.service";

export type DeleteItemRecurrenceUseCaseInput = {
	id: ItemID;
	n: NumberValueObject;
};

export class DeleteItemRecurrenceUseCase
	implements CommandUseCase<DeleteItemRecurrenceUseCaseInput>
{
	constructor(private readonly _itemsService: ItemsService) {}

	async execute({ id, n }: DeleteItemRecurrenceUseCaseInput): Promise<void> {
		await this._itemsService.deleteRecurrence(id, n);
	}
}
