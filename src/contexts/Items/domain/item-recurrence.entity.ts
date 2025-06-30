import {
	DateValueObject,
	NumberValueObject,
} from "@juandardilag/value-objects";
import { AccountID } from "contexts/Accounts/domain";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { ItemDate } from "./item-date.valueobject";
import { ItemPrice } from "./item-price.valueobject";
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
			frequency,
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

	/**
	 * Validates if a schedule change would cause modifications to be lost
	 * @param newStartDate The new start date to validate
	 * @param newUntilDate The new until date to validate
	 * @returns Object containing validation result and details about potential data loss
	 */
	validateScheduleChange(
		newStartDate?: DateValueObject,
		newUntilDate?: ItemRecurrenceUntilDate
	): {
		isValid: boolean;
		wouldLoseModifications: boolean;
		lostModificationIndices: number[];
		estimatedNewRecurrenceCount: number;
		currentModificationCount: number;
	} {
		// Count current modifications
		const currentModifications = this.preserveModifications();
		const currentModificationCount = currentModifications.size;

		// Estimate new recurrence count based on the proposed changes
		let estimatedNewRecurrenceCount = 0;

		if (this.isOneTime()) {
			estimatedNewRecurrenceCount = 1;
		} else if (this._frequency) {
			const startDate = newStartDate || this._startDate;
			const untilDate = newUntilDate || this._untilDate;

			if (untilDate) {
				// Calculate how many recurrences would fit in the new date range
				let currentDate = new ItemDate(startDate);
				const untilDateTime = untilDate.getTime();
				let count = 0;

				while (currentDate.getTime() <= untilDateTime) {
					count++;
					currentDate = currentDate.next(this._frequency);
				}
				estimatedNewRecurrenceCount = count;
			} else {
				// Infinite recurrence - use default max
				estimatedNewRecurrenceCount = 50;
			}
		}

		// Check which modifications would be lost
		const lostModificationIndices: number[] = [];
		currentModifications.forEach((_modification, index) => {
			if (index >= estimatedNewRecurrenceCount) {
				lostModificationIndices.push(index);
			}
		});

		const wouldLoseModifications = lostModificationIndices.length > 0;
		const isValid = !wouldLoseModifications;

		return {
			isValid,
			wouldLoseModifications,
			lostModificationIndices,
			estimatedNewRecurrenceCount,
			currentModificationCount,
		};
	}

	updateStartDate(startDate: DateValueObject): void {
		// Validate the change before applying it
		const validation = this.validateScheduleChange(startDate);

		if (validation.wouldLoseModifications) {
			console.warn(
				`[ItemRecurrence] Changing start date from ${this._startDate.toISOString()} to ${startDate.toISOString()} would lose modifications for recurrences ${validation.lostModificationIndices.join(
					", "
				)}. ` +
					`Current modifications: ${validation.currentModificationCount}, Estimated new recurrences: ${validation.estimatedNewRecurrenceCount}. ` +
					`Consider adjusting the schedule to preserve all modifications.`
			);
		}

		// Preserve modifications before recreating recurrences
		const modifications = this.preserveModifications();
		this._startDate = startDate;
		this.createRecurrences();
		// Restore modifications after recreating recurrences
		this.restoreModifications(modifications);
	}

	get frequency(): ItemRecurrenceFrequency | undefined {
		return this._frequency;
	}

	get untilDate(): ItemRecurrenceUntilDate | undefined {
		return this._untilDate;
	}

	updateUntilDate(untilDate?: ItemRecurrenceUntilDate): void {
		// Validate the change before applying it
		const validation = this.validateScheduleChange(undefined, untilDate);

		if (validation.wouldLoseModifications) {
			console.warn(
				`[ItemRecurrence] Changing until date to ${
					untilDate?.toISOString() || "undefined"
				} would lose modifications for recurrences ${validation.lostModificationIndices.join(
					", "
				)}. ` +
					`Current modifications: ${validation.currentModificationCount}, Estimated new recurrences: ${validation.estimatedNewRecurrenceCount}. ` +
					`Consider adjusting the schedule to preserve all modifications.`
			);
		}

		// Preserve modifications before recreating recurrences
		const modifications = this.preserveModifications();
		this._untilDate = untilDate;
		this.createRecurrences();
		// Restore modifications after recreating recurrences
		this.restoreModifications(modifications);
	}

	get recurrences(): ItemRecurrenceInfo[] {
		return this._recurrences;
	}

	updateRecurrences(recurrences: ItemRecurrenceInfo[]): void {
		this._recurrences.length = 0;
		this._recurrences.push(...recurrences);
	}

	/**
	 * Preserves modifications (price, account, toAccount, state) from existing recurrences
	 * to be restored after recreating the recurrence pattern
	 */
	private preserveModifications(): Map<
		number,
		{
			price?: ItemPrice;
			account?: AccountID;
			toAccount?: AccountID;
			state?: ERecurrenceState;
		}
	> {
		const modifications = new Map<
			number,
			{
				price?: ItemPrice;
				account?: AccountID;
				toAccount?: AccountID;
				state?: ERecurrenceState;
			}
		>();

		this._recurrences.forEach((recurrence, index) => {
			const modification: {
				price?: ItemPrice;
				account?: AccountID;
				toAccount?: AccountID;
				state?: ERecurrenceState;
			} = {};

			if (recurrence.price) modification.price = recurrence.price;
			if (recurrence.account) modification.account = recurrence.account;
			if (recurrence.toAccount)
				modification.toAccount = recurrence.toAccount;
			if (recurrence.state !== ERecurrenceState.PENDING) {
				modification.state = recurrence.state;
			}

			if (Object.keys(modification).length > 0) {
				modifications.set(index, modification);
			}
		});

		return modifications;
	}

	/**
	 * Restores modifications to the newly created recurrences
	 */
	private restoreModifications(
		modifications: Map<
			number,
			{
				price?: ItemPrice;
				account?: AccountID;
				toAccount?: AccountID;
				state?: ERecurrenceState;
			}
		>
	): void {
		// Check if any modifications would be lost due to fewer recurrences
		const lostModifications: number[] = [];
		modifications.forEach((_modification, index) => {
			if (index >= this._recurrences.length) {
				lostModifications.push(index);
			}
		});

		// Log warning if modifications would be lost
		if (lostModifications.length > 0) {
			console.warn(
				`[ItemRecurrence] Schedule modification reduced recurrences from ${modifications.size} to ${this._recurrences.length}. ` +
					`Modifications for recurrences ${lostModifications.join(
						", "
					)} will be lost. ` +
					`Consider adjusting the schedule to preserve all modifications.`
			);
		}

		// Restore modifications that can still be applied
		modifications.forEach((modification, index) => {
			if (index < this._recurrences.length) {
				const recurrence = this._recurrences[index];

				if (modification.price) {
					recurrence.updatePrice(modification.price);
				}
				if (modification.account) {
					recurrence.updateAccount(modification.account);
				}
				if (modification.toAccount) {
					recurrence.updateToAccount(modification.toAccount);
				}
				if (modification.state) {
					recurrence.updateState(modification.state);
				}
			}
		});
	}

	/**
	 * Safely modifies a specific recurrence with validation
	 */
	modifyRecurrence(index: number, modification: ItemRecurrenceInfo): void {
		if (index < 0 || index >= this._recurrences.length) {
			throw new Error(
				`Invalid recurrence index: ${index}. Valid range: 0-${
					this._recurrences.length - 1
				}`
			);
		}

		const currentRecurrence = this._recurrences[index];

		// Update the recurrence with the new information
		if (modification.date) {
			currentRecurrence.updateDate(modification.date);
		}
		if (modification.price) {
			currentRecurrence.updatePrice(modification.price);
		}
		if (modification.account) {
			currentRecurrence.updateAccount(modification.account);
		}
		if (modification.toAccount) {
			currentRecurrence.updateToAccount(modification.toAccount);
		}
		if (modification.state) {
			currentRecurrence.updateState(modification.state);
		}
	}

	/**
	 * Deletes a specific recurrence (marks as deleted)
	 */
	deleteRecurrence(index: number): void {
		if (index < 0 || index >= this._recurrences.length) {
			throw new Error(
				`Invalid recurrence index: ${index}. Valid range: 0-${
					this._recurrences.length - 1
				}`
			);
		}

		this._recurrences[index].updateState(ERecurrenceState.DELETED);
	}

	/**
	 * Marks a specific recurrence as completed
	 */
	completeRecurrence(index: number): void {
		if (index < 0 || index >= this._recurrences.length) {
			throw new Error(
				`Invalid recurrence index: ${index}. Valid range: 0-${
					this._recurrences.length - 1
				}`
			);
		}

		this._recurrences[index].updateState(ERecurrenceState.COMPLETED);
	}

	/**
	 * Records a future recurrence in advance
	 */
	recordFutureRecurrence(index: number): void {
		if (index < 0 || index >= this._recurrences.length) {
			throw new Error(
				`Invalid recurrence index: ${index}. Valid range: 0-${
					this._recurrences.length - 1
				}`
			);
		}

		this._recurrences[index].updateState(ERecurrenceState.COMPLETED);
	}

	/**
	 * Gets the count of active (non-deleted) recurrences
	 */
	get activeRecurrenceCount(): number {
		return this._recurrences.filter(
			(recurrence) => recurrence.state !== ERecurrenceState.DELETED
		).length;
	}

	/**
	 * Gets the count of completed recurrences
	 */
	get completedRecurrenceCount(): number {
		return this._recurrences.filter(
			(recurrence) => recurrence.state === ERecurrenceState.COMPLETED
		).length;
	}

	/**
	 * Gets the count of pending recurrences
	 */
	get pendingRecurrenceCount(): number {
		return this._recurrences.filter(
			(recurrence) => recurrence.state === ERecurrenceState.PENDING
		).length;
	}

	/**
	 * Gets the count of deleted recurrences
	 */
	get deletedRecurrenceCount(): number {
		return this._recurrences.filter(
			(recurrence) => recurrence.state === ERecurrenceState.DELETED
		).length;
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

	/**
	 * Gets all recurrences with their states for display/management
	 */
	getAllRecurrencesWithStates(): {
		recurrence: ItemRecurrenceInfo;
		n: NumberValueObject;
	}[] {
		return this._recurrences.map((recurrence, i) => ({
			recurrence: new ItemRecurrenceInfo(
				recurrence.date,
				recurrence.state,
				recurrence.price,
				recurrence.account,
				recurrence.toAccount
			),
			n: new NumberValueObject(i),
		}));
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
		let nextDateTime = new ItemDate(this.startDate).getTime();
		const untilDateTime = this.untilDate.getTime();
		let count = 0;
		let currentDate = new ItemDate(this.startDate);

		while (nextDateTime <= untilDateTime) {
			count++;
			currentDate = currentDate.next(this.frequency);
			nextDateTime = currentDate.getTime();
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
