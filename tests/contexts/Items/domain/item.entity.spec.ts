import { describe, expect, it } from "vitest";
import { buildTestItems } from "./buildTestItems";
import { ItemDate } from "contexts/Items/domain";
import { DateValueObject } from "@juandardilag/value-objects";

describe("remainingDays", () => {
	it("should calculate remaining future 7 days correctly", () => {
		const now = new Date();
		const items = buildTestItems([
			{
				date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
				recurrence: { frequency: "1w" },
			},
		]);
		const item = items[0].copy();
		const str = item.date.remainingDaysStr;

		expect(str).toBe("7 days");
	});

	it("should calculate remaining previous 7 days correctly", () => {
		const now = new Date();
		now.setHours(0, 0, 0, 0);
		const items = buildTestItems([
			{
				date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
				recurrence: { frequency: "1w" },
			},
		]);
		const item = items[0].copy();

		const str = item.date.remainingDaysStr;

		expect(str).toBe("-7 days");
	});

	it("should calculate remaining 1 day correctly", () => {
		const now = new Date();
		now.setHours(0, 0, 0, 0);
		const items = buildTestItems([
			{
				date: new Date(now.getTime() + 24 * 60 * 60 * 1000),
				recurrence: { frequency: "1w" },
			},
		]);
		const item = items[0].copy();

		const str = item.date.remainingDaysStr;

		expect(str).toBe("1 day");
	});

	it("should calculate remaining 1 day correctly", () => {
		const now = new Date();
		now.setHours(0, 0, 0, 0);
		const items = buildTestItems([
			{
				date: new Date(now.getTime() - 24 * 60 * 60 * 1000),
				recurrence: { frequency: "1w" },
			},
		]);
		const item = items[0].copy();

		const str = item.date.remainingDaysStr;

		expect(str).toBe("-1 day");
	});
});

describe("createRecurretItemsBetweenDates", () => {
	it("should return scheduled items multiple times when recurrence repeats between dates", () => {
		const items = buildTestItems([
			{
				recurrence: { frequency: "2d" },
			},
		]);
		const item = items[0].copy();
		const recurrentItems = item
			.createItemsUntilDate(ItemDate.createNowDate().addDays(7))
			.map((r) => r.item);
		expect(recurrentItems.length).toBe(4);
		expect(recurrentItems[0].date).toEqual(item.date);
		expect(recurrentItems[1].date).toEqual(item.date.addDays(2));
		expect(recurrentItems[2].date).toEqual(item.date.addDays(4));
		expect(recurrentItems[3].date).toEqual(item.date.addDays(6));
	});
});

describe("totalRecurrences", () => {
	it("should return the minus one recurrence for a infinite scheduled item", () => {
		const items = buildTestItems([{ recurrence: {} }]);
		const item = items[0].copy();
		const recurrences = item.recurrence?.totalRecurrences;

		expect(recurrences).toBe(-1);
	});

	it("should return the total recurrences for a scheduled item with until date", () => {
		const items = buildTestItems([
			{
				recurrence: {
					frequency: "2d",
					startDate: new Date(),
					untilDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
				},
			},
		]);
		const item = items[0].copy();
		const recurrences = item.recurrence?.totalRecurrences;

		expect(recurrences).toBe(8);
	});
});

describe("getNScheduledItemRecurrence", () => {
	it("should return the n recurrence for a single scheduled item", async () => {
		const items = buildTestItems(1);
		const expectedItem = items[0].copy();
		const item = items[0];
		const recurrenceItem = item.getNItemRecurrence(10);

		expect(recurrenceItem.id).toEqual(expectedItem.id);
		expect(recurrenceItem.date).toEqual(expectedItem.date);
	});

	it("should return the n recurrence for a infinite scheduled item", async () => {
		const items = buildTestItems([
			{
				recurrence: {
					frequency: "2d",
					startDate: new Date(2024, 0, 1),
				},
			},
		]);
		const expectedItem = items[0].copy();
		const item = items[0];
		const recurrenceItem = item.getNItemRecurrence(10);

		expect(recurrenceItem.id).toEqual(expectedItem.id);
		expect(recurrenceItem.date.value).toEqual(new Date(2024, 0, 21));
	});

	it("should return the total recurrences for a scheduled item with until date", async () => {
		const items = buildTestItems([
			{
				recurrence: {
					frequency: "2d",
					startDate: new Date(2024, 0, 1),
					untilDate: new Date(2024, 1, 1),
				},
			},
		]);
		const expectedItem = items[0].copy();
		const item = items[0];
		const recurrenceItem = item.getNItemRecurrence(10);

		expect(recurrenceItem.id).toEqual(expectedItem.id);
		expect(recurrenceItem.date.value).toEqual(new Date(2024, 0, 21));
	});
});

describe("createAllRecurrences", () => {
	it("should return the total recurrences for a scheduled item with until date", async () => {
		const items = buildTestItems([
			{
				recurrence: {
					frequency: "2d",
					startDate: new Date(2024, 0, 1),
					untilDate: new Date(2024, 0, 16),
				},
			},
		]);
		const expectedItem = items[0].copy();
		const item = items[0];
		const recurrences = item.createAllRecurrences();

		expect(recurrences[0].item.id).toEqual(expectedItem.id);
		expect(recurrences[0].item.date.value).toEqual(new Date(2024, 0, 1));
		expect(recurrences[1].item.date.value).toEqual(new Date(2024, 0, 3));
		expect(recurrences[2].item.date.value).toEqual(new Date(2024, 0, 5));
		expect(recurrences[3].item.date.value).toEqual(new Date(2024, 0, 7));
		expect(recurrences[4].item.date.value).toEqual(new Date(2024, 0, 9));
		expect(recurrences[5].item.date.value).toEqual(new Date(2024, 0, 11));
		expect(recurrences[6].item.date.value).toEqual(new Date(2024, 0, 13));
		expect(recurrences[7].item.date.value).toEqual(new Date(2024, 0, 15));
	});
});

describe("createItemsUntilDate", () => {
	it("should return the total recurrences for a scheduled item with until date", async () => {
		const items = buildTestItems([
			{
				date: new DateValueObject(new Date(2024, 0, 3)),
				recurrence: {
					frequency: "2d",
					startDate: new Date(2024, 0, 1),
					untilDate: new Date(2024, 1, 1),
				},
			},
		]);
		const expectedItem = items[0].copy();
		const item = items[0];
		const recurrences = item.createItemsUntilDate(
			new DateValueObject(new Date(2024, 0, 7))
		);

		expect(recurrences[0].item.id).toEqual(expectedItem.id);
		expect(recurrences[0].item.date.value).toEqual(new Date(2024, 0, 3));
		expect(recurrences[1].item.date.value).toEqual(new Date(2024, 0, 5));
		expect(recurrences[2].item.date.value).toEqual(new Date(2024, 0, 7));
	});
});
