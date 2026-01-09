import {
	DateValueObject,
	NumberValueObject,
} from "@juandardilag/value-objects";
import { ItemRecurrenceFrequency } from "./item-recurrence-frequency.valueobject";
import { RecurrencePatternValidator } from "./recurrence-pattern.vo-validator";
import { ScheduledTransactionDate } from "./scheduled-transaction-date.vo";

export enum RecurrenceType {
	ONE_TIME = "one-time",
	INFINITE = "infinite",
	UNTIL_DATE = "until-date",
	N_OCCURRENCES = "n-occurrences",
}

export class RecurrencePattern {
	private readonly validator: RecurrencePatternValidator =
		new RecurrencePatternValidator(this);

	private constructor(
		private readonly _type: RecurrenceType,
		private readonly _startDate: ScheduledTransactionDate,
		private readonly _frequency?: ItemRecurrenceFrequency,
		private readonly _endDate?: DateValueObject,
		private readonly _maxOccurrences?: NumberValueObject
	) {
		this.validator.validate();
	}

	static oneTime(startDate: ScheduledTransactionDate): RecurrencePattern {
		return new RecurrencePattern(RecurrenceType.ONE_TIME, startDate);
	}

	static infinite(
		startDate: ScheduledTransactionDate,
		frequency: ItemRecurrenceFrequency
	): RecurrencePattern {
		return new RecurrencePattern(
			RecurrenceType.INFINITE,
			startDate,
			frequency
		);
	}

	static untilDate(
		startDate: ScheduledTransactionDate,
		frequency: ItemRecurrenceFrequency,
		endDate: DateValueObject
	): RecurrencePattern {
		return new RecurrencePattern(
			RecurrenceType.UNTIL_DATE,
			startDate,
			frequency,
			endDate
		);
	}

	static untilNOccurrences(
		startDate: ScheduledTransactionDate,
		frequency: ItemRecurrenceFrequency,
		maxOccurrences: NumberValueObject
	): RecurrencePattern {
		return new RecurrencePattern(
			RecurrenceType.N_OCCURRENCES,
			startDate,
			frequency,
			undefined,
			maxOccurrences
		);
	}

	get type(): RecurrenceType {
		return this._type;
	}

	get startDate(): DateValueObject {
		return this._startDate;
	}

	get frequency(): ItemRecurrenceFrequency | undefined {
		return this._frequency;
	}

	get endDate(): DateValueObject | undefined {
		return this._endDate;
	}

	get maxOccurrences(): NumberValueObject | undefined {
		return this._maxOccurrences;
	}

	get isOneTime(): boolean {
		return this._type === RecurrenceType.ONE_TIME;
	}

	get isInfinite(): boolean {
		return this._type === RecurrenceType.INFINITE;
	}

	get hasEndDate(): boolean {
		return this._type === RecurrenceType.UNTIL_DATE;
	}

	get hasMaxOccurrences(): boolean {
		return this._type === RecurrenceType.N_OCCURRENCES;
	}

	/**
	 * Generates all occurrence dates until a given date range
	 * @param untilDate The date until which to generate occurrences
	 * @return An array of DateValueObject representing the occurrences dates
	 */
	generateOccurrencesUntil(
		untilDate: DateValueObject
	): ScheduledTransactionDate[] {
		const occurrences: ScheduledTransactionDate[] = [];

		if (this.isOneTime) {
			if (this._startDate.value <= untilDate.value)
				occurrences.push(this._startDate);
			return occurrences;
		}

		if (!this._frequency) {
			return occurrences;
		}

		let currentDate = this._startDate.copy();
		let count = 0;

		while (currentDate.value <= untilDate.value) {
			// Check max occurrences limit
			if (this._maxOccurrences && count >= this._maxOccurrences.value) {
				break;
			}

			// Check end date limit
			if (this._endDate && currentDate.value > this._endDate.value) {
				break;
			}

			occurrences.push(currentDate);
			// Move to next occurrence
			currentDate = currentDate.next(this._frequency);

			count++;
		}

		return occurrences;
	}

	/**
	 * Calculates the nth occurrence date
	 */
	getNthOccurrence(n: NumberValueObject): ScheduledTransactionDate | null {
		if (n.isNegative()) return null;

		if (this.isOneTime) {
			return n.isZero()
				? new ScheduledTransactionDate(this._startDate.value)
				: null;
		}

		if (!this._frequency) return null;

		// Check if n exceeds max occurrences
		if (
			this._maxOccurrences &&
			n.greaterOrEqualThan(this._maxOccurrences)
		) {
			return null;
		}

		let currentDate = this._startDate.copy();

		for (let i = 0; i < n.value; i++) {
			currentDate = currentDate.next(this._frequency);

			// Check if we've exceeded the end date
			if (this._endDate && currentDate.value > this._endDate.value) {
				return null;
			}
		}

		return currentDate;
	}

	/**
	 * Calculates total occurrences of the recurrence pattern
	 */
	get totalOccurrences(): number {
		if (this.isOneTime) return 1;

		if (this.isInfinite) return -1; // Infinite

		if (this.hasMaxOccurrences) {
			return this._maxOccurrences!.value;
		}

		if (this.hasEndDate && this._frequency) {
			// Calculate based on end date
			let count = 0;
			let currentDate = this._startDate.copy();

			while (currentDate.value <= this._endDate!.value) {
				count++;
				currentDate = currentDate.next(this._frequency);
			}

			return count;
		}

		return 0;
	}

	/**
	 * Gets the monthly frequency factor for budget calculations
	 */
	getMonthlyFrequencyFactor(): NumberValueObject {
		if (this.isOneTime || !this._frequency) {
			return new NumberValueObject(1); // One-time items should have factor 1, not 0
		}

		return ItemRecurrenceFrequency.MONTH_DAYS_RELATION.divide(
			this._frequency.toNumberOfDays()
		);
	}

	toPrimitives(): RecurrencePatternPrimitives {
		return {
			type: this._type,
			startDate: this._startDate.value,
			frequency: this._frequency?.value,
			endDate: this._endDate?.value,
			maxOccurrences: this._maxOccurrences?.value,
		};
	}

	static fromPrimitives(
		primitives: RecurrencePatternPrimitives
	): RecurrencePattern {
		return new RecurrencePattern(
			primitives.type,
			new ScheduledTransactionDate(new Date(primitives.startDate)),
			primitives.frequency
				? new ItemRecurrenceFrequency(primitives.frequency)
				: undefined,
			primitives.endDate
				? new DateValueObject(primitives.endDate)
				: undefined,
			primitives.maxOccurrences
				? new NumberValueObject(primitives.maxOccurrences)
				: undefined
		);
	}

	protected isEqualTo(other: RecurrencePattern): boolean {
		return (
			this._type === other._type &&
			this._startDate.equalTo(other._startDate) &&
			(!this._frequency ||
				!other._frequency ||
				this._frequency.equalTo(other._frequency)) &&
			(!this._endDate ||
				!other._endDate ||
				this._endDate.equalTo(other._endDate)) &&
			(!this._maxOccurrences ||
				!other._maxOccurrences ||
				this._maxOccurrences.equalTo(other._maxOccurrences))
		);
	}
}

export type RecurrencePatternPrimitives = {
	type: RecurrenceType;
	startDate: Date;
	frequency?: string;
	endDate?: Date;
	maxOccurrences?: number;
};
