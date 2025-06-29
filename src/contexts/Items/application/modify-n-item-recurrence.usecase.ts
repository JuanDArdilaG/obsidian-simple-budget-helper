import { NumberValueObject } from "@juandardilag/value-objects";
import { ItemID, ItemRecurrenceInfo } from "contexts/Items/domain";
import { CommandUseCase } from "contexts/Shared/domain";
import { PaymentSplit } from "contexts/Transactions/domain/payment-split.valueobject";
import { ItemsService } from "./items.service";

export type ModifyNItemRecurrenceUseCaseInput = {
	id: ItemID;
	n: NumberValueObject;
	newRecurrence: ItemRecurrenceInfo;
	fromSplits?: PaymentSplit[];
	toSplits?: PaymentSplit[];
};

export class ModifyNItemRecurrenceUseCase
	implements CommandUseCase<ModifyNItemRecurrenceUseCaseInput>
{
	constructor(private readonly _itemsService: ItemsService) {}

	async execute({
		id,
		n,
		newRecurrence,
		fromSplits,
		toSplits,
	}: ModifyNItemRecurrenceUseCaseInput): Promise<void> {
		await this._itemsService.modifyRecurrence(
			id,
			n,
			newRecurrence,
			fromSplits,
			toSplits
		);
	}
}
