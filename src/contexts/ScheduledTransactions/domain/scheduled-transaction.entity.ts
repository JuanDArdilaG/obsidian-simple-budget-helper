import {
	DateValueObject,
	NumberValueObject,
	PriceValueObject,
	StringValueObject,
} from "@juandardilag/value-objects";
import { AccountType } from "contexts/Accounts/domain";
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
import { ItemTag } from "./item-tag.valueobject";
import { ItemTags } from "./item-tags.valueobject";
import {
	RecurrencePattern,
	RecurrencePatternPrimitives,
} from "./recurrence-pattern.vo";
import { ScheduledTransactionDate } from "./scheduled-transaction-date.vo";

export class ScheduledTransaction extends Entity<
	Nanoid,
	ScheduledTransactionPrimitives
> {
	private constructor(
		id: Nanoid,
		private _name: StringValueObject,
		private _originAccounts: PaymentSplit[],
		private _destinationAccounts: PaymentSplit[],
		private _operation: ItemOperation,
		private readonly _category: TransactionCategory,
		private _recurrencePattern: RecurrencePattern,
		private readonly _store?: StringValueObject,
		private _tags?: ItemTags,
		updatedAt?: DateValueObject,
	) {
		super(id, updatedAt ?? DateValueObject.createNowDate());
		this.validateTransferOperation();
	}

	static create(
		name: StringValueObject,
		recurrencePattern: RecurrencePattern,
		fromSplits: PaymentSplit[],
		toSplits: PaymentSplit[],
		operation: ItemOperation,
		category: TransactionCategory,
		store?: StringValueObject,
	): ScheduledTransaction {
		return new ScheduledTransaction(
			Nanoid.generate(),
			name,
			fromSplits,
			toSplits,
			operation,
			category,
			recurrencePattern,
			store,
		);
	}

	// Getters
	get name(): StringValueObject {
		return this._name;
	}

	get originAccounts(): PaymentSplit[] {
		return this._originAccounts;
	}

	get destinationAccounts(): PaymentSplit[] {
		return this._destinationAccounts;
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

	get store(): StringValueObject | undefined {
		return this._store;
	}

	get tags(): ItemTags | undefined {
		return this._tags;
	}

	get originAmount(): TransactionAmount {
		return PaymentSplit.totalAmount(this._originAccounts);
	}

	get destinationAmount(): TransactionAmount {
		return PaymentSplit.totalAmount(this._destinationAccounts);
	}

	/**
	 * Returns the real price for this item based on operation type
	 */
	get realPrice(): PriceValueObject {
		if (this._operation.type.isIncome()) return this.originAmount;
		else if (this._operation.type.isExpense())
			return this.originAmount.negate();
		return PriceValueObject.zero();
	}

	/**
	 * Returns the real price with account types consideration
	 */
	getRealPriceWithAccountTypes(
		fromAccountType: AccountType,
		toAccountType?: AccountType,
	): PriceValueObject {
		if (this._operation.type.isIncome()) {
			return this.originAmount;
		} else if (this._operation.type.isExpense()) {
			return this.originAmount.negate();
		} else if (this._operation.type.isTransfer() && toAccountType) {
			// For transfers, we need to check account types to determine the sign
			if (
				this._originAccounts.length === 0 ||
				this._destinationAccounts.length === 0
			) {
				return PriceValueObject.zero();
			}

			const fromType = fromAccountType;
			const toType = toAccountType;

			// Asset to Liability: negative (expense)
			if (fromType.isAsset() && toType.isLiability()) {
				return this.originAmount.negate();
			}
			// Liability to Asset: positive (income)
			else if (fromType.isLiability() && toType.isAsset()) {
				return this.originAmount;
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
		fromAccountType: AccountType,
		toAccountType?: AccountType,
	): PriceValueObject {
		const realPrice = this.getRealPriceWithAccountTypes(
			fromAccountType,
			toAccountType,
		);
		const monthlyFactor = this.getMonthlyFrequencyFactor();
		return realPrice.times(monthlyFactor);
	}

	/**
	 * Returns the price per month with account types consideration
	 */
	get pricePerMonth(): PriceValueObject {
		const monthlyFactor = this.getMonthlyFrequencyFactor();
		return this.realPrice.times(monthlyFactor);
	}

	// Basic property updates
	updateName(name: StringValueObject): void {
		if (this._name.equalTo(name)) return;
		this._name = name;
		this.updateTimestamp();
	}

	updateOriginAccounts(fromSplits: PaymentSplit[]): void {
		this._originAccounts = fromSplits;
		this.updateTimestamp();
	}

	updateDestinationAccounts(toSplits: PaymentSplit[]): void {
		this._destinationAccounts = toSplits;
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

	addTag(tag: ItemTag): void {
		this._tags ??= ItemTags.empty();
		this._tags = this._tags.add(tag);
		this.updateTimestamp();
	}

	/**
	 * Remove a tag from the item
	 */
	removeTag(tag: ItemTag): void {
		if (!this._tags) return;
		this._tags = this._tags.remove(tag);
		this.updateTimestamp();
	}

	/**
	 * Check if the item has a specific tag
	 */
	hasTag(tag: ItemTag): boolean {
		if (!this._tags) return false;
		return this._tags.has(tag);
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
			this._originAccounts.map((split) =>
				PaymentSplit.fromPrimitives(split.toPrimitives()),
			),
			this._destinationAccounts.map((split) =>
				PaymentSplit.fromPrimitives(split.toPrimitives()),
			),
			this._operation,
			this._category,
			this._recurrencePattern,
			this._store,
			this._tags,
			this.updatedAt,
		);
	}

	/**
	 * Gets the date for a specific occurrence index
	 */
	getOccurrenceDate(
		index: NumberValueObject,
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
			fromSplits: this._originAccounts.map((split) =>
				split.toPrimitives(),
			),
			toSplits: this._destinationAccounts.map((split) =>
				split.toPrimitives(),
			),
			operation: this._operation.toPrimitives(),
			category: this._category.toPrimitives(),
			recurrencePattern: this._recurrencePattern.toPrimitives(),
			tags: this._tags?.toPrimitives(),
			updatedAt: this.updatedAt.value.toISOString(),
		};
	}

	static fromPrimitives(
		primitives: ScheduledTransactionPrimitives,
	): ScheduledTransaction {
		return new ScheduledTransaction(
			new Nanoid(primitives.id),
			new StringValueObject(primitives.name),
			primitives.fromSplits.map((split) =>
				PaymentSplit.fromPrimitives(split),
			),
			primitives.toSplits.map((split) =>
				PaymentSplit.fromPrimitives(split),
			),
			ItemOperation.fromPrimitives(primitives.operation),
			TransactionCategory.fromPrimitives(primitives.category),
			RecurrencePattern.fromPrimitives(primitives.recurrencePattern),
			primitives.store
				? new StringValueObject(primitives.store)
				: undefined,
			primitives.tags
				? ItemTags.fromPrimitives(primitives.tags)
				: undefined,
			new DateValueObject(new Date(primitives.updatedAt)),
		);
	}

	/**
	 * Validates that transfer operations have a toSplits array
	 */
	private validateTransferOperation(): void {
		if (
			this._operation.type.isTransfer() &&
			this._destinationAccounts.length === 0
		) {
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
				ScheduledTransactionDate.createNowDate(),
			).toPrimitives(),
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
	store?: string;
	tags?: string[];
	updatedAt: string;
};
