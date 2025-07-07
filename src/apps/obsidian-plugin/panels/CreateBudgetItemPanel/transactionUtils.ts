import { DateValueObject } from "@juandardilag/value-objects";
import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import { CategoryID } from "contexts/Categories/domain";
import {
	ItemBrand,
	ItemProductInfo,
	ItemStore,
	ItemType,
} from "contexts/Items/domain";
import { ItemID } from "contexts/Items/domain/item-id.valueobject";
import { OperationType } from "contexts/Shared/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import {
	Transaction,
	TransactionDate,
	TransactionID,
	TransactionName,
	TransactionOperation,
} from "contexts/Transactions/domain";
import {
	PaymentSplit,
	PaymentSplitPrimitives,
} from "contexts/Transactions/domain/payment-split.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";

export interface TransactionItemInput {
	id: string;
	name: string;
	amount: number;
	quantity: number;
	category: string;
	subCategory: string;
	itemType: ItemType;
	brand: string;
	provider: string;
	itemId?: string;
}

export interface SharedPropertiesInput {
	date: Date;
	operation: string;
	fromSplits: PaymentSplitPrimitives[];
	toSplits: PaymentSplitPrimitives[];
	store: string;
}

export function getProportionalSplits(
	splits: PaymentSplitPrimitives[],
	itemAmount: number,
	totalAmount: number
) {
	if (totalAmount === 0) return [];
	return splits.map((split) => ({
		accountId: split.accountId,
		amount: Number(((split.amount * itemAmount) / totalAmount).toFixed(2)),
	}));
}

export function createTransactionsForItems({
	transactionItems,
	sharedProperties,
	getCategoryIdByName,
	getSubCategoryIdByName,
}: {
	transactionItems: TransactionItemInput[];
	sharedProperties: SharedPropertiesInput;
	getCategoryIdByName: (name: string) => { value: string } | undefined;
	getSubCategoryIdByName: (name: string) => { value: string } | undefined;
}) {
	const totalAmount = transactionItems.reduce(
		(sum, item) => sum + item.amount * item.quantity,
		0
	);
	return transactionItems.map((item) => {
		const categoryId = getCategoryIdByName(item.category);
		const subCategoryId = getSubCategoryIdByName(item.subCategory);
		if (!categoryId || !subCategoryId) {
			throw new Error("Category and subcategory are required");
		}
		const itemTotal = item.amount * item.quantity;
		const fromSplits = getProportionalSplits(
			sharedProperties.fromSplits,
			itemTotal,
			totalAmount
		).map(
			(split) =>
				new PaymentSplit(
					new AccountID(split.accountId),
					new TransactionAmount(split.amount)
				)
		);
		const toSplits =
			sharedProperties.operation === "transfer"
				? getProportionalSplits(
						sharedProperties.toSplits,
						itemTotal,
						totalAmount
				  ).map(
						(split) =>
							new PaymentSplit(
								new AccountID(split.accountId),
								new TransactionAmount(split.amount)
							)
				  )
				: [];
		return new Transaction(
			TransactionID.generate(),
			fromSplits,
			toSplits,
			new TransactionName(item.name),
			new TransactionOperation(
				sharedProperties.operation as OperationType
			),
			new CategoryID(categoryId.value),
			new SubCategoryID(subCategoryId.value),
			new TransactionDate(sharedProperties.date),
			DateValueObject.createNowDate(),
			item.itemId ? new ItemID(item.itemId) : undefined,
			sharedProperties.store || item.brand
				? new ItemProductInfo({
						brand: item.brand
							? new ItemBrand(item.brand)
							: undefined,
						store: sharedProperties.store
							? new ItemStore(sharedProperties.store)
							: undefined,
				  })
				: undefined
		);
	});
}
