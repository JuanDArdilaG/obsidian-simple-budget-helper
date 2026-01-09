import {
	DateValueObject,
	NumberValueObject,
	PriceValueObject,
	StringValueObject,
} from "@juandardilag/value-objects";
import { AccountID, AccountType } from "contexts/Accounts/domain";
import { Category } from "contexts/Categories/domain";
import {
	ItemOperation,
	ItemOperationPrimitives,
	Nanoid,
} from "contexts/Shared/domain";
import { Entity } from "contexts/Shared/domain/entity.abstract";
import { SubCategory } from "contexts/Subcategories/domain";
import {
	PaymentSplit,
	PaymentSplitPrimitives,
} from "contexts/Transactions/domain/payment-split.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import {
	TransactionCategory,
	TransactionCategoryPrimitives,
} from "../../Transactions/domain/transaction-category.vo";
import { ItemRecurrenceFrequency } from "./item-recurrence-frequency.valueobject";
import { ItemTags } from "./item-tags.valueobject";
import { ScheduledItem } from "./old/scheduled-item.entity";
import {
	RecurrencePattern,
	RecurrencePatternPrimitives,
	RecurrenceType,
} from "./recurrence-pattern.vo";
import { ScheduledTransactionDate } from "./scheduled-transaction-date.vo";

export class ScheduledTransaction extends Entity<
	Nanoid,
	ScheduledTransactionPrimitives
> {
	private constructor(
		id: Nanoid,
		private _name: StringValueObject,
		private _fromSplits: PaymentSplit[],
		private _toSplits: PaymentSplit[],
		private _operation: ItemOperation,
		private _category: TransactionCategory,
		private _recurrencePattern: RecurrencePattern,
		private _nextOccurrenceIndex: NumberValueObject,
		private _store?: StringValueObject,
		private _tags?: ItemTags,
		updatedAt?: DateValueObject
	) {
		super(id, updatedAt ?? DateValueObject.createNowDate());
		this.validateTransferOperation();
	}

	static createOneTime(
		name: StringValueObject,
		date: ScheduledTransactionDate,
		fromSplits: PaymentSplit[],
		toSplits: PaymentSplit[],
		operation: ItemOperation,
		category: TransactionCategory,
		store?: StringValueObject,
		tags?: ItemTags
	): ScheduledTransaction {
		const recurrencePattern = RecurrencePattern.oneTime(date);
		return new ScheduledTransaction(
			Nanoid.generate(),
			name,
			fromSplits,
			toSplits,
			operation,
			category,
			recurrencePattern,
			NumberValueObject.zero(),
			store,
			tags
		);
	}

	static createInfinite(
		name: StringValueObject,
		startDate: ScheduledTransactionDate,
		frequency: ItemRecurrenceFrequency,
		fromSplits: PaymentSplit[],
		toSplits: PaymentSplit[],
		operation: ItemOperation,
		category: TransactionCategory,
		store?: StringValueObject,
		tags?: ItemTags
	): ScheduledTransaction {
		const recurrencePattern = RecurrencePattern.infinite(
			startDate,
			frequency
		);
		return new ScheduledTransaction(
			Nanoid.generate(),
			name,
			fromSplits,
			toSplits,
			operation,
			category,
			recurrencePattern,
			NumberValueObject.zero(),
			store,
			tags
		);
	}

	static createWithEndDate(
		name: StringValueObject,
		startDate: ScheduledTransactionDate,
		frequency: ItemRecurrenceFrequency,
		endDate: DateValueObject,
		fromSplits: PaymentSplit[],
		toSplits: PaymentSplit[],
		operation: ItemOperation,
		category: TransactionCategory,
		store?: StringValueObject,
		tags?: ItemTags
	): ScheduledTransaction {
		const recurrencePattern = RecurrencePattern.untilDate(
			startDate,
			frequency,
			endDate
		);
		return new ScheduledTransaction(
			Nanoid.generate(),
			name,
			fromSplits,
			toSplits,
			operation,
			category,
			recurrencePattern,
			NumberValueObject.zero(),
			store,
			tags
		);
	}

	static createWithMaxOccurrences(
		name: StringValueObject,
		startDate: ScheduledTransactionDate,
		frequency: ItemRecurrenceFrequency,
		maxOccurrences: NumberValueObject,
		fromSplits: PaymentSplit[],
		toSplits: PaymentSplit[],
		operation: ItemOperation,
		category: TransactionCategory,
		store?: StringValueObject,
		tags?: ItemTags
	): ScheduledTransaction {
		const recurrencePattern = RecurrencePattern.untilNOccurrences(
			startDate,
			frequency,
			maxOccurrences
		);
		return new ScheduledTransaction(
			Nanoid.generate(),
			name,
			fromSplits,
			toSplits,
			operation,
			category,
			recurrencePattern,
			NumberValueObject.zero(),
			store,
			tags
		);
	}

	static fromScheduledItemV1(
		itemV1: ScheduledItem,
		category: Category,
		subCategory: SubCategory
	): ScheduledTransaction {
		return new ScheduledTransaction(
			itemV1.id,
			itemV1.name,
			itemV1.fromSplits,
			itemV1.toSplits,
			itemV1.operation,
			new TransactionCategory(category, subCategory),
			RecurrencePattern.fromPrimitives({
				startDate: new Date(itemV1.recurrence.startDate),
				type: RecurrenceType.INFINITE,
				endDate:
					itemV1.recurrence.isOneTime() ||
					!itemV1.recurrence.untilDate ||
					itemV1.recurrence.startDate.getTime() ===
						itemV1.recurrence.untilDate?.getTime()
						? undefined
						: new Date(itemV1.recurrence.untilDate),
				frequency: itemV1.recurrence.frequency?.value,
				maxOccurrences:
					itemV1.recurrence.totalRecurrences === -1 ||
					itemV1.recurrence.totalRecurrences === 1
						? undefined
						: itemV1.recurrence.totalRecurrences,
			}),
			NumberValueObject.zero(),
			itemV1.info?.store,
			itemV1.tags,
			DateValueObject.createNowDate()
		);
	}

	// Getters
	get name(): StringValueObject {
		return this._name;
	}

	get fromSplits(): PaymentSplit[] {
		return this._fromSplits;
	}

	get toSplits(): PaymentSplit[] {
		return this._toSplits;
	}

	get operation(): ItemOperation {
		return this._operation;
	}

	get category(): TransactionCategory {
		return this._category;
	}

	get recurrencePattern(): RecurrencePattern {
		return this._recurrencePattern;
	}

	get nextOccurrenceIndex(): NumberValueObject {
		return this._nextOccurrenceIndex;
	}

	set nextOccurrenceIndex(value: NumberValueObject) {
		this._nextOccurrenceIndex = value;
	}

	get store(): StringValueObject | undefined {
		return this._store;
	}

	get tags(): ItemTags | undefined {
		return this._tags;
	}

	get fromAmount(): TransactionAmount {
		return PaymentSplit.totalAmount(this._fromSplits);
	}

	get toAmount(): TransactionAmount {
		return PaymentSplit.totalAmount(this._toSplits);
	}

	/**
	 * Returns the real price for this item based on operation type
	 */
	get realPrice(): PriceValueObject {
		if (this._operation.type.isIncome()) return this.fromAmount;
		else if (this._operation.type.isExpense())
			return this.fromAmount.negate();
		return PriceValueObject.zero();
	}

	/**
	 * Returns the real price with account types consideration
	 */
	getRealPriceWithAccountTypes(
		accountTypeLookup: (id: AccountID) => AccountType
	): PriceValueObject {
		if (this._operation.type.isIncome()) {
			return this.fromAmount;
		} else if (this._operation.type.isExpense()) {
			return this.fromAmount.negate();
		} else if (this._operation.type.isTransfer()) {
			// For transfers, we need to check account types to determine the sign
			if (this._fromSplits.length === 0 || this._toSplits.length === 0) {
				return PriceValueObject.zero();
			}

			const fromType = accountTypeLookup(this._fromSplits[0].accountId);
			const toType = accountTypeLookup(this._toSplits[0].accountId);

			// Asset to Liability: negative (expense)
			if (fromType.isAsset() && toType.isLiability()) {
				return this.fromAmount.negate();
			}
			// Liability to Asset: positive (income)
			else if (fromType.isLiability() && toType.isAsset()) {
				return this.fromAmount;
			}
			// Asset to Asset or Liability to Liability: neutral (zero)
			else {
				return PriceValueObject.zero();
			}
		}
		return PriceValueObject.zero();
	}

	/**
	 * Returns the price per month with account types consideration
	 */
	getPricePerMonthWithAccountTypes(
		accountTypeLookup: (id: AccountID) => AccountType
	): PriceValueObject {
		const realPrice = this.getRealPriceWithAccountTypes(accountTypeLookup);
		const monthlyFactor = this.getMonthlyFrequencyFactor();
		return realPrice.times(monthlyFactor);
	}

	// Basic property updates
	updateName(name: StringValueObject): void {
		this._name = name;
		this.updateTimestamp();
	}

	updateFromSplits(fromSplits: PaymentSplit[]): void {
		this._fromSplits = fromSplits;
		this.updateTimestamp();
	}

	updateToSplits(toSplits: PaymentSplit[]): void {
		this._toSplits = toSplits;
		this.updateTimestamp();
	}

	updateOperation(operation: ItemOperation): void {
		this._operation = operation;
		this.validateTransferOperation();
		this.updateTimestamp();
	}

	updateTags(tags: ItemTags): void {
		this._tags = tags;
		this.updateTimestamp();
	}

	clearTags(): void {
		this._tags = ItemTags.empty();
		this.updateTimestamp();
	}

	/**
	 * Updates the recurrence pattern - this is a major change that may invalidate existing modifications
	 */
	updateRecurrencePattern(pattern: RecurrencePattern): void {
		this._recurrencePattern = pattern;
		this.updateTimestamp();
	}

	/**
	 * Creates a copy of this item - for test compatibility
	 */
	copy(): ScheduledTransaction {
		return new ScheduledTransaction(
			this._id,
			this._name,
			[
				...this._fromSplits.map((split) =>
					PaymentSplit.fromPrimitives(split.toPrimitives())
				),
			],
			[
				...this._toSplits.map((split) =>
					PaymentSplit.fromPrimitives(split.toPrimitives())
				),
			],
			this._operation,
			this._category,
			this._recurrencePattern,
			this._nextOccurrenceIndex,
			this._store,
			this._tags,
			this.updatedAt
		);
	}

	/**
	 * Gets the date for a specific occurrence index
	 */
	getOccurrenceDate(
		index: NumberValueObject
	): ScheduledTransactionDate | null {
		return this._recurrencePattern.getNthOccurrence(index);
	}

	/**
	 * Gets the monthly frequency factor for budget calculations
	 */
	getMonthlyFrequencyFactor(): NumberValueObject {
		return this._recurrencePattern.getMonthlyFrequencyFactor();
	}

	toPrimitives(): ScheduledTransactionPrimitives {
		return {
			id: this.id.value,
			name: this._name.value,
			fromSplits: this._fromSplits.map((split) => split.toPrimitives()),
			toSplits: this._toSplits.map((split) => split.toPrimitives()),
			operation: this._operation.toPrimitives(),
			category: this._category.toPrimitives(),
			recurrencePattern: this._recurrencePattern.toPrimitives(),
			nextOccurrenceIndex: this._nextOccurrenceIndex.value,
			tags: this._tags?.toPrimitives(),
			updatedAt: this.updatedAt.value.toISOString(),
		};
	}

	static fromPrimitives(
		primitives: ScheduledTransactionPrimitives
	): ScheduledTransaction {
		return new ScheduledTransaction(
			new Nanoid(primitives.id),
			new StringValueObject(primitives.name),
			primitives.fromSplits.map((split) =>
				PaymentSplit.fromPrimitives(split)
			),
			primitives.toSplits.map((split) =>
				PaymentSplit.fromPrimitives(split)
			),
			ItemOperation.fromPrimitives(primitives.operation),
			TransactionCategory.fromPrimitives(primitives.category),
			RecurrencePattern.fromPrimitives(primitives.recurrencePattern),
			new NumberValueObject(primitives.nextOccurrenceIndex),
			primitives.store
				? new StringValueObject(primitives.store)
				: undefined,
			primitives.tags
				? ItemTags.fromPrimitives(primitives.tags)
				: undefined,
			new DateValueObject(new Date(primitives.updatedAt))
		);
	}

	/**
	 * Validates that transfer operations have a toSplits array
	 */
	private validateTransferOperation(): void {
		if (this._operation.type.isTransfer() && this._toSplits.length === 0) {
			throw new Error("Transfer operations must have a toSplits array");
		}
	}

	static emptyPrimitives(): ScheduledTransactionPrimitives {
		return {
			id: "",
			name: "",
			fromSplits: [],
			toSplits: [],
			operation: ItemOperation.expense().toPrimitives(),
			category: {
				category: Category.emptyPrimitives(),
				subCategory: SubCategory.emptyPrimitives(),
			},
			store: undefined,
			recurrencePattern: RecurrencePattern.oneTime(
				ScheduledTransactionDate.createNowDate()
			).toPrimitives(),
			nextOccurrenceIndex: 0,
			updatedAt: "",
		};
	}
}

export type ScheduledTransactionPrimitives = {
	id: string;
	name: string;
	fromSplits: PaymentSplitPrimitives[];
	toSplits: PaymentSplitPrimitives[];
	operation: ItemOperationPrimitives;
	category: TransactionCategoryPrimitives;
	recurrencePattern: RecurrencePatternPrimitives;
	nextOccurrenceIndex: number;
	store?: string;
	tags?: string[];
	updatedAt: string;
};
