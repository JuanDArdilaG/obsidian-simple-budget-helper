import { describe, expect, it } from "vitest";
import { buildTestItems } from "./buildTestItems";
import { ERecurrenceState, ItemDate } from "contexts/Items/domain";
import { DateValueObject } from "@juandardilag/value-objects";

describe("remainingDays", () => {
	it("should calculate remaining future 7 days correctly", () => {
		const items = buildTestItems([
			{
				recurrence: {
					frequency: "1w",
					startDate: DateValueObject.createNowDate().addDays(7),
				},
			},
		]);
		const item = items[0].copy();

		const str = item.recurrence.recurrences[0].date.remainingDaysStr;

		expect(str).toBe("7 days");
	});

	it("should calculate remaining previous 7 days correctly", () => {
		const items = buildTestItems([
			{
				recurrence: {
					frequency: "1w",
					startDate: DateValueObject.createNowDate().addDays(-7),
				},
			},
		]);
		const item = items[0].copy();
		const str = item.recurrence.recurrences[0].date.remainingDaysStr;

		expect(str).toBe("-7 days");
	});

	it("should calculate remaining 1 day correctly", () => {
		const items = buildTestItems([
			{
				recurrence: {
					frequency: "1w",
					startDate: DateValueObject.createNowDate().addDays(1),
				},
			},
		]);
		const item = items[0].copy();

		const str = item.recurrence.recurrences[0].date.remainingDaysStr;

		expect(str).toBe("1 day");
	});

	it("should calculate remaining 1 day correctly", () => {
		const items = buildTestItems([
			{
				recurrence: {
					frequency: "1w",
					startDate: DateValueObject.createNowDate().addDays(-1),
				},
			},
		]);
		const item = items[0].copy();

		const str = item.recurrence.recurrences[0].date.remainingDaysStr;

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

		const recurrentItems = item.recurrence
			.getRecurrencesUntilDate(ItemDate.createNowDate().addDays(7))
			.map((r) => r.recurrence);

		expect(recurrentItems.length).toBe(4);
		expect(recurrentItems[0].date).toEqual(
			item.recurrence.recurrences[0].date
		);
		expect(recurrentItems[1].date).toEqual(
			item.recurrence.recurrences[0].date.addDays(2)
		);
		expect(recurrentItems[2].date).toEqual(
			item.recurrence.recurrences[0].date.addDays(4)
		);
		expect(recurrentItems[3].date).toEqual(
			item.recurrence.recurrences[0].date.addDays(6)
		);
	});
});

describe("createRecurrences", () => {
	it("should return the total recurrences for a scheduled item with until date", async () => {
		const items = buildTestItems([
			{
				recurrence: {
					frequency: "2d",
					startDate: new DateValueObject(new Date(2024, 0, 1)),
					untilDate: new DateValueObject(new Date(2024, 0, 16)),
				},
			},
		]);
		const item = items[0];

		const recurrences = item.recurrence.recurrences;

		expect(recurrences[0].date.value).toEqual(new Date(2024, 0, 1));
		expect(recurrences[1].date.value).toEqual(new Date(2024, 0, 3));
		expect(recurrences[2].date.value).toEqual(new Date(2024, 0, 5));
		expect(recurrences[3].date.value).toEqual(new Date(2024, 0, 7));
		expect(recurrences[4].date.value).toEqual(new Date(2024, 0, 9));
		expect(recurrences[5].date.value).toEqual(new Date(2024, 0, 11));
		expect(recurrences[6].date.value).toEqual(new Date(2024, 0, 13));
		expect(recurrences[7].date.value).toEqual(new Date(2024, 0, 15));
	});
});

describe("createItemsUntilDate", () => {
	it("should returns the recurrences correctly when a modification is before the item date", async () => {
		const items = buildTestItems([
			{
				recurrence: {
					frequency: "2d",
					startDate: new DateValueObject(new Date(2024, 0, 15)),
					untilDate: new DateValueObject(new Date(2024, 1, 1)),
				},
				modifications: [
					{
						date: new DateValueObject(new Date(2024, 0, 2)),
						state: ERecurrenceState.PENDING,
					},
				],
			},
		]);
		const item = items[0];

		const recurrences = item.recurrence.getRecurrencesUntilDate(
			new DateValueObject(new Date(2024, 0, 5))
		);

		expect(recurrences).toHaveLength(1);
		expect(recurrences[0].recurrence.date.value).toEqual(
			new Date(2024, 0, 2)
		);
	});
});
