import { Entity } from "contexts/Shared/domain";
import { ItemRecurrenceFrequency } from "./item-recurrence-frequency.valueobject";
import { ItemRecurrenceModificationPrimitives } from "./item-recurrence-modification.valueobject";
import {
	DateValueObject,
	NumberValueObject,
} from "@juandardilag/value-objects";
import { ItemID } from "./item-id.valueobject";
import { ItemDate } from "./item-date.valueobject";
import { ItemRecurrenceUntilDate } from "./item-recurrence-untildate.valueobject";
import { Logger } from "contexts/Shared/infrastructure/logger";

export class ItemRecurrence extends Entity<ItemID, RecurrencePrimitives> {
	readonly #logger = new Logger("ItemRecurrence");
	constructor(
		id: ItemID,
		private readonly _startDate: DateValueObject,
		private readonly _frequency: ItemRecurrenceFrequency,
		private _untilDate?: ItemRecurrenceUntilDate
	) {
		super(id);
	}

	copy(): ItemRecurrence {
		return new ItemRecurrence(
			this.id.copy(),
			this._startDate,
			this._frequency,
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

	toPrimitives(): RecurrencePrimitives {
		return {
			startDate: this._startDate,
			frequency: this._frequency.value,
			untilDate: this._untilDate,
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
