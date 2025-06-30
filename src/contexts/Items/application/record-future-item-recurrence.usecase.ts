import { NumberValueObject } from "@juandardilag/value-objects";
import { ItemID } from "contexts/Items/domain";
import { CommandUseCase } from "contexts/Shared/domain";
import { ItemsService } from "./items.service";

export type RecordFutureItemRecurrenceUseCaseInput = {
	id: ItemID;
	n: NumberValueObject;
};

export class RecordFutureItemRecurrenceUseCase
	implements CommandUseCase<RecordFutureItemRecurrenceUseCaseInput>
{
	constructor(private readonly _itemsService: ItemsService) {}

	async execute({
		id,
		n,
	}: RecordFutureItemRecurrenceUseCaseInput): Promise<void> {
		await this._itemsService.recordFutureRecurrence(id, n);
	}
}
