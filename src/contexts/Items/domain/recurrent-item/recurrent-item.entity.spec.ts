import { describe, expect, it } from "vitest";
import { ItemID } from "../item-id.valueobject";
import { ItemOperation } from "../item-operation.valueobject";
import { ItemName } from "../item-name.valueobject";
import { ItemPrice } from "../item-price.valueobject";
import { ItemCategory } from "../item-category.valueobject";
import { ItemSubcategory } from "../item-subcategory.valueobject";
import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import { RecurrentItem } from "./recurrent-item.entity";
import { RecurrentItemNextDate } from "./recurrent-item-nextdate.valueobject";
import { RecurrrentItemFrequency } from "./recurrent-item-frequency.valueobject";

describe("remainingDays", () => {
	it("should calculate remaining future 7 days correctly", () => {
		const now = new Date();
		const itemDate = new RecurrentItemNextDate(
			new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
		);
		const item = new RecurrentItem(
			ItemID.generate(),
			ItemOperation.income(),
			new ItemName("test"),
			new ItemPrice(100),
			new ItemCategory("test"),
			new ItemSubcategory("test"),
			AccountID.generate(),
			itemDate,
			new RecurrrentItemFrequency("1w")
		);

		const { color, str } = item.remainingDays;

		expect(color).toBe("green");
		expect(str).toBe("7 days");
	});

	it("should calculate remaining previous 7 days correctly", () => {
		const now = new Date();
		const itemDate = new RecurrentItemNextDate(
			new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
		);
		const item = new RecurrentItem(
			ItemID.generate(),
			ItemOperation.income(),
			new ItemName("test"),
			new ItemPrice(100),
			new ItemCategory("test"),
			new ItemSubcategory("test"),
			AccountID.generate(),
			itemDate,
			new RecurrrentItemFrequency("1w")
		);

		const { color, str } = item.remainingDays;

		expect(color).toBe("red");
		expect(str).toBe("-7 days");
	});

	it("should calculate remaining 1 day correctly", () => {
		const now = new Date();
		const itemDate = new RecurrentItemNextDate(
			new Date(now.getTime() + 24 * 60 * 60 * 1000)
		);
		const item = new RecurrentItem(
			ItemID.generate(),
			ItemOperation.income(),
			new ItemName("test"),
			new ItemPrice(100),
			new ItemCategory("test"),
			new ItemSubcategory("test"),
			AccountID.generate(),
			itemDate,
			new RecurrrentItemFrequency("1w")
		);

		const { color, str } = item.remainingDays;

		expect(color).toBe("yellow");
		expect(str).toBe("1 day");
	});

	it("should calculate remaining 1 day correctly", () => {
		const now = new Date();
		const itemDate = new RecurrentItemNextDate(
			new Date(now.getTime() - 24 * 60 * 60 * 1000)
		);
		const item = new RecurrentItem(
			ItemID.generate(),
			ItemOperation.income(),
			new ItemName("test"),
			new ItemPrice(100),
			new ItemCategory("test"),
			new ItemSubcategory("test"),
			AccountID.generate(),
			itemDate,
			new RecurrrentItemFrequency("1w")
		);

		const { color, str } = item.remainingDays;

		expect(color).toBe("yellow");
		expect(str).toBe("-1 day");
	});
});
