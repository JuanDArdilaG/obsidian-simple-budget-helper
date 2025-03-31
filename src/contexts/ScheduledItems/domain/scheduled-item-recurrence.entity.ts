import { Entity } from "contexts/Shared/domain";
import { ScheduledItemFrequency } from "./scheduled-item-frequency.valueobject";
import { ScheduledItemNextDate } from "./scheduled-item-nextdate.valueobject";
import { ScheduledItemUntilDate } from "./scheduled-item-untildate.valueobject";
import {
	RecurrenceModifications,
	ScheduledItemRecurrenceModification,
	ScheduledItemRecurrenceModificationPrimitives,
} from "./scheduled-item-recurrence-modification.valueobject";
import { ItemID } from "contexts/SimpleItems/domain";
import { DateValueObject } from "@juandardilag/value-objects/DateValueObject";
import { NumberValueObject } from "@juandardilag/value-objects/NumberValueObject";

export class ScheduledItemRecurrence extends Entity<
	ItemID,
	ScheduledRecurrencePrimitives
> {
	constructor(
		id: ItemID,
		private _startDate: DateValueObject,
		// private _nextDate: ScheduledItemNextDate,
		private _frequency: ScheduledItemFrequency,
		private _modifications?: ScheduledItemRecurrenceModification[],
		private _untilDate?: ScheduledItemUntilDate
	) {
		super(id);
	}

	copy(): ScheduledItemRecurrence {
		return new ScheduledItemRecurrence(
			this.id.copy(),
			this._startDate.copy(),
			this._frequency.copy(),
			this._modifications?.map((mod) => mod.copy()),
			this._untilDate?.copy()
		);
	}

	get startDate(): DateValueObject {
		return this._startDate;
	}

	get frequency(): ScheduledItemFrequency {
		return this._frequency;
	}

	get untilDate(): ScheduledItemUntilDate | undefined {
		return this._untilDate;
	}

	updateUntilDate(untilDate?: ScheduledItemNextDate): void {
		this._untilDate = untilDate;
	}

	get modifications(): ScheduledItemRecurrenceModification[] {
		return this._modifications ?? [];
	}

	getModification(
		n: NumberValueObject
	): ScheduledItemRecurrenceModification | undefined {
		return this._modifications?.find((mod) => mod.n.equalTo(n));
	}

	addModification(
		n: NumberValueObject,
		modifications: RecurrenceModifications
	): void {
		if (!this._modifications) this._modifications = [];
		const modification = new ScheduledItemRecurrenceModification(
			this._id,
			n,
			modifications
		);
		const i = this._modifications.findIndex((mod) => mod.n.equalTo(n));
		if (i !== -1) {
			this._modifications[i] = modification;
			return;
		}
		this._modifications.push(modification);
	}

	toPrimitives(): ScheduledRecurrencePrimitives {
		return {
			startDate: this._startDate,
			frequency: this._frequency.value,
			untilDate: this._untilDate,
			modifications: this._modifications
				? this._modifications.map((m) => m.toPrimitives())
				: undefined,
		};
	}

	static fromPrimitives(
		itemID: ItemID,
		{
			startDate,
			frequency,
			modifications,
			untilDate,
		}: ScheduledRecurrencePrimitives
	): ScheduledItemRecurrence {
		return new ScheduledItemRecurrence(
			itemID,
			new DateValueObject(startDate),
			new ScheduledItemFrequency(frequency),
			modifications
				? modifications.map((m) =>
						ScheduledItemRecurrenceModification.fromPrimitives(
							itemID,
							m
						)
				  )
				: undefined,
			untilDate ? new ScheduledItemUntilDate(untilDate) : undefined
		);
	}
}

export type ScheduledRecurrencePrimitives = {
	startDate: Date;
	frequency: string;
	modifications?: ScheduledItemRecurrenceModificationPrimitives[];
	untilDate?: Date;
};
