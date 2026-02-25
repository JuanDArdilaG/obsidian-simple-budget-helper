import { DateValueObject } from "@juandardilag/value-objects";
import { CommandUseCase, Nanoid } from "contexts/Shared/domain";
import { AccountSplit } from "contexts/Transactions/domain/account-split.valueobject";
import { IRecurrenceModificationsService } from "../domain";

export type ModifyNItemRecurrenceUseCaseInput = {
	scheduledItemId: Nanoid;
	occurrenceIndex: number;
	date?: Date;
	fromSplits?: AccountSplit[];
	toSplits?: AccountSplit[];
};

export class ModifyNItemRecurrenceUseCase implements CommandUseCase<ModifyNItemRecurrenceUseCaseInput> {
	constructor(
		private readonly _recurrenceModificationsService: IRecurrenceModificationsService,
	) {}

	async execute({
		scheduledItemId,
		occurrenceIndex,
		date,
		fromSplits,
		toSplits,
	}: ModifyNItemRecurrenceUseCaseInput): Promise<void> {
		await this._recurrenceModificationsService.modifyOccurrence(
			scheduledItemId,
			occurrenceIndex,
			{
				date: date ? new DateValueObject(date) : undefined,
				fromSplits,
				toSplits,
			},
		);
	}
}
