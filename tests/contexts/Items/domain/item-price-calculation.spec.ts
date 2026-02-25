import { PriceValueObject } from "@juandardilag/value-objects";
import { ItemOperation } from "contexts/Shared/domain";
import { describe, expect, it } from "vitest";
import { buildTestAccounts } from "../../Accounts/domain/buildTestAccounts";
import { buildTestItems } from "./buildTestItems";

describe("Item Price Calculations", () => {
	describe("realPrice", () => {
		it("should return positive price for income operations", () => {
			const accounts = buildTestAccounts(2);
			const items = buildTestItems([
				{
					price: new PriceValueObject(100),
					operation: ItemOperation.income(),
					account: accounts[0],
					toAccount: accounts[1],
				},
			]);
			const item = items[0];

			expect(item.realPrice.value).toBe(100);
		});

		it("should return negative price for expense operations", () => {
			const accounts = buildTestAccounts(2);
			const items = buildTestItems([
				{
					price: new PriceValueObject(100),
					operation: ItemOperation.expense(),
					account: accounts[0],
					toAccount: accounts[1],
				},
			]);
			const item = items[0];

			expect(item.realPrice.value).toBe(-100);
		});

		it("should return zero for transfer operations", () => {
			const accounts = buildTestAccounts(2);
			const items = buildTestItems([
				{
					price: new PriceValueObject(100),
					operation: ItemOperation.transfer(),
					account: accounts[0],
					toAccount: accounts[1],
				},
			]);
			const item = items[0];

			expect(item.realPrice.value).toBe(0);
		});
	});

	describe("getPricePerMonthWithAccountTypes", () => {
		describe("one-time items", () => {
			it("should return realPrice for one-time income items", () => {
				const accounts = buildTestAccounts(2);
				const items = buildTestItems([
					{
						price: new PriceValueObject(100),
						operation: ItemOperation.income(),
						account: accounts[0],
						toAccount: accounts[1],
					},
				]);
				const item = items[0];

				expect(
					item.getPricePerMonthWithAccountTypes("asset", "asset")
						.value,
				).toBe(100);
			});

			it("should return realPrice for one-time expense items", () => {
				const accounts = buildTestAccounts(2);
				const items = buildTestItems([
					{
						price: new PriceValueObject(100),
						operation: ItemOperation.expense(),
						account: accounts[0],
						toAccount: accounts[1],
					},
				]);
				const item = items[0];

				expect(
					item.getPricePerMonthWithAccountTypes("asset", "asset")
						.value,
				).toBe(-100);
			});

			it("should return zero for one-time transfer items with same account types", () => {
				const accounts = buildTestAccounts(2);
				const items = buildTestItems([
					{
						price: new PriceValueObject(100),
						operation: ItemOperation.transfer(),
						account: accounts[0],
						toAccount: accounts[1],
					},
				]);
				const item = items[0];

				// With same account types (both asset), transfer should be neutral
				expect(
					item.getPricePerMonthWithAccountTypes("asset", "asset")
						.value,
				).toBe(0);
			});
		});

		describe("recurring items", () => {
			it("should calculate monthly price for recurring income items", () => {
				const accounts = buildTestAccounts(2);
				const items = buildTestItems([
					{
						price: new PriceValueObject(100),
						operation: ItemOperation.income(),
						recurrence: { frequency: "1w" },
						account: accounts[0],
						toAccount: accounts[1],
					},
				]);
				const item = items[0];

				// 1 week frequency means 4.35 times per month (30.4167 days / 7 days)
				expect(
					item.getPricePerMonthWithAccountTypes("asset", "asset")
						.value,
				).toBeCloseTo(435, 0);
			});

			it("should calculate monthly price for recurring expense items", () => {
				const accounts = buildTestAccounts(2);
				const items = buildTestItems([
					{
						price: new PriceValueObject(100),
						operation: ItemOperation.expense(),
						recurrence: { frequency: "1w" },
						account: accounts[0],
						toAccount: accounts[1],
					},
				]);
				const item = items[0];

				// 1 week frequency means 4.35 times per month (30.4167 days / 7 days)
				expect(
					item.getPricePerMonthWithAccountTypes("asset", "asset")
						.value,
				).toBeCloseTo(-435, 0);
			});

			it("should calculate monthly price for recurring transfer items with same account types", () => {
				const accounts = buildTestAccounts(2);
				const items = buildTestItems([
					{
						price: new PriceValueObject(100),
						operation: ItemOperation.transfer(),
						recurrence: { frequency: "1w" },
						account: accounts[0],
						toAccount: accounts[1],
					},
				]);
				const item = items[0];

				// With same account types (both asset), transfer should be neutral
				// 1 week frequency means 4.35 times per month, but result should be 0
				expect(
					item.getPricePerMonthWithAccountTypes("asset", "asset")
						.value,
				).toBe(0);
			});

			it("should calculate monthly price for monthly recurring transfer items with same account types", () => {
				const accounts = buildTestAccounts(2);
				const items = buildTestItems([
					{
						price: new PriceValueObject(100),
						operation: ItemOperation.transfer(),
						recurrence: { frequency: "1mo" },
						account: accounts[0],
						toAccount: accounts[1],
					},
				]);
				const item = items[0];

				// With same account types (both asset), transfer should be neutral
				// Monthly frequency means 1 time per month, but result should be 0
				expect(
					item.getPricePerMonthWithAccountTypes("asset", "asset")
						.value,
				).toBe(0);
			});

			it("should calculate monthly price for daily recurring transfer items with same account types", () => {
				const accounts = buildTestAccounts(2);
				const items = buildTestItems([
					{
						price: new PriceValueObject(10),
						operation: ItemOperation.transfer(),
						recurrence: { frequency: "1d" },
						account: accounts[0],
						toAccount: accounts[1],
					},
				]);
				const item = items[0];

				// With same account types (both asset), transfer should be neutral
				// Daily frequency means 30.42 times per month, but result should be 0
				expect(
					item.getPricePerMonthWithAccountTypes("asset", "asset")
						.value,
				).toBe(0);
			});
		});

		describe("transfer with different account types", () => {
			it("should handle asset to liability transfers correctly", () => {
				const accounts = buildTestAccounts(2);
				const fromAccount = accounts[0];
				const toAccount = accounts[1];
				const items = buildTestItems([
					{
						price: new PriceValueObject(100),
						operation: ItemOperation.transfer(),
						recurrence: { frequency: "1mo" },
						account: fromAccount,
						toAccount: toAccount,
					},
				]);
				const item = items[0];

				// Asset to Liability should be negative (expense)
				expect(
					item.getPricePerMonthWithAccountTypes("asset", "liability")
						.value,
				).toBe(-100);
			});

			it("should handle liability to asset transfers correctly", () => {
				const accounts = buildTestAccounts(2);
				const fromAccount = accounts[0];
				const toAccount = accounts[1];
				const items = buildTestItems([
					{
						price: new PriceValueObject(100),
						operation: ItemOperation.transfer(),
						recurrence: { frequency: "1mo" },
						account: fromAccount,
						toAccount: toAccount,
					},
				]);
				const item = items[0];
				// Liability to Asset should be positive (income)
				expect(
					item.getPricePerMonthWithAccountTypes("liability", "asset")
						.value,
				).toBe(100);
			});
		});
	});
});
