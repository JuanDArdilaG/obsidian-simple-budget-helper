import {
	DateValueObject,
	NumberValueObject,
} from "@juandardilag/value-objects";
import { AccountID, AccountType } from "contexts/Accounts/domain";
import { CategoryID } from "contexts/Categories/domain";
import { InvalidArgumentError } from "contexts/Shared/domain";
import { Entity } from "contexts/Shared/domain/entity.abstract";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { SubCategoryID } from "contexts/Subcategories/domain";
import {
	ItemOperation,
	ItemOperationPrimitives,
} from "../../Shared/domain/Item/item-operation.valueobject";
import {
	PaymentSplit,
	PaymentSplitPrimitives,
} from "../../Transactions/domain/payment-split.valueobject";
import { TransactionAmount } from "../../Transactions/domain/transaction-amount.valueobject";
import { ItemBrand } from "./item-brand.valueobject";
import { ItemID } from "./item-id.valueobject";
import { ItemName } from "./item-name.valueobject";
import { ItemPrice } from "./item-price.valueobject";
import { ItemProductInfo } from "./item-product-info.valueobject";
import { ItemRecurrenceFrequency } from "./item-recurrence-frequency.valueobject";
import { ItemRecurrenceInfo } from "./item-recurrence-modification.valueobject";
import { ItemRecurrence, RecurrencePrimitives } from "./item-recurrence.entity";
import { ItemStore } from "./item-store.valueobject";
import { ItemTag } from "./item-tag.valueobject";
import { ItemTags } from "./item-tags.valueobject";

export class ScheduledItem extends Entity<ItemID, ScheduledItemPrimitives> {
	readonly _ = new Logger("ScheduledItem");
	private constructor(
		id: ItemID,
		private _name: ItemName,
		private _fromSplits: PaymentSplit[],
		private _toSplits: PaymentSplit[],
		private _operation: ItemOperation,
		private _category: CategoryID,
		private _subCategory: SubCategoryID,
		private _recurrence: ItemRecurrence,
		updatedAt: DateValueObject,
		private readonly _info?: ItemProductInfo,
		private _tags?: ItemTags
	) {
		super(id, updatedAt);
		this.validateTransferOperation();
	}

	/**
	 * Validates that transfer operations have a toSplits array
	 */
	private validateTransferOperation(): void {
		if (this._operation.type.isTransfer() && this._toSplits.length === 0) {
			throw new InvalidArgumentError(
				"ScheduledItem",
				"toSplits",
				"Transfer operations must have a toSplits array"
			);
		}
	}

	static oneTime(
		date: DateValueObject,
		name: ItemName,
		fromSplits: PaymentSplit[],
		toSplits: PaymentSplit[],
		operation: ItemOperation,
		category: CategoryID,
		subCategory: SubCategoryID,
		tags: ItemTags = ItemTags.empty()
	): ScheduledItem {
		const item = new ScheduledItem(
			ItemID.generate(),
			name,
			fromSplits,
			toSplits,
			operation,
			category,
			subCategory,
			ItemRecurrence.oneTime(date),
			DateValueObject.createNowDate(),
			undefined,
			tags
		);
		return item;
	}

	static infinite(
		startDate: DateValueObject,
		name: ItemName,
		fromSplits: PaymentSplit[],
		toSplits: PaymentSplit[],
		operation: ItemOperation,
		category: CategoryID,
		subCategory: SubCategoryID,
		frequency: ItemRecurrenceFrequency,
		tags: ItemTags = ItemTags.empty()
	): ScheduledItem {
		const item = new ScheduledItem(
			ItemID.generate(),
			name,
			fromSplits,
			toSplits,
			operation,
			category,
			subCategory,
			ItemRecurrence.infinite(startDate, frequency),
			DateValueObject.createNowDate(),
			undefined,
			tags
		);
		return item;
	}

	static untilDate(
		name: ItemName,
		fromSplits: PaymentSplit[],
		toSplits: PaymentSplit[],
		operation: ItemOperation,
		category: CategoryID,
		subCategory: SubCategoryID,
		frequency: ItemRecurrenceFrequency,
		startDate: DateValueObject,
		untilDate: DateValueObject,
		tags: ItemTags = ItemTags.empty()
	): ScheduledItem {
		const item = new ScheduledItem(
			ItemID.generate(),
			name,
			fromSplits,
			toSplits,
			operation,
			category,
			subCategory,
			ItemRecurrence.untilDate(startDate, frequency, untilDate),
			DateValueObject.createNowDate(),
			undefined,
			tags
		);
		return item;
	}

	copy(): ScheduledItem {
		return new ScheduledItem(
			this._id,
			this._name,
			this._fromSplits,
			this._toSplits,
			this._operation,
			this._category,
			this._subCategory,
			this._recurrence,
			this._updatedAt,
			this._info,
			this._tags
		);
	}

	get id(): ItemID {
		return this._id;
	}

	get operation(): ItemOperation {
		return this._operation;
	}

	updateOperation(operation: ItemOperation): void {
		this._operation = operation;
		this.validateTransferOperation();
		this.updateTimestamp();
	}

	get name(): ItemName {
		return this._name;
	}

	updateName(name: ItemName): void {
		this._name = name;
		this.updateTimestamp();
	}

	/**
	 * Returns the real price for this item, using the provided accountTypeLookup for transfer logic.
	 * For transfer, sign and value depend on asset/liability direction.
	 * For income/expense, uses fromSplits sum.
	 */
	get realPrice(): ItemPrice {
		if (this._operation.type.isIncome()) return this.fromAmount;
		else if (this._operation.type.isExpense())
			return this.fromAmount.negate();
		return ItemPrice.zero();
	}

	/**
	 * Returns the real price for this item with proper transfer logic based on account types.
	 * For transfer, sign and value depend on asset/liability direction.
	 * For income/expense, uses fromSplits sum.
	 */
	getRealPriceWithAccountTypes(
		accountTypeLookup: (id: AccountID) => AccountType
	): ItemPrice {
		if (this._operation.type.isIncome()) {
			return this.fromAmount;
		} else if (this._operation.type.isExpense()) {
			return this.fromAmount.negate();
		} else if (this._operation.type.isTransfer()) {
			// For transfers, we need to check account types to determine the sign
			if (this._fromSplits.length === 0 || this._toSplits.length === 0) {
				return ItemPrice.zero();
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
				return ItemPrice.zero();
			}
		}
		return ItemPrice.zero();
	}

	/**
	 * Returns the price per month for this item with proper transfer logic based on account types.
	 * For transfer, sign and value depend on asset/liability direction.
	 * For income/expense, uses fromSplits sum.
	 */
	getPricePerMonthWithAccountTypes(
		accountTypeLookup: (id: AccountID) => AccountType
	): ItemPrice {
		const realPrice = this.getRealPriceWithAccountTypes(accountTypeLookup);
		return realPrice.times(this._recurrence.perMonthRelation);
	}

	get category(): CategoryID {
		return this._category;
	}

	updateCategory(category: CategoryID): void {
		this._category = category;
		this.updateTimestamp();
	}

	get subCategory(): SubCategoryID {
		return this._subCategory;
	}

	updateSubCategory(subCategory: SubCategoryID): void {
		this._subCategory = subCategory;
		this.updateTimestamp();
	}

	get info(): ItemProductInfo | undefined {
		return this._info;
	}

	get tags(): ItemTags | undefined {
		return this._tags;
	}

	/**
	 * Add a tag to the item
	 */
	addTag(tag: ItemTag): void {
		if (!this._tags) this._tags = ItemTags.empty();
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

	/**
	 * Set all tags for the item
	 */
	setTags(tags: ItemTags): void {
		this._tags = tags;
		this.updateTimestamp();
	}

	/**
	 * Clear all tags from the item
	 */
	clearTags(): void {
		if (!this._tags) return;
		this._tags = ItemTags.empty();
		this.updateTimestamp();
	}

	get recurrence(): ItemRecurrence {
		return this._recurrence;
	}

	updateRecurrence(recurrence: ItemRecurrence) {
		recurrence.createRecurrences();
		this._recurrence = recurrence;
		this.updateTimestamp();
	}

	applyModification(modification: ItemRecurrenceInfo): void {
		// TODO: Support split modification if needed
		modification.account &&
			this._operation.updateAccount(modification.account);
		modification.toAccount &&
			this._operation.updateToAccount(modification.toAccount);
		this.updateTimestamp();
	}

	/**
	 * Safely modifies a specific recurrence with validation
	 */
	modifyRecurrence(index: number, modification: ItemRecurrenceInfo): void {
		if (!this._recurrence) {
			throw new InvalidArgumentError(
				"ScheduledItem",
				"recurrence",
				"Item doesn't have recurrence"
			);
		}

		this._recurrence.modifyRecurrence(index, modification);
		this.updateTimestamp();
	}

	/**
	 * Deletes a specific recurrence (marks as deleted)
	 */
	deleteRecurrence(index: number): void {
		if (!this._recurrence) {
			throw new InvalidArgumentError(
				"ScheduledItem",
				"recurrence",
				"Item doesn't have recurrence"
			);
		}

		this._recurrence.deleteRecurrence(index);
		this.updateTimestamp();
	}

	/**
	 * Marks a specific recurrence as completed
	 */
	completeRecurrence(index: number): void {
		if (!this._recurrence) {
			throw new InvalidArgumentError(
				"ScheduledItem",
				"recurrence",
				"Item doesn't have recurrence"
			);
		}

		this._recurrence.completeRecurrence(index);
		this.updateTimestamp();
	}

	/**
	 * Records a future recurrence in advance
	 */
	recordFutureRecurrence(index: number): void {
		if (!this._recurrence) {
			throw new InvalidArgumentError(
				"ScheduledItem",
				"recurrence",
				"Item doesn't have recurrence"
			);
		}

		this._recurrence.recordFutureRecurrence(index);
		this.updateTimestamp();
	}

	/**
	 * Gets all recurrences with their states for display/management
	 */
	getAllRecurrencesWithStates(): {
		recurrence: ItemRecurrenceInfo;
		n: NumberValueObject;
	}[] {
		if (!this._recurrence) {
			return [];
		}
		return this._recurrence.getAllRecurrencesWithStates();
	}

	/**
	 * Gets recurrence statistics
	 */
	getRecurrenceStats(): {
		active: number;
		completed: number;
		pending: number;
		deleted: number;
		total: number;
	} {
		if (!this._recurrence) {
			return {
				active: 0,
				completed: 0,
				pending: 0,
				deleted: 0,
				total: 0,
			};
		}

		return {
			active: this._recurrence.activeRecurrenceCount,
			completed: this._recurrence.completedRecurrenceCount,
			pending: this._recurrence.pendingRecurrenceCount,
			deleted: this._recurrence.deletedRecurrenceCount,
			total: this._recurrence.recurrences.length,
		};
	}

	get fromSplits(): PaymentSplit[] {
		return this._fromSplits;
	}

	get fromAmount(): TransactionAmount {
		return PaymentSplit.totalAmount(this._fromSplits);
	}

	get toSplits(): PaymentSplit[] {
		return this._toSplits;
	}

	get toAmount(): TransactionAmount {
		return PaymentSplit.totalAmount(this._toSplits);
	}

	setFromSplits(splits: PaymentSplit[]): void {
		this._fromSplits = splits;
		this.updateTimestamp();
	}

	setToSplits(splits: PaymentSplit[]): void {
		this._toSplits = splits;
		this.validateTransferOperation();
		this.updateTimestamp();
	}

	/**
	 * Validates that all fromSplits accounts are of the same type, and all toSplits accounts are of the same type.
	 * Throws InvalidArgumentError if not. Accepts a lookup function that returns an AccountType for a given AccountID.
	 */
	static validateTransferAccounts(
		fromSplits: PaymentSplit[],
		toSplits: PaymentSplit[],
		accountTypeLookup: (id: AccountID) => AccountType
	): void {
		if (fromSplits.length === 0 || toSplits.length === 0) {
			throw new InvalidArgumentError(
				"ScheduledItem",
				"fromSplits/toSplits",
				"Transfer must have both from and to splits"
			);
		}
		const fromType = accountTypeLookup(fromSplits[0].accountId);
		const toType = accountTypeLookup(toSplits[0].accountId);
		if (
			!fromSplits.every(
				(s) => accountTypeLookup(s.accountId).value === fromType.value
			)
		) {
			throw new InvalidArgumentError(
				"ScheduledItem",
				"fromSplits",
				"All fromSplits accounts must be of the same type"
			);
		}
		if (
			!toSplits.every(
				(s) => accountTypeLookup(s.accountId).value === toType.value
			)
		) {
			throw new InvalidArgumentError(
				"ScheduledItem",
				"toSplits",
				"All toSplits accounts must be of the same type"
			);
		}
	}

	toPrimitives(): ScheduledItemPrimitives {
		return {
			id: this._id.value,
			name: this._name.value,
			fromSplits: this._fromSplits.map((s) => s.toPrimitives()),
			toSplits: this._toSplits.map((s) => s.toPrimitives()),
			operation: this._operation.toPrimitives(),
			category: this._category.value,
			subCategory: this._subCategory.value,
			brand: this._info?.brand?.value,
			store: this._info?.store?.value,
			recurrence: this._recurrence?.toPrimitives(),
			updatedAt: this._updatedAt.toISOString(),
			tags: this._tags?.toArray().reduce((acc, tag, index) => {
				acc[index.toString()] = tag;
				return acc;
			}, {} as Record<string, string>),
		};
	}

	static emptyPrimitives(): ScheduledItemPrimitives {
		return {
			id: "",
			name: "",
			fromSplits: [],
			toSplits: [],
			operation: {
				type: "expense",
				account: "",
				toAccount: undefined,
			},
			category: "",
			subCategory: "",
			brand: "",
			store: "",
			recurrence: {
				startDate: new Date(),
				recurrences: [],
				frequency: undefined,
				untilDate: undefined,
			},
			updatedAt: new Date().toISOString(),
			tags: {},
		};
	}

	static fromPrimitives({
		id,
		name,
		fromSplits,
		toSplits,
		operation,
		category,
		subCategory,
		brand,
		store,
		recurrence,
		updatedAt,
		price,
		tags,
	}: ScheduledItemPrimitives): ScheduledItem {
		let _fromSplits: PaymentSplit[] = [];
		let _toSplits: PaymentSplit[] = [];
		const op = ItemOperation.fromPrimitives(operation);
		if (fromSplits && fromSplits.length > 0) {
			_fromSplits = fromSplits.map(PaymentSplit.fromPrimitives);
		} else if (op.account) {
			_fromSplits = [
				new PaymentSplit(op.account, new TransactionAmount(price ?? 0)),
			];
		}
		if (toSplits && toSplits.length > 0) {
			_toSplits = toSplits.map(PaymentSplit.fromPrimitives);
		} else if (op.toAccount) {
			_toSplits = [
				new PaymentSplit(
					op.toAccount,
					new TransactionAmount(price ?? 0)
				),
			];
		}

		// Convert tags record back to array
		const tagArray = Object.values(tags || {});

		return new ScheduledItem(
			new ItemID(id),
			new ItemName(name),
			_fromSplits,
			_toSplits,
			op,
			new CategoryID(category),
			new SubCategoryID(subCategory),
			ItemRecurrence.fromPrimitives(recurrence),
			updatedAt
				? new DateValueObject(new Date(updatedAt))
				: DateValueObject.createNowDate(),
			brand || store
				? new ItemProductInfo({
						brand: brand ? new ItemBrand(brand) : undefined,
						store: store ? new ItemStore(store) : undefined,
				  })
				: undefined,
			ItemTags.fromPrimitives(tagArray)
		);
	}
}

export type ScheduledItemPrimitives = {
	id: string;
	name: string;
	fromSplits?: PaymentSplitPrimitives[];
	toSplits?: PaymentSplitPrimitives[];
	operation: ItemOperationPrimitives;
	category: string;
	subCategory: string;
	brand?: string;
	store?: string;
	recurrence: RecurrencePrimitives;
	updatedAt: string;
	price?: number;
	tags?: Record<string, string>;
};
