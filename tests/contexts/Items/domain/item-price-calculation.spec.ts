import { AccountID, AccountType } from "contexts/Accounts/domain";
import { ItemPrice } from "contexts/Items/domain";
import { ItemOperation } from "contexts/Shared/domain";
import { describe, expect, it } from "vitest";
import { buildTestItems } from "./buildTestItems";

describe("Item Price Calculations", () => {
	describe("realPrice", () => {
		it("should return positive price for income operations", () => {
			const items = buildTestItems([
				{
					price: new ItemPrice(100),
					operation: ItemOperation.income(),
					account: AccountID.generate(),
					toAccount: AccountID.generate(),
				},
			]);
			const item = items[0];

			expect(item.realPrice.value).toBe(100);
		});

		it("should return negative price for expense operations", () => {
			const items = buildTestItems([
				{
					price: new ItemPrice(100),
					operation: ItemOperation.expense(),
					account: AccountID.generate(),
					toAccount: AccountID.generate(),
				},
			]);
			const item = items[0];

			expect(item.realPrice.value).toBe(-100);
		});

		it("should return zero for transfer operations", () => {
			const items = buildTestItems([
				{
					price: new ItemPrice(100),
					operation: ItemOperation.transfer(),
					account: AccountID.generate(),
					toAccount: AccountID.generate(),
				},
			]);
			const item = items[0];

			expect(item.realPrice.value).toBe(0);
		});
	});

	describe("getPricePerMonthWithAccountTypes", () => {
		// Mock account type lookup function
		const mockAccountTypeLookup = (id: AccountID) => {
			// For testing, we'll use a simple mapping based on the account ID value
			// This is just for testing purposes
			return new AccountType("asset");
		};

		describe("one-time items", () => {
			it("should return realPrice for one-time income items", () => {
				const items = buildTestItems([
					{
						price: new ItemPrice(100),
						operation: ItemOperation.income(),
						account: AccountID.generate(),
						toAccount: AccountID.generate(),
					},
				]);
				const item = items[0];

				expect(
					item.getPricePerMonthWithAccountTypes(mockAccountTypeLookup)
						.value
				).toBe(100);
			});

			it("should return realPrice for one-time expense items", () => {
				const items = buildTestItems([
					{
						price: new ItemPrice(100),
						operation: ItemOperation.expense(),
						account: AccountID.generate(),
						toAccount: AccountID.generate(),
					},
				]);
				const item = items[0];

				expect(
					item.getPricePerMonthWithAccountTypes(mockAccountTypeLookup)
						.value
				).toBe(-100);
			});

			it("should return zero for one-time transfer items with same account types", () => {
				const items = buildTestItems([
					{
						price: new ItemPrice(100),
						operation: ItemOperation.transfer(),
						account: AccountID.generate(),
						toAccount: AccountID.generate(),
					},
				]);
				const item = items[0];

				// With same account types (both asset), transfer should be neutral
				expect(
					item.getPricePerMonthWithAccountTypes(mockAccountTypeLookup)
						.value
				).toBe(0);
			});
		});

		describe("recurring items", () => {
			it("should calculate monthly price for recurring income items", () => {
				const items = buildTestItems([
					{
						price: new ItemPrice(100),
						operation: ItemOperation.income(),
						recurrence: { frequency: "1w" },
						account: AccountID.generate(),
						toAccount: AccountID.generate(),
					},
				]);
				const item = items[0];

				// 1 week frequency means 4.35 times per month (30.4167 days / 7 days)
				expect(
					item.getPricePerMonthWithAccountTypes(mockAccountTypeLookup)
						.value
				).toBeCloseTo(435, 0);
			});

			it("should calculate monthly price for recurring expense items", () => {
				const items = buildTestItems([
					{
						price: new ItemPrice(100),
						operation: ItemOperation.expense(),
						recurrence: { frequency: "1w" },
						account: AccountID.generate(),
						toAccount: AccountID.generate(),
					},
				]);
				const item = items[0];

				// 1 week frequency means 4.35 times per month (30.4167 days / 7 days)
				expect(
					item.getPricePerMonthWithAccountTypes(mockAccountTypeLookup)
						.value
				).toBeCloseTo(-435, 0);
			});

			it("should calculate monthly price for recurring transfer items with same account types", () => {
				const items = buildTestItems([
					{
						price: new ItemPrice(100),
						operation: ItemOperation.transfer(),
						recurrence: { frequency: "1w" },
						account: AccountID.generate(),
						toAccount: AccountID.generate(),
					},
				]);
				const item = items[0];

				// With same account types (both asset), transfer should be neutral
				// 1 week frequency means 4.35 times per month, but result should be 0
				expect(
					item.getPricePerMonthWithAccountTypes(mockAccountTypeLookup)
						.value
				).toBe(0);
			});

			it("should calculate monthly price for monthly recurring transfer items with same account types", () => {
				const items = buildTestItems([
					{
						price: new ItemPrice(100),
						operation: ItemOperation.transfer(),
						recurrence: { frequency: "1mo" },
						account: AccountID.generate(),
						toAccount: AccountID.generate(),
					},
				]);
				const item = items[0];

				// With same account types (both asset), transfer should be neutral
				// Monthly frequency means 1 time per month, but result should be 0
				expect(
					item.getPricePerMonthWithAccountTypes(mockAccountTypeLookup)
						.value
				).toBe(0);
			});

			it("should calculate monthly price for daily recurring transfer items with same account types", () => {
				const items = buildTestItems([
					{
						price: new ItemPrice(10),
						operation: ItemOperation.transfer(),
						recurrence: { frequency: "1d" },
						account: AccountID.generate(),
						toAccount: AccountID.generate(),
					},
				]);
				const item = items[0];

				// With same account types (both asset), transfer should be neutral
				// Daily frequency means 30.42 times per month, but result should be 0
				expect(
					item.getPricePerMonthWithAccountTypes(mockAccountTypeLookup)
						.value
				).toBe(0);
			});
		});

		describe("transfer with different account types", () => {
			it("should handle asset to liability transfers correctly", () => {
				const fromAccount = AccountID.generate();
				const toAccount = AccountID.generate();
				const items = buildTestItems([
					{
						price: new ItemPrice(100),
						operation: ItemOperation.transfer(),
						recurrence: { frequency: "1mo" },
						account: fromAccount,
						toAccount: toAccount,
					},
				]);
				const item = items[0];

				// Mock account type lookup that returns different types
				const assetToLiabilityLookup = (id: AccountID) => {
					if (id.equalTo(fromAccount)) {
						return new AccountType("asset");
					} else {
						return new AccountType("liability");
					}
				};

				// Asset to Liability should be negative (expense)
				expect(
					item.getPricePerMonthWithAccountTypes(
						assetToLiabilityLookup
					).value
				).toBe(-100);
			});

			it("should handle liability to asset transfers correctly", () => {
				const fromAccount = AccountID.generate();
				const toAccount = AccountID.generate();
				const items = buildTestItems([
					{
						price: new ItemPrice(100),
						operation: ItemOperation.transfer(),
						recurrence: { frequency: "1mo" },
						account: fromAccount,
						toAccount: toAccount,
					},
				]);
				const item = items[0];

				// Mock account type lookup that returns different types
				const liabilityToAssetLookup = (id: AccountID) => {
					if (id.equalTo(fromAccount)) {
						return new AccountType("liability");
					} else {
						return new AccountType("asset");
					}
				};

				// Liability to Asset should be positive (income)
				expect(
					item.getPricePerMonthWithAccountTypes(
						liabilityToAssetLookup
					).value
				).toBe(100);
			});
		});
	});
});
