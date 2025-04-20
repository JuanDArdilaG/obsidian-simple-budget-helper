import { Entity } from "contexts/Shared/domain";
import { ItemRecurrenceFrequency } from "./item-recurrence-frequency.valueobject";
import {
	ItemRecurrenceModification,
	ItemRecurrenceModificationPrimitives,
	RecurrenceModifications,
} from "./item-recurrence-modification.valueobject";
import {
	DateValueObject,
	NumberValueObject,
} from "@juandardilag/value-objects";
import { ItemID } from "./item-id.valueobject";
import { ItemDate } from "./item-date.valueobject";
import { ItemRecurrenceUntilDate } from "./item-recurrence-untildate.valueobject";

export class ItemRecurrence extends Entity<ItemID, RecurrencePrimitives> {
	constructor(
		id: ItemID,
		private readonly _startDate: DateValueObject,
		private readonly _frequency: ItemRecurrenceFrequency,
		private _modifications?: ItemRecurrenceModification[],
		private _untilDate?: ItemRecurrenceUntilDate
	) {
		super(id);
	}

	copy(): ItemRecurrence {
		return new ItemRecurrence(
			this.id.copy(),
			this._startDate,
			this._frequency,
			this._modifications?.map((mod) => mod.copy()),
			this._untilDate
		);
	}

	get startDate(): DateValueObject {
		return this._startDate;
	}

	get frequency(): ItemRecurrenceFrequency {
		return this._frequency;
	}

	get untilDate(): ItemRecurrenceUntilDate | undefined {
		return this._untilDate;
	}

	updateUntilDate(untilDate?: ItemRecurrenceUntilDate): void {
		this._untilDate = untilDate;
	}

	get modifications(): ItemRecurrenceModification[] {
		return this._modifications ?? [];
	}

	calculateNextDate(actualDate: ItemDate): ItemDate {
		return actualDate.next(this.frequency);
	}

	/**
	 * Calculates the total recurrences for the item
	 * @returns the total recurrences or -1 if it is infinite
	 */
	get totalRecurrences(): number {
		if (!this.untilDate) return -1;
		let nextDate = new ItemDate(this.startDate);
		let count = 0;
		while (nextDate.isLessOrEqualThan(this.untilDate)) {
			count++;
			nextDate = nextDate.next(this.frequency);
		}
		return count;
	}

	get perMonthRelation(): NumberValueObject {
		return ItemRecurrenceFrequency.MONTH_DAYS_RELATION.divide(
			this.frequency.toNumberOfDays()
		);
	}

	getModification(
		n: NumberValueObject
	): ItemRecurrenceModification | undefined {
		return this._modifications?.find((mod) => mod.n.equalTo(n));
	}

	addModification(
		n: NumberValueObject,
		modifications: RecurrenceModifications
	): void {
		this._modifications ??= [];
		const modification = new ItemRecurrenceModification(
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

	toPrimitives(): RecurrencePrimitives {
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
		{ startDate, frequency, modifications, untilDate }: RecurrencePrimitives
	): ItemRecurrence {
		return new ItemRecurrence(
			itemID,
			new DateValueObject(startDate),
			new ItemRecurrenceFrequency(frequency),
			modifications
				? modifications.map((m) =>
						ItemRecurrenceModification.fromPrimitives(itemID, m)
				  )
				: undefined,
			untilDate ? new ItemRecurrenceUntilDate(untilDate) : undefined
		);
	}
}

export type RecurrencePrimitives = {
	startDate: Date;
	frequency: string;
	modifications?: ItemRecurrenceModificationPrimitives[];
	untilDate?: Date;
};
