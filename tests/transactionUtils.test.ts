import {
	createTransactionsForItems,
	getProportionalSplits,
	SharedPropertiesInput,
	TransactionItemInput,
} from "apps/obsidian-plugin/panels/CreateBudgetItemPanel/transactionUtils";
import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import { CategoryID } from "contexts/Categories/domain";
import { ItemType } from "contexts/Items/domain";
import { ItemID } from "contexts/Items/domain/item-id.valueobject";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { PaymentSplitPrimitives } from "contexts/Transactions/domain/payment-split.valueobject";
import { TransactionID } from "contexts/Transactions/domain/transaction-id.valueobject";
import { describe, expect, it } from "vitest";

describe("getProportionalSplits", () => {
	const accountA = AccountID.generate().value;
	const accountB = AccountID.generate().value;

	it("distributes splits proportionally", () => {
		const splits: PaymentSplitPrimitives[] = [
			{ accountId: accountA, amount: 60 },
			{ accountId: accountB, amount: 40 },
		];
		const result = getProportionalSplits(splits, 30, 100);
		expect(result).toEqual([
			{ accountId: accountA, amount: 18 },
			{ accountId: accountB, amount: 12 },
		]);
	});

	it("returns empty array if totalAmount is 0", () => {
		const splits: PaymentSplitPrimitives[] = [
			{ accountId: accountA, amount: 60 },
		];
		expect(getProportionalSplits(splits, 10, 0)).toEqual([]);
	});
});

describe("createTransactionsForItems", () => {
	const accountA = AccountID.generate().value;
	const accountB = AccountID.generate().value;
	const getCategoryIdByName = (name: string) =>
		name ? { value: CategoryID.generate().value } : undefined;
	const getSubCategoryIdByName = (name: string) =>
		name ? { value: SubCategoryID.generate().value } : undefined;

	const shared: SharedPropertiesInput = {
		date: new Date("2024-01-01"),
		operation: "expense",
		fromSplits: [
			{ accountId: accountA, amount: 60 },
			{ accountId: accountB, amount: 40 },
		],
		toSplits: [],
		store: "Store1",
	};

	it("creates a transaction for each item with correct splits", () => {
		const itemId1 = ItemID.generate().value;
		const itemId2 = ItemID.generate().value;
		const items: TransactionItemInput[] = [
			{
				id: TransactionID.generate().value,
				name: "Item1",
				amount: 30,
				quantity: 1,
				category: "Cat",
				subCategory: "Sub",
				itemType: ItemType.PRODUCT,
				brand: "Brand1",
				provider: "",
				itemId: itemId1,
			},
			{
				id: TransactionID.generate().value,
				name: "Item2",
				amount: 70,
				quantity: 1,
				category: "Cat",
				subCategory: "Sub",
				itemType: ItemType.PRODUCT,
				brand: "Brand2",
				provider: "",
				itemId: itemId2,
			},
		];
		const txs = createTransactionsForItems({
			transactionItems: items,
			sharedProperties: shared,
			getCategoryIdByName,
			getSubCategoryIdByName,
		});
		expect(txs.length).toBe(2);
		// Check splits for first transaction
		expect(txs[0].fromSplits[0].amount.value).toBe(18);
		expect(txs[0].fromSplits[1].amount.value).toBe(12);
		// Check splits for second transaction
		expect(txs[1].fromSplits[0].amount.value).toBe(42);
		expect(txs[1].fromSplits[1].amount.value).toBe(28);
		// Check names
		expect(txs[0].name.value).toBe("Item1");
		expect(txs[1].name.value).toBe("Item2");
		// Check account ids match
		expect(txs[0].fromSplits[0].accountId.value).toBe(accountA);
		expect(txs[0].fromSplits[1].accountId.value).toBe(accountB);
		expect(txs[1].fromSplits[0].accountId.value).toBe(accountA);
		expect(txs[1].fromSplits[1].accountId.value).toBe(accountB);
		// Check item ids match
		expect(txs[0].itemID?.value).toBe(itemId1);
		expect(txs[1].itemID?.value).toBe(itemId2);
	});

	it("throws if category or subcategory is missing", () => {
		const items: TransactionItemInput[] = [
			{
				id: TransactionID.generate().value,
				name: "Item1",
				amount: 10,
				quantity: 1,
				category: "",
				subCategory: "",
				itemType: ItemType.PRODUCT,
				brand: "",
				provider: "",
			},
		];
		expect(() =>
			createTransactionsForItems({
				transactionItems: items,
				sharedProperties: shared,
				getCategoryIdByName,
				getSubCategoryIdByName,
			})
		).toThrow("Category and subcategory are required");
	});
});
