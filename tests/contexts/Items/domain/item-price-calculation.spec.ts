import { AccountID } from "contexts/Accounts/domain";
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
					operation: ItemOperation.income(AccountID.generate()),
				},
			]);
			const item = items[0];

			expect(item.realPrice.value).toBe(100);
		});

		it("should return negative price for expense operations", () => {
			const items = buildTestItems([
				{
					price: new ItemPrice(100),
					operation: ItemOperation.expense(AccountID.generate()),
				},
			]);
			const item = items[0];

			expect(item.realPrice.value).toBe(-100);
		});

		it("should return zero for transfer operations", () => {
			const items = buildTestItems([
				{
					price: new ItemPrice(100),
					operation: ItemOperation.transfer(
						AccountID.generate(),
						AccountID.generate()
					),
				},
			]);
			const item = items[0];

			expect(item.realPrice.value).toBe(0);
		});
	});

	describe("pricePerMonth", () => {
		describe("one-time items", () => {
			it("should return realPrice for one-time income items", () => {
				const items = buildTestItems([
					{
						price: new ItemPrice(100),
						operation: ItemOperation.income(AccountID.generate()),
					},
				]);
				const item = items[0];

				expect(item.pricePerMonth.value).toBe(100);
			});

			it("should return realPrice for one-time expense items", () => {
				const items = buildTestItems([
					{
						price: new ItemPrice(100),
						operation: ItemOperation.expense(AccountID.generate()),
					},
				]);
				const item = items[0];

				expect(item.pricePerMonth.value).toBe(-100);
			});

			it("should return the actual price for one-time transfer items", () => {
				const items = buildTestItems([
					{
						price: new ItemPrice(100),
						operation: ItemOperation.transfer(
							AccountID.generate(),
							AccountID.generate()
						),
					},
				]);
				const item = items[0];

				expect(item.pricePerMonth.value).toBe(100);
			});
		});

		describe("recurring items", () => {
			it("should calculate monthly price for recurring income items", () => {
				const items = buildTestItems([
					{
						price: new ItemPrice(100),
						operation: ItemOperation.income(AccountID.generate()),
						recurrence: { frequency: "1w" },
					},
				]);
				const item = items[0];

				// 1 week frequency means 4.35 times per month (30.4167 days / 7 days)
				expect(item.pricePerMonth.value).toBeCloseTo(435, 0);
			});

			it("should calculate monthly price for recurring expense items", () => {
				const items = buildTestItems([
					{
						price: new ItemPrice(100),
						operation: ItemOperation.expense(AccountID.generate()),
						recurrence: { frequency: "1w" },
					},
				]);
				const item = items[0];

				// 1 week frequency means 4.35 times per month (30.4167 days / 7 days)
				expect(item.pricePerMonth.value).toBeCloseTo(-435, 0);
			});

			it("should calculate monthly price for recurring transfer items", () => {
				const items = buildTestItems([
					{
						price: new ItemPrice(100),
						operation: ItemOperation.transfer(
							AccountID.generate(),
							AccountID.generate()
						),
						recurrence: { frequency: "1w" },
					},
				]);
				const item = items[0];

				// Transfer should return the actual price, not zero
				// 1 week frequency means 4.35 times per month (30.4167 days / 7 days)
				expect(item.pricePerMonth.value).toBeCloseTo(435, 0);
			});

			it("should calculate monthly price for monthly recurring transfer items", () => {
				const items = buildTestItems([
					{
						price: new ItemPrice(100),
						operation: ItemOperation.transfer(
							AccountID.generate(),
							AccountID.generate()
						),
						recurrence: { frequency: "1mo" },
					},
				]);
				const item = items[0];

				// Monthly frequency means 1 time per month
				expect(item.pricePerMonth.value).toBe(100);
			});

			it("should calculate monthly price for daily recurring transfer items", () => {
				const items = buildTestItems([
					{
						price: new ItemPrice(10),
						operation: ItemOperation.transfer(
							AccountID.generate(),
							AccountID.generate()
						),
						recurrence: { frequency: "1d" },
					},
				]);
				const item = items[0];

				// Daily frequency means 30.42 times per month (30.4167 days / 1 day)
				expect(item.pricePerMonth.value).toBeCloseTo(304.2, 1);
			});
		});
	});
});
