import { describe, expect, it } from "vitest";
import { ItemID } from "../../../../../src/contexts/Items/domain/item-id.valueobject";
import { ItemOperation } from "../../../../../src/contexts/Items/domain/item-operation.valueobject";
import { ItemName } from "../../../../../src/contexts/Items/domain/item-name.valueobject";
import { ItemPrice } from "../../../../../src/contexts/Items/domain/item-price.valueobject";
import { RecurrentItem } from "../../../../../src/contexts/Items/domain/RecurrentItem/recurrent-item.entity";
import { RecurrentItemNextDate } from "../../../../../src/contexts/Items/domain/RecurrentItem/recurrent-item-nextdate.valueobject";
import { RecurrrentItemFrequency } from "../../../../../src/contexts/Items/domain/RecurrentItem/recurrent-item-frequency.valueobject";
import { AccountID } from "../../../../../src/contexts/Accounts/domain/account-id.valueobject";
import { CategoryID } from "../../../../../src/contexts/Categories/domain/category-id.valueobject";
import { SubCategoryID } from "../../../../../src/contexts/Subcategories/domain/subcategory-id.valueobject";

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
			CategoryID.generate(),
			SubCategoryID.generate(),
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
			CategoryID.generate(),
			SubCategoryID.generate(),
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
			CategoryID.generate(),
			SubCategoryID.generate(),
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
			CategoryID.generate(),
			SubCategoryID.generate(),
			AccountID.generate(),
			itemDate,
			new RecurrrentItemFrequency("1w")
		);

		const { color, str } = item.remainingDays;

		expect(color).toBe("yellow");
		expect(str).toBe("-1 day");
	});
});

describe("createRecurretItemsBetweenDates", () => {
	it("should return recurrent items multiple times when recurrence repeats between dates", () => {
		const recurrentItem = new RecurrentItem(
			ItemID.generate(),
			ItemOperation.expense(),
			new ItemName("name"),
			new ItemPrice(300),
			CategoryID.generate(),
			SubCategoryID.generate(),
			AccountID.generate(),
			RecurrentItemNextDate.now(),
			new RecurrrentItemFrequency("2d")
		);

		const items = recurrentItem.createRecurretItemsUntilDate(
			RecurrentItemNextDate.now().addDays(7)
		);

		expect(items.length).toBe(4);
		expect(items[0].nextDate.valueOf().getTime()).toBe(
			recurrentItem.nextDate.valueOf().getTime()
		);
		expect(items[1].nextDate.valueOf().getTime()).toBe(
			recurrentItem.nextDate.valueOf().getTime() + 2 * 24 * 60 * 60 * 1000
		);
		expect(items[2].nextDate.valueOf().getTime()).toBe(
			recurrentItem.nextDate.valueOf().getTime() + 4 * 24 * 60 * 60 * 1000
		);
		expect(items[3].nextDate.valueOf().getTime()).toBe(
			recurrentItem.nextDate.valueOf().getTime() + 6 * 24 * 60 * 60 * 1000
		);
	});
});
