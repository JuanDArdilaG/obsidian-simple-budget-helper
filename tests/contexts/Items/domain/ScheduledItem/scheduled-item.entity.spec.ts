import { describe, expect, it } from "vitest";
import { buildTestItems } from "../buildTestItems";
import { ScheduledItemNextDate } from "contexts/ScheduledItems/domain";

describe("remainingDays", () => {
	it("should calculate remaining future 7 days correctly", () => {
		const now = new Date();
		const { scheduled } = buildTestItems({
			scheduled: [
				{
					date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
					recurrence: { frequency: "1w" },
				},
			],
		});
		const item = scheduled[0].copy();
		const str = item.date.remainingDaysStr;

		expect(str).toBe("7 days");
	});

	it("should calculate remaining previous 7 days correctly", () => {
		const now = new Date();
		const { scheduled } = buildTestItems({
			scheduled: [
				{
					date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
					recurrence: { frequency: "1w" },
				},
			],
		});
		const item = scheduled[0].copy();

		const str = item.date.remainingDaysStr;

		expect(str).toBe("-7 days");
	});

	it("should calculate remaining 1 day correctly", () => {
		const now = new Date();
		const { scheduled } = buildTestItems({
			scheduled: [
				{
					date: new Date(now.getTime() + 24 * 60 * 60 * 1000),
					recurrence: { frequency: "1w" },
				},
			],
		});
		const item = scheduled[0].copy();

		const str = item.date.remainingDaysStr;

		expect(str).toBe("1 day");
	});

	it("should calculate remaining 1 day correctly", () => {
		const now = new Date();
		now.setHours(0, 0, 0, 0);
		const { scheduled } = buildTestItems({
			scheduled: [
				{
					date: new Date(now.getTime() - 24 * 60 * 60 * 1000),
					recurrence: { frequency: "1w" },
				},
			],
		});
		const item = scheduled[0].copy();

		const str = item.date.remainingDaysStr;

		expect(str).toBe("-1 day");
	});
});

describe("createRecurretItemsBetweenDates", () => {
	it("should return scheduled items multiple times when recurrence repeats between dates", () => {
		const { scheduled } = buildTestItems({
			scheduled: [
				{
					recurrence: { frequency: "2d" },
				},
			],
		});
		const item = scheduled[0].copy();
		const items = item
			.createScheduledItemsUntilDate(
				ScheduledItemNextDate.createNowDate().addDays(7)
			)
			.map((r) => r.item);
		expect(items.length).toBe(4);
		expect(items[0].date).toEqual(item.date);
		expect(items[1].date).toEqual(item.date.addDays(2));
		expect(items[2].date).toEqual(item.date.addDays(4));
		expect(items[3].date).toEqual(item.date.addDays(6));
	});
});

describe("totalRecurrences", () => {
	it("should return the one recurrence for a single scheduled item", () => {
		const { scheduled } = buildTestItems({
			scheduled: 1,
		});
		const item = scheduled[0].copy();
		const recurrences = item.totalRecurrences;

		expect(recurrences).toBe(1);
	});

	it("should return the minus one recurrence for a infinite scheduled item", () => {
		const { scheduled } = buildTestItems({
			scheduled: [{ recurrence: {} }],
		});
		const item = scheduled[0].copy();
		const recurrences = item.totalRecurrences;

		expect(recurrences).toBe(-1);
	});

	it("should return the total recurrences for a scheduled item with until date", () => {
		const { scheduled } = buildTestItems({
			scheduled: [
				{
					recurrence: {
						frequency: "2d",
						startDate: new Date(),
						untilDate: new Date(
							Date.now() + 15 * 24 * 60 * 60 * 1000
						),
					},
				},
			],
		});
		const item = scheduled[0].copy();
		const recurrences = item.totalRecurrences;

		expect(recurrences).toBe(8);
	});
});

describe("getNScheduledItemRecurrence", () => {
	it("should return the n recurrence for a single scheduled item", async () => {
		const { scheduled } = buildTestItems({
			scheduled: 1,
		});
		const expectedItem = scheduled[0].copy();
		const item = scheduled[0];
		const recurrenceItem = item.getNScheduledItemRecurrence(10);

		expect(recurrenceItem.id).toEqual(expectedItem.id);
		expect(recurrenceItem.date).toEqual(expectedItem.date);
	});

	it("should return the n recurrence for a infinite scheduled item", async () => {
		const { scheduled } = buildTestItems({
			scheduled: [
				{
					recurrence: {
						frequency: "2d",
						startDate: new Date(2024, 0, 1),
					},
				},
			],
		});
		const expectedItem = scheduled[0].copy();
		const item = scheduled[0];
		const recurrenceItem = item.getNScheduledItemRecurrence(10);

		expect(recurrenceItem.id).toEqual(expectedItem.id);
		expect(recurrenceItem.date.value).toEqual(new Date(2024, 0, 21));
	});

	it("should return the total recurrences for a scheduled item with until date", async () => {
		const { scheduled } = buildTestItems({
			scheduled: [
				{
					recurrence: {
						frequency: "2d",
						startDate: new Date(2024, 0, 1),
						untilDate: new Date(2024, 1, 1),
					},
				},
			],
		});
		const expectedItem = scheduled[0].copy();
		const item = scheduled[0];
		const recurrenceItem = item.getNScheduledItemRecurrence(10);

		expect(recurrenceItem.id).toEqual(expectedItem.id);
		expect(recurrenceItem.date.value).toEqual(new Date(2024, 0, 21));
	});
});
