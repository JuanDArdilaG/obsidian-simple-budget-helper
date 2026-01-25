import { DateValueObject } from "@juandardilag/value-objects";
import { Entity } from "contexts/Shared/domain/entity.abstract";
import {
	AccountSplit,
	AccountSplitPrimitives,
} from "contexts/Transactions/domain/account-split.valueobject";
import { Nanoid } from "../../Shared/domain/value-objects/id/nanoid.valueobject";

export enum RecurrenceState {
	PENDING = "pending",
	COMPLETED = "completed",
	SKIPPED = "skipped",
	DELETED = "deleted",
}

export class RecurrenceModification extends Entity<
	string,
	RecurrenceModificationPrimitives
> {
	private constructor(
		id: Nanoid,
		private readonly _scheduledItemId: Nanoid,
		private readonly _index: number,
		private readonly _originalDate: DateValueObject,
		private _state: RecurrenceState,
		private _date?: DateValueObject,
		private _fromSplits?: AccountSplit[],
		private _toSplits?: AccountSplit[],
		updatedAt?: DateValueObject,
	) {
		super(id.value, updatedAt ?? DateValueObject.createNowDate());
	}

	static create(
		scheduledItemId: Nanoid,
		index: number,
		originalDate: DateValueObject,
		state: RecurrenceState = RecurrenceState.PENDING,
		modifiedDate?: DateValueObject,
		fromSplits?: AccountSplit[],
		toSplits?: AccountSplit[],
	): RecurrenceModification {
		return new RecurrenceModification(
			Nanoid.generate(),
			scheduledItemId,
			index,
			originalDate,
			state,
			modifiedDate,
			fromSplits,
			toSplits,
		);
	}

	get scheduledItemId(): Nanoid {
		return this._scheduledItemId;
	}

	get index(): number {
		return this._index;
	}

	get originalDate(): DateValueObject {
		return this._originalDate;
	}

	get state(): RecurrenceState {
		return this._state;
	}

	get date(): DateValueObject | undefined {
		return this._date;
	}

	get fromSplits(): AccountSplit[] | undefined {
		return this._fromSplits;
	}

	get toSplits(): AccountSplit[] | undefined {
		return this._toSplits;
	}

	get isCompleted(): boolean {
		return this._state === RecurrenceState.COMPLETED;
	}

	get isPending(): boolean {
		return this._state === RecurrenceState.PENDING;
	}

	get isSkipped(): boolean {
		return this._state === RecurrenceState.SKIPPED;
	}

	get isDeleted(): boolean {
		return this._state === RecurrenceState.DELETED;
	}

	/**
	 * Marks this occurrence as completed
	 */
	markAsCompleted(): void {
		this._state = RecurrenceState.COMPLETED;
		this.updateTimestamp();
	}

	/**
	 * Marks this occurrence as skipped
	 */
	markAsSkipped(): void {
		this._state = RecurrenceState.SKIPPED;
		this.updateTimestamp();
	}

	/**
	 * Marks this occurrence as deleted
	 */
	markAsDeleted(): void {
		this._state = RecurrenceState.DELETED;
		this.updateTimestamp();
	}

	/**
	 * Resets this occurrence to pending state
	 */
	markAsPending(): void {
		this._state = RecurrenceState.PENDING;
		this.updateTimestamp();
	}

	/**
	 * Updates the date for this specific occurrence
	 */
	updateDate(date: DateValueObject): void {
		this._date = date;
		this.updateTimestamp();
	}

	/**
	 * Updates the payment splits for this specific occurrence
	 */
	updateFromSplits(fromSplits: AccountSplit[]): void {
		this._fromSplits = fromSplits;
		this.updateTimestamp();
	}

	/**
	 * Updates the payment splits for this specific occurrence
	 */
	updateToSplits(toSplits: AccountSplit[]): void {
		this._toSplits = toSplits;
		this.updateTimestamp();
	}

	/**
	 * Clears all modifications and resets to pending state
	 */
	clearModifications(): void {
		this._state = RecurrenceState.PENDING;
		this._date = undefined;
		this._fromSplits = undefined;
		this._toSplits = undefined;
		this.updateTimestamp();
	}

	/**
	 * Checks if this modification has any actual changes from the base scheduled item
	 */
	hasModifications(): boolean {
		return !!(
			this._date ||
			this._fromSplits ||
			this._toSplits ||
			this._state !== RecurrenceState.PENDING
		);
	}

	toPrimitives(): RecurrenceModificationPrimitives {
		return {
			id: this.id,
			scheduledItemId: this._scheduledItemId.value,
			index: this._index,
			originalDate: this._originalDate.value,
			state: this._state,
			modifiedDate: this._date?.value,
			fromSplits: this._fromSplits?.map((split) => split.toPrimitives()),
			toSplits: this._toSplits?.map((split) => split.toPrimitives()),
			updatedAt: this.updatedAt.toISOString(),
		};
	}

	static fromPrimitives(
		primitives: RecurrenceModificationPrimitives,
	): RecurrenceModification {
		return new RecurrenceModification(
			new Nanoid(primitives.id),
			new Nanoid(primitives.scheduledItemId),
			primitives.index,
			new DateValueObject(new Date(primitives.originalDate)),
			primitives.state,
			primitives.modifiedDate
				? new DateValueObject(new Date(primitives.modifiedDate))
				: undefined,
			primitives.fromSplits?.map(AccountSplit.fromPrimitives),
			primitives.toSplits?.map(AccountSplit.fromPrimitives),
			new DateValueObject(new Date(primitives.updatedAt)),
		);
	}

	static emptyPrimitives(): RecurrenceModificationPrimitives {
		return {
			id: "",
			scheduledItemId: "",
			index: 0,
			originalDate: new Date(),
			state: RecurrenceState.PENDING,
			updatedAt: "",
		};
	}
}

export type RecurrenceModificationPrimitives = {
	id: string;
	scheduledItemId: string;
	index: number;
	originalDate: Date;
	state: RecurrenceState;
	modifiedDate?: Date;
	fromSplits?: AccountSplitPrimitives[];
	toSplits?: AccountSplitPrimitives[];
	brand?: string;
	store?: string;
	updatedAt: string;
};
