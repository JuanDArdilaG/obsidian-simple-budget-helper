import {
	getProportionalSplits,
	SharedPropertiesInput,
} from "apps/obsidian-plugin/panels/CreateBudgetItemPanel/transactionUtils";
import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import { CategoryID } from "contexts/Categories/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { PaymentSplitPrimitives } from "contexts/Transactions/domain/payment-split.valueobject";
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
});
