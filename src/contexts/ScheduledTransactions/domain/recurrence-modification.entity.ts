import {
	DateValueObject,
	NumberValueObject,
} from "@juandardilag/value-objects";
import { Entity } from "contexts/Shared/domain/entity.abstract";
import {
	PaymentSplit,
	PaymentSplitPrimitives,
} from "contexts/Transactions/domain/payment-split.valueobject";
import { Nanoid } from "../../Shared/domain";

export enum RecurrenceModificationState {
	PENDING = "pending",
	COMPLETED = "completed",
	SKIPPED = "skipped",
	DELETED = "deleted",
}

export class RecurrenceModification extends Entity<
	Nanoid,
	RecurrenceModificationPrimitives
> {
	private constructor(
		id: Nanoid,
		private readonly _scheduledItemId: Nanoid,
		private readonly _index: NumberValueObject,
		private readonly _originalDate: DateValueObject,
		private _state: RecurrenceModificationState,
		private _date?: DateValueObject,
		private _fromSplits?: PaymentSplit[],
		private _toSplits?: PaymentSplit[],
		updatedAt?: DateValueObject
	) {
		super(id, updatedAt ?? DateValueObject.createNowDate());
	}

	static create(
		scheduledItemId: Nanoid,
		index: NumberValueObject,
		originalDate: DateValueObject,
		state: RecurrenceModificationState = RecurrenceModificationState.PENDING,
		modifiedDate?: DateValueObject,
		fromSplits?: PaymentSplit[],
		toSplits?: PaymentSplit[]
	): RecurrenceModification {
		return new RecurrenceModification(
			Nanoid.generate(),
			scheduledItemId,
			index,
			originalDate,
			state,
			modifiedDate,
			fromSplits,
			toSplits
		);
	}

	get scheduledItemId(): Nanoid {
		return this._scheduledItemId;
	}

	get index(): NumberValueObject {
		return this._index;
	}

	get originalDate(): DateValueObject {
		return this._originalDate;
	}

	get state(): RecurrenceModificationState {
		return this._state;
	}

	get date(): DateValueObject | undefined {
		return this._date;
	}

	get fromSplits(): PaymentSplit[] | undefined {
		return this._fromSplits;
	}

	get toSplits(): PaymentSplit[] | undefined {
		return this._toSplits;
	}

	get isCompleted(): boolean {
		return this._state === RecurrenceModificationState.COMPLETED;
	}

	get isPending(): boolean {
		return this._state === RecurrenceModificationState.PENDING;
	}

	get isSkipped(): boolean {
		return this._state === RecurrenceModificationState.SKIPPED;
	}

	get isDeleted(): boolean {
		return this._state === RecurrenceModificationState.DELETED;
	}

	/**
	 * Marks this occurrence as completed
	 */
	markAsCompleted(): void {
		this._state = RecurrenceModificationState.COMPLETED;
		this.updateTimestamp();
	}

	/**
	 * Marks this occurrence as skipped
	 */
	markAsSkipped(): void {
		this._state = RecurrenceModificationState.SKIPPED;
		this.updateTimestamp();
	}

	/**
	 * Marks this occurrence as deleted
	 */
	markAsDeleted(): void {
		this._state = RecurrenceModificationState.DELETED;
		this.updateTimestamp();
	}

	/**
	 * Resets this occurrence to pending state
	 */
	markAsPending(): void {
		this._state = RecurrenceModificationState.PENDING;
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
	updateFromSplits(fromSplits: PaymentSplit[]): void {
		this._fromSplits = fromSplits;
		this.updateTimestamp();
	}

	/**
	 * Updates the payment splits for this specific occurrence
	 */
	updateToSplits(toSplits: PaymentSplit[]): void {
		this._toSplits = toSplits;
		this.updateTimestamp();
	}

	/**
	 * Clears all modifications and resets to pending state
	 */
	clearModifications(): void {
		this._state = RecurrenceModificationState.PENDING;
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
			this._state !== RecurrenceModificationState.PENDING
		);
	}

	toPrimitives(): RecurrenceModificationPrimitives {
		return {
			id: this.id.value,
			scheduledItemId: this._scheduledItemId.value,
			index: this._index.value,
			originalDate: this._originalDate.value,
			state: this._state,
			modifiedDate: this._date?.value,
			fromSplits: this._fromSplits?.map((split) => split.toPrimitives()),
			toSplits: this._toSplits?.map((split) => split.toPrimitives()),
			updatedAt: this.updatedAt.value.toISOString(),
		};
	}

	static fromPrimitives(
		primitives: RecurrenceModificationPrimitives
	): RecurrenceModification {
		return new RecurrenceModification(
			new Nanoid(primitives.id),
			new Nanoid(primitives.scheduledItemId),
			new NumberValueObject(primitives.index),
			new DateValueObject(new Date(primitives.originalDate)),
			primitives.state,
			primitives.modifiedDate
				? new DateValueObject(new Date(primitives.modifiedDate))
				: undefined,
			primitives.fromSplits?.map((split) =>
				PaymentSplit.fromPrimitives(split)
			),
			primitives.toSplits?.map((split) =>
				PaymentSplit.fromPrimitives(split)
			),
			new DateValueObject(new Date(primitives.updatedAt))
		);
	}

	static emptyPrimitives(): RecurrenceModificationPrimitives {
		return {
			id: "",
			scheduledItemId: "",
			index: 0,
			originalDate: new Date(),
			state: RecurrenceModificationState.PENDING,
			updatedAt: "",
		};
	}
}

export type RecurrenceModificationPrimitives = {
	id: string;
	scheduledItemId: string;
	index: number;
	originalDate: Date;
	state: RecurrenceModificationState;
	modifiedDate?: Date;
	fromSplits?: PaymentSplitPrimitives[];
	toSplits?: PaymentSplitPrimitives[];
	brand?: string;
	store?: string;
	updatedAt: string;
};
