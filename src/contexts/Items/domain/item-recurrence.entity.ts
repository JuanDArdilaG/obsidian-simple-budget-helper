import {
	DateValueObject,
	NumberValueObject,
} from "@juandardilag/value-objects";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { ItemDate } from "./item-date.valueobject";
import { ItemRecurrenceFrequency } from "./item-recurrence-frequency.valueobject";
import {
	ERecurrenceState,
	ItemRecurrenceInfo,
	ItemRecurrenceInfoPrimitives,
} from "./item-recurrence-modification.valueobject";
import { ItemRecurrenceUntilDate } from "./item-recurrence-untildate.valueobject";

export class ItemRecurrence {
	readonly _ = new Logger("ItemRecurrence");
	private constructor(
		private _startDate: DateValueObject,
		private readonly _recurrences: ItemRecurrenceInfo[],
		private readonly _frequency?: ItemRecurrenceFrequency,
		private _untilDate?: ItemRecurrenceUntilDate
	) {}

	static oneTime(date: DateValueObject): ItemRecurrence {
		const recurrence = new ItemRecurrence(date, [], undefined, date);
		recurrence.createRecurrences();
		return recurrence;
	}

	static infinite(
		startDate: DateValueObject,
		frequency: ItemRecurrenceFrequency
	): ItemRecurrence {
		const recurrence = new ItemRecurrence(startDate, [], frequency);
		recurrence.createRecurrences();
		return recurrence;
	}

	static untilDate(
		startDate: DateValueObject,
		frequency: ItemRecurrenceFrequency,
		untilDate: ItemRecurrenceUntilDate
	): ItemRecurrence {
		const recurrence = new ItemRecurrence(
			startDate,
			[],
			frequency,
			untilDate
		);
		recurrence.createRecurrences();
		return recurrence;
	}

	static untilNRecurrences(
		startDate: DateValueObject,
		frequency: ItemRecurrenceFrequency,
		n: NumberValueObject
	): ItemRecurrence {
		if (n.value < 1) throw new Error("Recurrences must be greater than 0");
		let untilDate = new ItemRecurrenceUntilDate(startDate.value);
		if (n.value === 1) {
			return this.oneTime(startDate);
		} else if (n.value > 1) {
			untilDate = new ItemRecurrenceUntilDate(startDate.value);
			for (let i = 1; i < n.value; i++) {
				untilDate = this.calculateNextDate(
					new ItemDate(untilDate.value),
					frequency
				);
			}
		}
		const recurrence = new ItemRecurrence(
			startDate,
			[],
			undefined,
			untilDate
		);
		recurrence.createRecurrences();
		return recurrence;
	}

	static calculateNextDate(
		actualDate: ItemDate,
		frequency: ItemRecurrenceFrequency
	): ItemDate {
		return actualDate.next(frequency);
	}

	get startDate(): DateValueObject {
		return this._startDate;
	}

	updateStartDate(startDate: DateValueObject): void {
		this._startDate = startDate;
		this.createRecurrences();
	}

	get frequency(): ItemRecurrenceFrequency | undefined {
		return this._frequency;
	}

	get untilDate(): ItemRecurrenceUntilDate | undefined {
		return this._untilDate;
	}

	updateUntilDate(untilDate?: ItemRecurrenceUntilDate): void {
		this._untilDate = untilDate;
	}

	get recurrences(): ItemRecurrenceInfo[] {
		return this._recurrences;
	}

	updateRecurrences(recurrences: ItemRecurrenceInfo[]): void {
		this._recurrences.length = 0;
		this._recurrences.push(...recurrences);
	}

	createRecurrences(
		max: NumberValueObject = new NumberValueObject(50)
	): void {
		this._recurrences.length = 0;
		if (this.isOneTime()) {
			this._recurrences.push(
				new ItemRecurrenceInfo(
					new ItemDate(this._startDate),
					ERecurrenceState.PENDING
				)
			);
			return;
		}
		if (!this._frequency)
			throw new Error("Frequency is required for a non one time item");

		let i = NumberValueObject.zero();
		let nextDate = new ItemDate(this._startDate);

		while (
			max.greaterThan(i) &&
			(!this._untilDate || nextDate.isLessOrEqualThan(this._untilDate))
		) {
			this._recurrences.push(
				new ItemRecurrenceInfo(nextDate, ERecurrenceState.PENDING)
			);
			nextDate = nextDate.next(this._frequency);
			i = i.plus(new NumberValueObject(1));
		}
	}

	getRecurrencesUntilDate(
		to: DateValueObject
	): { recurrence: ItemRecurrenceInfo; n: NumberValueObject }[] {
		this._recurrences.sort((a, b) => a.date.compareTo(b.date));
		const filteredRecurrences = this._recurrences
			.map((recurrence, i) => ({
				recurrence: new ItemRecurrenceInfo(
					recurrence.date,
					recurrence.state,
					recurrence.price,
					recurrence.account,
					recurrence.toAccount
				),
				n: new NumberValueObject(i),
			}))
			.filter(
				({ recurrence }) =>
					recurrence.state === ERecurrenceState.PENDING &&
					recurrence.date.isLessOrEqualThan(to)
			);

		return filteredRecurrences;
	}

	isOneTime(): boolean {
		return !this.frequency;
	}

	/**
	 * Calculates the total recurrences for the item
	 * @returns the total recurrences or -1 if it is infinite
	 */
	get totalRecurrences(): number {
		if (!this.untilDate) return -1;
		if (!this.frequency) return 1;
		let nextDate = new ItemDate(this.startDate);
		let count = 0;
		while (nextDate.isLessOrEqualThan(this.untilDate)) {
			count++;
			nextDate = nextDate.next(this.frequency);
		}
		return count;
	}

	get perMonthRelation(): NumberValueObject {
		if (!this.frequency) return new NumberValueObject(1);
		return ItemRecurrenceFrequency.MONTH_DAYS_RELATION.divide(
			this.frequency.toNumberOfDays()
		);
	}

	toPrimitives(): RecurrencePrimitives {
		return {
			startDate: this._startDate,
			recurrences: this._recurrences.map((recurrence) =>
				recurrence.toPrimitives()
			),
			frequency: this._frequency?.value,
			untilDate: this._untilDate,
		};
	}

	static fromPrimitives({
		startDate,
		recurrences,
		frequency,
		untilDate,
	}: RecurrencePrimitives): ItemRecurrence {
		return new ItemRecurrence(
			new DateValueObject(new Date(startDate)),
			recurrences.map((recurrence) =>
				ItemRecurrenceInfo.fromPrimitives(recurrence)
			),
			frequency ? new ItemRecurrenceFrequency(frequency) : undefined,
			untilDate
				? new ItemRecurrenceUntilDate(new Date(untilDate))
				: undefined
		);
	}
}

export type RecurrencePrimitives = {
	startDate: Date;
	recurrences: ItemRecurrenceInfoPrimitives[];
	frequency?: string;
	untilDate?: Date;
};
