import { InvalidArgumentError } from "../../Shared/domain";
import { RecurrencePattern, RecurrenceType } from "./recurrence-pattern.vo";

export class RecurrencePatternValidator {
	constructor(private readonly _recurrencePattern: RecurrencePattern) {}

	validate(): void {
		switch (this._recurrencePattern.type) {
			case RecurrenceType.ONE_TIME:
				this.#validateOneTime();
				break;
			case RecurrenceType.INFINITE:
				this.#validateInfinite();
				break;
			case RecurrenceType.UNTIL_DATE:
				this.#validateUntilDate();
				break;
			case RecurrenceType.N_OCCURRENCES:
				this.#validateNOccurrences();
				break;
		}

		if (
			this._recurrencePattern.endDate &&
			this._recurrencePattern.endDate.value <=
				this._recurrencePattern.startDate.value
		) {
			throw new InvalidArgumentError(
				"RecurrencePattern",
				"endDate",
				"End date must be after start date"
			);
		}

		if (
			this._recurrencePattern.maxOccurrences &&
			this._recurrencePattern.maxOccurrences.value <= 0
		) {
			throw new InvalidArgumentError(
				"RecurrencePattern",
				"maxOccurrences",
				"Max occurrences must be greater than 0"
			);
		}
	}

	#validateOneTime(): void {
		if (
			this._recurrencePattern.frequency ||
			this._recurrencePattern.endDate ||
			this._recurrencePattern.maxOccurrences
		) {
			throw new InvalidArgumentError(
				"RecurrencePattern",
				"type",
				"One-time recurrence cannot have frequency, end date, or max occurrences"
			);
		}
	}

	#validateInfinite(): void {
		if (!this._recurrencePattern.frequency) {
			throw new InvalidArgumentError(
				"RecurrencePattern",
				"frequency",
				"Infinite recurrence requires frequency"
			);
		}
		if (
			this._recurrencePattern.endDate ||
			this._recurrencePattern.maxOccurrences
		) {
			throw new InvalidArgumentError(
				"RecurrencePattern",
				"type",
				"Infinite recurrence cannot have end date or max occurrences"
			);
		}
	}

	#validateUntilDate(): void {
		if (
			!this._recurrencePattern.frequency ||
			!this._recurrencePattern.endDate
		) {
			throw new InvalidArgumentError(
				"RecurrencePattern",
				"frequency/endDate",
				"Until date recurrence requires both frequency and end date"
			);
		}
		if (this._recurrencePattern.maxOccurrences) {
			throw new InvalidArgumentError(
				"RecurrencePattern",
				"type",
				"Until date recurrence cannot have max occurrences"
			);
		}
	}

	#validateNOccurrences(): void {
		if (
			!this._recurrencePattern.frequency ||
			!this._recurrencePattern.maxOccurrences
		) {
			throw new InvalidArgumentError(
				"RecurrencePattern",
				"frequency/maxOccurrences",
				"N occurrences recurrence requires both frequency and max occurrences"
			);
		}
		if (this._recurrencePattern.endDate) {
			throw new InvalidArgumentError(
				"RecurrencePattern",
				"type",
				"N occurrences recurrence cannot have end date"
			);
		}
	}
}
