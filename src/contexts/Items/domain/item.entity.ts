import { DateValueObject } from "@juandardilag/value-objects";
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

export class Item extends Entity<ItemID, ItemPrimitives> {
	readonly _ = new Logger("Item");
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
		private readonly _info?: ItemProductInfo
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
				"Item",
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
		subCategory: SubCategoryID
	): Item {
		const item = new Item(
			ItemID.generate(),
			name,
			fromSplits,
			toSplits,
			operation,
			category,
			subCategory,
			ItemRecurrence.oneTime(date),
			DateValueObject.createNowDate()
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
		frequency: ItemRecurrenceFrequency
	): Item {
		const item = new Item(
			ItemID.generate(),
			name,
			fromSplits,
			toSplits,
			operation,
			category,
			subCategory,
			ItemRecurrence.infinite(startDate, frequency),
			DateValueObject.createNowDate()
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
		untilDate: DateValueObject
	): Item {
		const item = new Item(
			ItemID.generate(),
			name,
			fromSplits,
			toSplits,
			operation,
			category,
			subCategory,
			ItemRecurrence.untilDate(startDate, frequency, untilDate),
			DateValueObject.createNowDate()
		);
		return item;
	}

	copy(): Item {
		return new Item(
			this._id,
			this._name,
			this._fromSplits,
			this._toSplits,
			this._operation,
			this._category,
			this._subCategory,
			this._recurrence,
			this._updatedAt,
			this._info
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
				"Item",
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
				"Item",
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
				"Item",
				"toSplits",
				"All toSplits accounts must be of the same type"
			);
		}
	}

	toPrimitives(): ItemPrimitives {
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
		};
	}

	static emptyPrimitives(): ItemPrimitives {
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
	}: ItemPrimitives): Item {
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
		return new Item(
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
				: undefined
		);
	}
}

export type ItemPrimitives = {
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
};
